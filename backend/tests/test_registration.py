import os
import sys
import uuid
from datetime import datetime, timedelta, timezone

import pytest
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
from app.core.email import EmailDeliveryError
from app.core.config import settings
import app.api.v1.auth as auth_module
from app.models.entities import Event, EventMember, Organization, OrganizationMembership, User, Round, RoundCriterion, AuditLog


@pytest.fixture
def client():
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=test_engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    test_client.registration_test_session = TestingSessionLocal
    yield test_client
    app.dependency_overrides.pop(get_db, None)
    test_engine.dispose()


def test_organization_registration_creates_owner_and_membership_atomically(client):
    email = f"owner-{uuid.uuid4().hex[:10]}@example.com"
    response = client.post("/api/v1/auth/register", json={
        "name": "Organization Owner", "email": email,
        "password": "A-strong-test-password-2026", "role": "ORGANIZATION_ADMIN",
        "organizationName": "Example Institute",
    })
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["user"]["role"] == "ORGANIZATION_ADMIN"
    assert body["user"]["organizationId"]
    assert body["accessToken"] and body["refreshToken"]

    db = client.registration_test_session()
    try:
        owner = db.query(User).filter(User.email == email).one()
        organization = db.query(Organization).filter(Organization.id == owner.organization_id).one()
        membership = db.query(OrganizationMembership).filter(
            OrganizationMembership.user_id == owner.id,
            OrganizationMembership.organization_id == organization.id,
        ).one()
        assert organization.name == "Example Institute"
        assert organization.owner_id == owner.id
        assert membership.role == "ORGANIZATION_ADMIN"
        assert membership.status == "ACTIVE"
    finally:
        db.close()


def test_duplicate_email_is_rejected(client):
    email = f"duplicate-{uuid.uuid4().hex[:10]}@example.com"
    payload = {"name": "Organization Owner", "email": email,
               "password": "A-strong-test-password-2026", "role": "ORGANIZATION_ADMIN",
               "organizationName": "Example Institute"}
    first = client.post("/api/v1/auth/register", json=payload)
    second = client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201, first.text
    assert second.status_code == 400
    assert "already exists" in second.json()["detail"].lower()


@pytest.mark.parametrize("role", ["SUPER_ADMIN", "EVENT_ADMIN", "JUDGE", "VOLUNTEER"])
def test_privileged_roles_cannot_be_self_registered(client, role):
    response = client.post("/api/v1/auth/register", json={
        "name": "Attempted Privilege Escalation",
        "email": f"role-{role.lower()}-{uuid.uuid4().hex[:8]}@example.com",
        "password": "A-strong-test-password-2026", "role": role,
    })
    assert response.status_code == 403



def test_account_creation_with_event_context_does_not_enroll_automatically(client):
    now = datetime.now(timezone.utc)
    event_id = f"evt-{uuid.uuid4().hex[:10]}"
    db = client.registration_test_session()
    try:
        db.add(Event(
            id=event_id, name="Account Creation Only", type="HACKATHON", status="PUBLISHED",
            description="A test event", location="Main Hall",
            start_date=now + timedelta(days=3), end_date=now + timedelta(days=4),
            registration_deadline=now + timedelta(days=2),
        ))
        db.commit()
    finally:
        db.close()

    # Account creation has no event-enrollment side effect. Enrollment remains a separate endpoint.
    response = client.post("/api/v1/auth/register", json={
        "name": "Context Participant",
        "email": f"context-{uuid.uuid4().hex[:10]}@example.com",
        "password": "A-strong-test-password-2026",
        "role": "PARTICIPANT",
    })
    assert response.status_code == 201, response.text
    user_id = response.json()["user"]["id"]
    db = client.registration_test_session()
    try:
        assert db.query(EventMember).filter(
            EventMember.event_id == event_id,
            EventMember.user_id == user_id,
            EventMember.role == "PARTICIPANT",
        ).count() == 0
    finally:
        db.close()


def test_participant_registration_does_not_attach_to_default_organization(client):
    response = client.post("/api/v1/auth/register", json={
        "name": "Participant Test",
        "email": f"participant-{uuid.uuid4().hex[:10]}@example.com",
        "password": "A-strong-test-password-2026", "role": "PARTICIPANT",
    })
    assert response.status_code == 201, response.text
    assert response.json()["user"]["role"] == "PARTICIPANT"
    assert response.json()["user"]["organizationId"] is None


