import os
import sys
import uuid

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
from app.models.entities import Organization, OrganizationMembership, User


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
    # Do not use TestClient as a context manager here: its lifespan would touch
    # the application-level database. These tests use only the isolated SQLite DB.
    test_client = TestClient(app)
    test_client.registration_test_session = TestingSessionLocal
    yield test_client
    app.dependency_overrides.pop(get_db, None)
    test_engine.dispose()


def test_organization_registration_creates_owner_and_membership_atomically(client):
    email = f"owner-{uuid.uuid4().hex[:10]}@example.com"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Organization Owner",
            "email": email,
            "password": "A-strong-test-password-2026",
            "role": "ORGANIZATION_ADMIN",
            "organizationName": "Example Institute",
        },
    )

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["user"]["role"] == "ORGANIZATION_ADMIN"
    assert body["user"]["organizationId"]
    assert body["accessToken"]
    assert body["refreshToken"]

    # Inspect the isolated test database, not Supabase or the deployed service.
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
    payload = {
        "name": "Organization Owner",
        "email": email,
        "password": "A-strong-test-password-2026",
        "role": "ORGANIZATION_ADMIN",
        "organizationName": "Example Institute",
    }
    first = client.post("/api/v1/auth/register", json=payload)
    second = client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201, first.text
    assert second.status_code == 400
    assert "already exists" in second.json()["detail"].lower()


@pytest.mark.parametrize("role", ["SUPER_ADMIN", "EVENT_ADMIN", "JUDGE", "VOLUNTEER"])
def test_privileged_roles_cannot_be_self_registered(client, role):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Attempted Privilege Escalation",
            "email": f"role-{role.lower()}-{uuid.uuid4().hex[:8]}@example.com",
            "password": "A-strong-test-password-2026",
            "role": role,
        },
    )
    assert response.status_code == 403


def test_participant_registration_does_not_attach_to_default_organization(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Participant Test",
            "email": f"participant-{uuid.uuid4().hex[:10]}@example.com",
            "password": "A-strong-test-password-2026",
            "role": "PARTICIPANT",
        },
    )
    assert response.status_code == 201, response.text
    assert response.json()["user"]["role"] == "PARTICIPANT"
    assert response.json()["user"]["organizationId"] is None


def test_registration_rejects_arbitrary_organization_link(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Participant Test",
            "email": f"participant-{uuid.uuid4().hex[:10]}@example.com",
            "password": "A-strong-test-password-2026",
            "role": "PARTICIPANT",
            "organizationId": "org-01",
        },
    )
    assert response.status_code == 400

def test_pages_origin_preflight_is_allowed(client):
    response = client.options(
        "/api/v1/auth/register",
        headers={
            "Origin": "https://rahul-tkrcet.github.io",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://rahul-tkrcet.github.io"
