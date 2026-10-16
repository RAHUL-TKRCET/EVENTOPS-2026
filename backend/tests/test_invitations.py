import os
import sys
import uuid
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.entities import AuditLog, Event, EventMember, Invitation, Judge, Organization, OrganizationMembership, User, Volunteer


def _token(user_id: str, role: str, organization_id: str | None, event_id: str | None = None) -> str:
    from app.core.security import create_access_token
    claims = {"email": "owner@example.com", "role": role, "organizationId": organization_id, "name": "Test Actor"}
    if event_id:
        claims["eventId"] = event_id
    return create_access_token(subject=user_id, claims=claims)


def _seeded_client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app), Session, engine


def _seed_org_event(Session):
    now = datetime.now(timezone.utc)
    db = Session()
    org = Organization(id="org-invite", name="Invitation Test Org", type="Organization", country="India", city="Hyderabad")
    owner = User(id="usr-owner", name="Org Owner", email="owner@example.com", password_hash=get_password_hash("Owner-password-123"), role="ORGANIZATION_ADMIN", organization_id="org-invite")
    event = Event(id="evt-invite", organization_id="org-invite", owner_id="usr-owner", name="Invitation Test Event", type="HACKATHON", start_date=now + timedelta(days=1), end_date=now + timedelta(days=2), registration_deadline=now + timedelta(hours=12))
    membership = OrganizationMembership(id="membership-owner", user_id="usr-owner", organization_id="org-invite", role="ORGANIZATION_ADMIN", status="ACTIVE")
    db.add_all([org, owner, event, membership])
    db.commit()
    db.close()


def test_invitation_acceptance_creates_account_event_assignment_and_audit_log():
    client, Session, engine = _seeded_client()
    try:
        _seed_org_event(Session)
        headers = {"Authorization": f"Bearer {_token('usr-owner', 'ORGANIZATION_ADMIN', 'org-invite')}"}
        created = client.post("/api/v1/invitations", headers=headers, json={
            "email": "new-judge@example.com", "role": "JUDGE", "eventId": "evt-invite",
        })
        assert created.status_code == 201, created.text
        data = created.json()
        assert data["emailDelivery"] == "NOT_CONFIGURED"
        assert data["acceptanceUrl"] is None
        assert data["token"]
        db = Session()
        invitation = db.query(Invitation).filter(Invitation.id == data["id"]).one()
        assert invitation.token_hash != data["token"]
        assert len(invitation.token_hash) == 64
        db.close()

        verified = client.post("/api/v1/invitations/verify", json={"token": data["token"]})
        assert verified.status_code == 200 and verified.json()["valid"] is True
        accepted = client.post("/api/v1/invitations/accept", json={
            "token": data["token"], "name": "New Judge", "password": "Judge-password-123",
        })
        assert accepted.status_code == 200, accepted.text
        assert accepted.json()["role"] == "JUDGE"
        assert accepted.json()["accountCreated"] is True

        db = Session()
        user = db.query(User).filter(User.email == "new-judge@example.com").one()
        member = db.query(EventMember).filter(EventMember.user_id == user.id, EventMember.event_id == "evt-invite").one()
        invitation = db.query(Invitation).filter(Invitation.id == data["id"]).one()
        assert member.role == "JUDGE" and member.status == "ACTIVE"
        assert invitation.status == "ACCEPTED" and invitation.accepted_at is not None
        assert db.query(AuditLog).filter(AuditLog.resource_id == invitation.id).count() >= 2
        db.close()

        reused = client.post("/api/v1/invitations/accept", json={
            "token": data["token"], "name": "New Judge", "password": "Judge-password-123",
        })
        assert reused.status_code == 410
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()


def test_invitation_cannot_be_created_for_another_organization():
    client, Session, engine = _seeded_client()
    try:
        _seed_org_event(Session)
        now = datetime.now(timezone.utc)
        db = Session()
        db.add(Organization(id="org-other", name="Other Org", type="Organization", country="India", city="Hyderabad"))
        db.add(Event(id="evt-other", organization_id="org-other", owner_id="other-owner", name="Other Event", type="HACKATHON", start_date=now + timedelta(days=1), end_date=now + timedelta(days=2), registration_deadline=now + timedelta(hours=12)))
        db.commit()
        db.close()
        headers = {"Authorization": f"Bearer {_token('usr-owner', 'ORGANIZATION_ADMIN', 'org-invite')}"}
        denied = client.post("/api/v1/invitations", headers=headers, json={
            "email": "attacker@example.com", "role": "JUDGE", "eventId": "evt-other",
        })
        assert denied.status_code == 403
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()