def test_registration_rejects_arbitrary_organization_link(client):
    response = client.post("/api/v1/auth/register", json={
        "name": "Participant Test",
        "email": f"participant-{uuid.uuid4().hex[:10]}@example.com",
        "password": "A-strong-test-password-2026", "role": "PARTICIPANT",
        "organizationId": "org-01",
    })
    assert response.status_code == 400


def test_pages_origin_preflight_is_allowed(client):
    response = client.options("/api/v1/auth/register", headers={
        "Origin": "https://rahul-tkrcet.github.io",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    })
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://rahul-tkrcet.github.io"


def test_super_admin_cannot_mint_another_role_from_global_login(client):
    email = f"root-{uuid.uuid4().hex[:10]}@example.com"
    db = client.registration_test_session()
    try:
        db.add(User(id=f"usr-{uuid.uuid4().hex[:12]}", name="Platform Admin", email=email,
                    password_hash=get_password_hash("A-strong-test-password-2026"),
                    role="SUPER_ADMIN", organization_id=None))
        db.commit()
    finally:
        db.close()

    response = client.post("/api/v1/auth/login", json={
        "email": email, "password": "A-strong-test-password-2026", "role": "EVENT_ADMIN",
    })
    assert response.status_code == 403


def test_event_login_does_not_create_accounts_from_unlinked_roster_rows(client):
    email = f"roster-{uuid.uuid4().hex[:10]}@example.com"
    now = datetime.now(timezone.utc)
    db = client.registration_test_session()
    try:
        event_id = f"evt-{uuid.uuid4().hex[:10]}"
        db.add(Event(
            id=event_id, name="Isolated Test Event", type="HACKATHON",
            start_date=now + timedelta(days=1), end_date=now + timedelta(days=2),
            registration_deadline=now + timedelta(hours=12),
        ))
        db.flush()
        db.add(EventMember(
            id=f"mem-{uuid.uuid4().hex[:10]}", event_id=event_id, user_id=None,
            name="Roster Person", email=email, role="JUDGE", status="ACTIVE",
        ))
        db.commit()
    finally:
        db.close()

    response = client.post("/api/v1/auth/event-login", json={
        "eventId": event_id, "email": email,
        "password": "A-strong-test-password-2026", "role": "JUDGE",
    })
    assert response.status_code == 401
    db = client.registration_test_session()
    try:
        assert db.query(User).filter(User.email == email).first() is None
    finally:
        db.close()


def test_legacy_static_invitation_codes_are_not_accepted(client):
    response = client.post("/api/v1/auth/verify-invite", json={"inviteCode": "INV-JURY-2026"})
    assert response.status_code == 200
    assert response.json()["valid"] is False


def _create_participant_and_event(client, *, status="PUBLISHED", deadline_offset=timedelta(days=2)):
    email = f"event-participant-{uuid.uuid4().hex[:10]}@example.com"
    registered = client.post("/api/v1/auth/register", json={
        "name": "Event Participant",
        "email": email,
        "password": "A-strong-test-password-2026",
        "role": "PARTICIPANT",
    })
    assert registered.status_code == 201, registered.text
    token = registered.json()["accessToken"]
    user_id = registered.json()["user"]["id"]
    now = datetime.now(timezone.utc)
    event_id = f"evt-{uuid.uuid4().hex[:10]}"
    db = client.registration_test_session()
    try:
        db.add(Event(
            id=event_id,
            name="Participant Enrollment Test Event",
            type="HACKATHON",
            status=status,
            start_date=now + timedelta(days=1),
            end_date=now + timedelta(days=3),
            registration_deadline=now + deadline_offset,
        ))
        db.commit()
    finally:
        db.close()
    return email, token, user_id, event_id



