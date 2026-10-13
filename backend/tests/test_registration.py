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
from app.models.entities import Event, EventMember, Organization, OrganizationMembership, User


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