def test_revoked_invitation_cannot_be_verified_or_accepted():
    client, Session, engine = _seeded_client()
    try:
        _seed_org_event(Session)
        headers = {"Authorization": f"Bearer {_token('usr-owner', 'ORGANIZATION_ADMIN', 'org-invite')}"}
        created = client.post("/api/v1/invitations", headers=headers, json={
            "email": "revoked-judge@example.com", "role": "JUDGE", "eventId": "evt-invite",
        })
        assert created.status_code == 201, created.text
        item = created.json()
        revoked = client.post(f"/api/v1/invitations/{item['id']}/revoke", headers=headers)
        assert revoked.status_code == 200 and revoked.json()["status"] == "REVOKED"
        verified = client.post("/api/v1/invitations/verify", json={"token": item["token"]})
        assert verified.status_code == 200 and verified.json()["valid"] is False
        accepted = client.post("/api/v1/invitations/accept", json={
            "token": item["token"], "name": "Revoked Judge", "password": "Judge-password-123",
        })
        assert accepted.status_code == 410
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()


def test_existing_account_can_accept_without_changing_existing_password_or_name():
    client, Session, engine = _seeded_client()
    try:
        _seed_org_event(Session)
        db = Session()
        existing = User(id="usr-existing", name="Existing User", email="existing-judge@example.com", password_hash=get_password_hash("Original-password-123"), role="PARTICIPANT", organization_id="org-invite")
        db.add(existing)
        db.commit()
        db.close()
        headers = {"Authorization": f"Bearer {_token('usr-owner', 'ORGANIZATION_ADMIN', 'org-invite')}"}
        created = client.post("/api/v1/invitations", headers=headers, json={
            "email": "existing-judge@example.com", "role": "JUDGE", "eventId": "evt-invite",
        })
        assert created.status_code == 201, created.text
        token = created.json()["token"]
        accepted = client.post("/api/v1/invitations/accept", json={"token": token})
        assert accepted.status_code == 200, accepted.text
        db = Session()
        user = db.query(User).filter(User.id == "usr-existing").one()
        member = db.query(EventMember).filter(EventMember.user_id == user.id, EventMember.event_id == "evt-invite").one()
        assert user.name == "Existing User"
        assert member.role == "JUDGE" and member.status == "ACTIVE"
        from app.core.security import verify_password
        assert verify_password("Original-password-123", user.password_hash)
        db.close()
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()


def test_expired_invitation_is_persisted_as_expired_and_rejected():
    client, Session, engine = _seeded_client()
    try:
        _seed_org_event(Session)
        headers = {"Authorization": f"Bearer {_token('usr-owner', 'ORGANIZATION_ADMIN', 'org-invite')}"}
        created = client.post("/api/v1/invitations", headers=headers, json={
            "email": "expired-judge@example.com", "role": "JUDGE", "eventId": "evt-invite",
        })
        assert created.status_code == 201, created.text
        item = created.json()
        db = Session()
        invitation = db.query(Invitation).filter(Invitation.id == item["id"]).one()
        invitation.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        db.commit()
        db.close()
        verified = client.post("/api/v1/invitations/verify", json={"token": item["token"]})
        assert verified.status_code == 200 and verified.json()["valid"] is False
        db = Session()
        invitation = db.query(Invitation).filter(Invitation.id == item["id"]).one()
        assert invitation.status == "EXPIRED"
        db.close()
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()