def _create_org_admin_and_draft(client, *, description="Ready for publication", location="Tech Innovation Center",
                                status="DRAFT", start_offset=timedelta(days=7),
                                end_offset=timedelta(days=9), deadline_offset=timedelta(days=5)):
    email = f"admin-{uuid.uuid4().hex[:10]}@example.com"
    response = client.post("/api/v1/auth/register", json={
        "name": "Event Owner",
        "email": email,
        "password": "A-strong-test-password-2026",
        "role": "ORGANIZATION_ADMIN",
        "organizationName": f"Org {uuid.uuid4().hex[:6]}",
    })
    assert response.status_code == 201, response.text
    token = response.json()["accessToken"]
    organization_id = response.json()["user"]["organizationId"]
    now = datetime.now(timezone.utc)
    event_id = f"evt-{uuid.uuid4().hex[:10]}"
    db = client.registration_test_session()
    try:
        db.add(Event(
            id=event_id, name="Lifecycle Test Event", type="HACKATHON",
            description=description, location=location, status=status,
            organization_id=organization_id, owner_id=response.json()["user"]["id"],
            start_date=now + start_offset, end_date=now + end_offset,
            registration_deadline=now + deadline_offset,
        ))
        db.commit()
    finally:
        db.close()
    return token, event_id