def test_invitation_list_and_revoke_are_limited_to_authorized_event_scope():
    client, Session, engine = _seeded_client()
    try:
        _seed_org_event(Session)
        headers = {"Authorization": f"Bearer {_token('usr-owner', 'ORGANIZATION_ADMIN', 'org-invite')}"}
        created = client.post("/api/v1/invitations", headers=headers, json={
            "email": "list-revoke@example.com", "role": "VOLUNTEER", "eventId": "evt-invite",
        })
        assert created.status_code == 201, created.text
        item = created.json()

        listed = client.get("/api/v1/invitations?eventId=evt-invite", headers=headers)
        assert listed.status_code == 200, listed.text
        assert any(row["id"] == item["id"] and row["email"] == item["email"] for row in listed.json())

        denied = client.get("/api/v1/invitations?eventId=evt-other", headers=headers)
        # Unknown/cross-tenant event identifiers must not disclose another tenant's invitation set.
        assert denied.status_code in {403, 404}

        db = Session()
        other_org = Organization(id="org-other", name="Other Org", type="Organization", country="India", city="Hyderabad")
        other_owner = User(id="usr-other-owner", name="Other Owner", email="other-owner@example.com", password_hash=get_password_hash("Owner-password-123"), role="ORGANIZATION_ADMIN", organization_id="org-other")
        other_event = Event(id="evt-other", organization_id="org-other", owner_id="usr-other-owner", name="Other Event", type="HACKATHON", start_date=datetime.now(timezone.utc) + timedelta(days=1), end_date=datetime.now(timezone.utc) + timedelta(days=2), registration_deadline=datetime.now(timezone.utc) + timedelta(hours=12))
        other_membership = OrganizationMembership(id="membership-other-owner", user_id="usr-other-owner", organization_id="org-other", role="ORGANIZATION_ADMIN", status="ACTIVE")
        db.add_all([other_org, other_owner, other_event, other_membership])
        db.commit()
        db.close()

        other_headers = {"Authorization": f"Bearer {_token('usr-other-owner', 'ORGANIZATION_ADMIN', 'org-other')}"}
        other_created = client.post("/api/v1/invitations", headers=other_headers, json={
            "email": "other@example.com", "role": "JUDGE", "eventId": "evt-other",
        })
        assert other_created.status_code == 201, other_created.text

        cross_tenant_revoke = client.post(
            f"/api/v1/invitations/{other_created.json()['id']}/revoke",
            headers=headers,
        )
        assert cross_tenant_revoke.status_code == 403

        revoked = client.post(f"/api/v1/invitations/{item['id']}/revoke", headers=headers)
        assert revoked.status_code == 200 and revoked.json()["status"] == "REVOKED"
        list_after_revoke = client.get("/api/v1/invitations?eventId=evt-invite", headers=headers)
        assert list_after_revoke.status_code == 200
        assert next(row for row in list_after_revoke.json() if row["id"] == item["id"])["status"] == "REVOKED"
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()


def test_volunteer_invitation_provisions_event_scoped_record_and_repairs_legacy_assignment():
    client, Session, engine = _seeded_client()
    try:
        _seed_org_event(Session)
        headers = {"Authorization": f"Bearer {_token('usr-owner', 'ORGANIZATION_ADMIN', 'org-invite')}"}
        created = client.post("/api/v1/invitations", headers=headers, json={
            "email": "new-volunteer@example.com", "role": "VOLUNTEER", "eventId": "evt-invite",
        })
        assert created.status_code == 201, created.text
        token = created.json()["token"]
        accepted = client.post("/api/v1/invitations/accept", json={
            "token": token, "name": "New Volunteer", "password": "Volunteer-password-123",
        })
        assert accepted.status_code == 200, accepted.text
        assert accepted.json()["role"] == "VOLUNTEER"

        db = Session()
        user = db.query(User).filter(User.email == "new-volunteer@example.com").one()
        user_id = user.id
        assignment = db.query(Volunteer).filter(
            Volunteer.event_id == "evt-invite", Volunteer.user_id == user.id,
        ).one()
        assert assignment.status == "ACTIVE"
        assert assignment.role == "VOLUNTEER"
        assert assignment.zone == "UNASSIGNED"
        assert assignment.name == user.name
        assert assignment.email == user.email

        # Simulate an old active membership whose Volunteer row was lost; re-acceptance repairs it.
        db.query(Volunteer).filter(Volunteer.id == assignment.id).delete()
        invitation = db.query(Invitation).filter(Invitation.id == created.json()["id"]).one()
        invitation.status = "PENDING"
        invitation.accepted_at = None
        db.commit()
        db.close()
        repairedResponse = client.post("/api/v1/invitations/accept", json={
            "token": token, "name": "New Volunteer", "password": "Volunteer-password-123",
        })
        assert repairedResponse.status_code == 200, repairedResponse.text
        db = Session()
        repaired = db.query(Volunteer).filter(
            Volunteer.event_id == "evt-invite", Volunteer.email == "new-volunteer@example.com",
        ).one()
        assert repaired.user_id == user_id and repaired.status == "ACTIVE"
        db.close()
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()