def test_publish_event_changes_only_valid_draft_in_authorized_organization(client):
    token, event_id = _create_org_admin_and_draft(client)
    response = client.post(f"/api/v1/events/{event_id}/publish", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "PUBLISHED"

    db = client.registration_test_session()
    try:
        event = db.query(Event).filter(Event.id == event_id).one()
        assert event.status == "PUBLISHED"
    finally:
        db.close()


def test_publish_event_rejects_invalid_public_details_and_date_order(client):
    token, missing_description = _create_org_admin_and_draft(client, description="")
    invalid_response = client.post(
        f"/api/v1/events/{missing_description}/publish",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert invalid_response.status_code == 422
    assert "description" in str(invalid_response.json()["detail"]).lower()

    token2, invalid_dates = _create_org_admin_and_draft(
        client, start_offset=timedelta(days=9), end_offset=timedelta(days=7),
        deadline_offset=timedelta(days=5),
    )
    date_response = client.post(
        f"/api/v1/events/{invalid_dates}/publish",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert date_response.status_code == 422
    assert "end date" in str(date_response.json()["detail"]).lower()


def test_publish_and_delete_require_authentication_and_scope(client):
    _, event_id = _create_org_admin_and_draft(client)
    assert client.post(f"/api/v1/events/{event_id}/publish").status_code == 401
    assert client.delete(f"/api/v1/events/{event_id}").status_code == 401

    token, _ = _create_org_admin_and_draft(client)
    _, target_id = _create_org_admin_and_draft(client)
    participant = client.post("/api/v1/auth/register", json={
        "name": "Lifecycle Participant",
        "email": f"lifecycle-participant-{uuid.uuid4().hex[:8]}@example.com",
        "password": "A-strong-test-password-2026",
        "role": "PARTICIPANT",
    })
    assert participant.status_code == 201, participant.text
    participant_headers = {"Authorization": f"Bearer {participant.json()['accessToken']}"}
    assert client.post(
        f"/api/v1/events/{target_id}/publish",
        headers=participant_headers,
    ).status_code == 403
    assert client.delete(
        f"/api/v1/events/{target_id}",
        headers=participant_headers,
    ).status_code == 403

    denied_publish = client.post(
        f"/api/v1/events/{target_id}/publish",
        headers={"Authorization": f"Bearer {token}"},
    )
    denied_delete = client.delete(
        f"/api/v1/events/{target_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert denied_publish.status_code == 403
    assert denied_delete.status_code == 403


def test_delete_draft_allows_only_empty_draft_and_blocks_linked_history(client):
    token, empty_event_id = _create_org_admin_and_draft(client)
    deleted = client.delete(
        f"/api/v1/events/{empty_event_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert deleted.status_code == 204, deleted.text
    db = client.registration_test_session()
    try:
        assert db.query(Event).filter(Event.id == empty_event_id).first() is None
    finally:
        db.close()

    token2, linked_event_id = _create_org_admin_and_draft(client)
    db = client.registration_test_session()
    try:
        db.add(EventMember(
            id=f"mem-{uuid.uuid4().hex[:10]}", event_id=linked_event_id, user_id=None,
            name="Roster Placeholder", email=f"roster-{uuid.uuid4().hex[:8]}@example.com",
            role="PARTICIPANT", status="ACTIVE",
        ))
        db.commit()
    finally:
        db.close()

    blocked = client.delete(
        f"/api/v1/events/{linked_event_id}",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert blocked.status_code == 409
    assert "event_members" in str(blocked.json()["detail"])
    db = client.registration_test_session()
    try:
        assert db.query(Event).filter(Event.id == linked_event_id).first() is not None
    finally:
        db.close()



def test_delete_draft_allows_generated_rounds_and_preserves_audit_history(client):
    token, event_id = _create_org_admin_and_draft(client)
    db = client.registration_test_session()
    try:
        round_record = Round(
            id=f"rnd-{uuid.uuid4().hex[:8]}", event_id=event_id, name="Default Round",
            round_order=1, status="UPCOMING",
            start_time=datetime.now(timezone.utc) + timedelta(days=7),
            end_time=datetime.now(timezone.utc) + timedelta(days=8),
        )
        db.add(round_record)
        db.flush()
        db.add(RoundCriterion(
            id=f"crit-{uuid.uuid4().hex[:8]}", round_id=round_record.id,
            name="Default criterion", max_score=25, weight=1.0,
        ))
        db.add(AuditLog(
            event_id=event_id, action="DRAFT_CREATED",
            resource_type="Event", resource_id=event_id,
        ))
        db.commit()
    finally:
        db.close()

    response = client.delete(
        f"/api/v1/events/{event_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 204, response.text
    db = client.registration_test_session()
    try:
        assert db.query(Event).filter(Event.id == event_id).first() is None
        assert db.query(AuditLog).filter(
            AuditLog.event_id == event_id, AuditLog.action == "DRAFT_EVENT_DELETED"
        ).count() == 1
    finally:
        db.close()


def test_delete_draft_rejects_published_event_and_generic_status_updates(client):
    token, event_id = _create_org_admin_and_draft(client, status="PUBLISHED")
    delete_response = client.delete(
        f"/api/v1/events/{event_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert delete_response.status_code == 409

    update_response = client.put(
        f"/api/v1/events/{event_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"status": "DRAFT"},
    )
    assert update_response.status_code == 400


def test_event_registration_persists_membership_and_returns_scoped_session(client):
    email, token, user_id, event_id = _create_participant_and_event(client)
    response = client.post(
        "/api/v1/auth/event-registration",
        json={"eventId": event_id},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["eventId"] == event_id
    assert body["status"] == "ACTIVE"
    assert body["session"]["user"]["id"] == user_id
    assert body["session"]["accessToken"]

    db = client.registration_test_session()
    try:
        member = db.query(EventMember).filter(
            EventMember.event_id == event_id,
            EventMember.user_id == user_id,
            EventMember.role == "PARTICIPANT",
        ).one()
        assert member.email == email
        assert member.status == "ACTIVE"
        assert member.added_by == user_id
    finally:
        db.close()


def test_event_registration_is_idempotent(client):
    _, token, user_id, event_id = _create_participant_and_event(client)
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"eventId": event_id}
    first = client.post("/api/v1/auth/event-registration", json=payload, headers=headers)
    second = client.post("/api/v1/auth/event-registration", json=payload, headers=headers)
    assert first.status_code == 201, first.text
    assert second.status_code == 201, second.text
    assert first.json()["registrationId"] == second.json()["registrationId"]
    db = client.registration_test_session()
    try:
        assert db.query(EventMember).filter(
            EventMember.event_id == event_id,
            EventMember.user_id == user_id,
            EventMember.role == "PARTICIPANT",
        ).count() == 1
    finally:
        db.close()


def test_event_registration_rejects_unpublished_or_closed_event(client):
    _, token, _, event_id = _create_participant_and_event(
        client, status="DRAFT", deadline_offset=timedelta(days=2)
    )
    response = client.post(
        "/api/v1/auth/event-registration",
        json={"eventId": event_id},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 409
    assert "not published" in response.json()["detail"].lower()

    _, token2, _, closed_event_id = _create_participant_and_event(
        client, status="PUBLISHED", deadline_offset=timedelta(days=-1)
    )
    closed = client.post(
        "/api/v1/auth/event-registration",
        json={"eventId": closed_event_id},
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert closed.status_code == 409
    assert "deadline" in closed.json()["detail"].lower()


def test_event_registration_scope_does_not_allow_cross_event_from_scoped_token(client):
    _, token, _, event_a = _create_participant_and_event(client)
    _, _, _, event_b = _create_participant_and_event(client)
    scoped = client.post(
        "/api/v1/auth/event-registration",
        json={"eventId": event_a},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert scoped.status_code == 201, scoped.text
    scoped_token = scoped.json()["session"]["accessToken"]
    denied = client.post(
        "/api/v1/auth/event-registration",
        json={"eventId": event_b},
        headers={"Authorization": f"Bearer {scoped_token}"},
    )
    assert denied.status_code == 403


def test_event_registration_status_and_list_only_show_own_memberships(client):
    _, token, _, event_a = _create_participant_and_event(client)
    _, _, _, event_b = _create_participant_and_event(client)
    headers = {"Authorization": f"Bearer {token}"}
    status_before = client.get(f"/api/v1/auth/event-registration/{event_a}", headers=headers)
    assert status_before.status_code == 200
    assert status_before.json()["registered"] is False
    created = client.post(
        "/api/v1/auth/event-registration",
        json={"eventId": event_a},
        headers=headers,
    )
    assert created.status_code == 201, created.text
    scoped_token = created.json()["session"]["accessToken"]
    scoped_headers = {"Authorization": f"Bearer {scoped_token}"}
    status_after = client.get(f"/api/v1/auth/event-registration/{event_a}", headers=scoped_headers)
    assert status_after.status_code == 200
    assert status_after.json()["registered"] is True
    assert status_after.json()["registrationId"] == created.json()["registrationId"]
    other_status = client.get(f"/api/v1/auth/event-registration/{event_b}", headers=scoped_headers)
    assert other_status.status_code == 403
    listed = client.get("/api/v1/auth/event-registrations", headers=headers)
    assert listed.status_code == 200
    assert [row["eventId"] for row in listed.json()] == [event_a]


def test_event_registration_rejects_cross_event_context_when_existing_member_token_used(client):
    _, token, user_id, event_a = _create_participant_and_event(client)
    _, _, _, event_b = _create_participant_and_event(client)
    created = client.post(
        "/api/v1/auth/event-registration",
        json={"eventId": event_a},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert created.status_code == 201, created.text
    scoped_token = created.json()["session"]["accessToken"]
    # A scoped session may not inspect or enroll against a different event ID.
    response = client.get(
        f"/api/v1/auth/event-registration/{event_b}",
        headers={"Authorization": f"Bearer {scoped_token}"},
    )
    assert response.status_code == 403

def test_event_registration_status_does_not_leak_another_participants_record(client):
    _, token_a, _, event_id = _create_participant_and_event(client)
    _, token_b, _, _ = _create_participant_and_event(client)
    created = client.post(
        "/api/v1/auth/event-registration",
        json={"eventId": event_id},
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert created.status_code == 201, created.text
    response = client.get(
        f"/api/v1/auth/event-registration/{event_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert response.status_code == 200
    assert response.json()["registered"] is False
    assert response.json()["registrationId"] is None



def _published_event_for_public_registration(client):
    now = datetime.now(timezone.utc)
    event_id = f"evt-{uuid.uuid4().hex[:10]}"
    db = client.registration_test_session()
    try:
        db.add(Event(
            id=event_id, name="Public Registration Test", type="HACKATHON",
            description="Public test event", location="Main Hall", status="PUBLISHED",
            start_date=now + timedelta(days=5), end_date=now + timedelta(days=6),
            registration_deadline=now + timedelta(days=4),
        ))
        db.commit()
    finally:
        db.close()
    return event_id


def test_public_event_registration_creates_participant_and_membership_without_login(client, monkeypatch):
    event_id = _published_event_for_public_registration(client)
    delivered = []
    monkeypatch.setattr(auth_module, "send_participant_credentials",
        lambda to_email, name, email, password, event_name, eid: delivered.append(
            {"to": to_email, "email": email, "password": password, "eventId": eid}
        ))

    response = client.post("/api/v1/auth/public-event-registration", json={
        "eventId": event_id, "name": "Public Participant",
        "email": f"public-{uuid.uuid4().hex[:10]}@example.com",
        "phone": "9999999999", "organizationOrSchool": "TKR College",
    })
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["eventId"] == event_id
    assert body["emailStatus"] == "sent"
    assert body["registrationId"]
    assert len(delivered) == 1
    assert delivered[0]["password"]

    db = client.registration_test_session()
    try:
        member = db.query(EventMember).filter(EventMember.id == body["registrationId"]).one()
        user = db.query(User).filter(User.id == member.user_id).one()
        assert user.role == "PARTICIPANT"
        assert user.password_hash != delivered[0]["password"]
        assert member.phone == "9999999999"
        assert member.zone_or_dept == "TKR College"
        assert db.query(AuditLog).filter(
            AuditLog.event_id == event_id, AuditLog.action == "PUBLIC_PARTICIPANT_REGISTERED"
        ).count() == 1
    finally:
        db.close()


def test_public_event_registration_rolls_back_when_email_delivery_is_unavailable(client, monkeypatch):
    event_id = _published_event_for_public_registration(client)
    def fail_delivery(*_args, **_kwargs):
        raise EmailDeliveryError("smtp not configured")
    monkeypatch.setattr(auth_module, "send_participant_credentials", fail_delivery)
    email = f"undelivered-{uuid.uuid4().hex[:10]}@example.com"
    response = client.post("/api/v1/auth/public-event-registration", json={
        "eventId": event_id, "name": "Undelivered Participant", "email": email,
    })
    assert response.status_code == 503
    db = client.registration_test_session()
    try:
        assert db.query(User).filter(User.email == email).first() is None
        assert db.query(EventMember).filter(EventMember.event_id == event_id, EventMember.email == email).first() is None
    finally:
        db.close()


def test_public_event_registration_rejects_closed_or_unpublished_event(client, monkeypatch):
    now = datetime.now(timezone.utc)
    event_id = f"evt-{uuid.uuid4().hex[:10]}"
    db = client.registration_test_session()
    try:
        db.add(Event(
            id=event_id, name="Draft Public Registration", type="HACKATHON", status="DRAFT",
            start_date=now + timedelta(days=3), end_date=now + timedelta(days=4),
            registration_deadline=now + timedelta(days=2),
        ))
        db.commit()
    finally:
        db.close()
    monkeypatch.setattr(auth_module, "send_participant_credentials", lambda *_args, **_kwargs: None)
    response = client.post("/api/v1/auth/public-event-registration", json={
        "eventId": event_id, "name": "Draft Participant",
        "email": f"draft-{uuid.uuid4().hex[:8]}@example.com",
    })
    assert response.status_code == 409
    assert "published" in response.json()["detail"].lower()


def test_public_event_registration_never_overwrites_existing_account(client, monkeypatch):
    user_email = f"existing-{uuid.uuid4().hex[:10]}@example.com"
    existing = client.post("/api/v1/auth/register", json={
        "name": "Existing Participant", "email": user_email,
        "password": "A-strong-test-password-2026", "role": "PARTICIPANT",
    })
    assert existing.status_code == 201
    event_id = _published_event_for_public_registration(client)
    called = []
    monkeypatch.setattr(auth_module, "send_participant_credentials", lambda *_args, **_kwargs: called.append(True))
    response = client.post("/api/v1/auth/public-event-registration", json={
        "eventId": event_id, "name": "Attempted Takeover", "email": user_email,
    })
    assert response.status_code == 409
    assert called == []
    db = client.registration_test_session()
    try:
        user = db.query(User).filter(User.email == user_email).one()
        assert user.name == "Existing Participant"
        assert db.query(EventMember).filter(EventMember.event_id == event_id, EventMember.email == user_email).count() == 0
    finally:
        db.close()


def test_public_event_registration_rate_limits_repeated_attempts(client, monkeypatch):
    event_id = _published_event_for_public_registration(client)
    monkeypatch.setattr(settings, "PUBLIC_REGISTRATION_IP_LIMIT", 1)
    monkeypatch.setattr(auth_module, "send_participant_credentials", lambda *_args, **_kwargs: None)

    first = client.post("/api/v1/auth/public-event-registration", json={
        "eventId": event_id, "name": "First Public Participant",
        "email": f"first-{uuid.uuid4().hex[:10]}@example.com",
    })
    assert first.status_code == 201, first.text

    second = client.post("/api/v1/auth/public-event-registration", json={
        "eventId": event_id, "name": "Second Public Participant",
        "email": f"second-{uuid.uuid4().hex[:10]}@example.com",
    })
    assert second.status_code == 429, second.text
    assert "Retry-After" in second.headers
