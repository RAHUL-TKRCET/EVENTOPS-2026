import os
import sys
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
from app.core.email import EmailDeliveryError
from app.models.entities import AuditLog, Event, EventMember, Organization, User


def seeded_client():
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
    client = TestClient(app)
    return client, Session, engine


def seed_event(Session, *, status="PUBLISHED", deadline_hours=6, event_id="evt-test", org_id=None):
    db = Session()
    org_id = org_id or f"org-{event_id}"
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if org is None:
        org = Organization(id=org_id, name=f"Test Org {event_id}", type="Organization", country="India", city="Hyderabad")
        db.add(org)
    event = Event(
        id=event_id,
        organization_id=org.id,
        owner_id=None,
        name="Public Test Event",
        type="Hackathon",
        description="Public event for registration tests",
        location="Hyderabad",
        start_date=datetime.now(timezone.utc) + timedelta(days=1),
        end_date=datetime.now(timezone.utc) + timedelta(days=2),
        registration_deadline=(datetime.now(timezone.utc) + timedelta(hours=deadline_hours)) if deadline_hours is not None else None,
        status=status,
        expected_participants=20,
        current_round=1,
        total_rounds=2,
    )
    db.add(event)
    db.commit()
    db.close()


def test_public_discovery_lists_only_published_and_has_no_auth_requirement():
    client, Session, engine = seeded_client()
    try:
        seed_event(Session, status="PUBLISHED", event_id="evt-published", org_id="org-discovery")
        seed_event(Session, status="DRAFT", event_id="evt-draft", org_id="org-discovery")
        response = client.get("/api/v1/events/public")
        assert response.status_code == 200
        assert [event["id"] for event in response.json()] == ["evt-published"]
        assert "organizationId" not in response.json()[0]
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def test_registration_unpublished_event_returns_typed_error_without_user_mutation():
    client, Session, engine = seeded_client()
    try:
        seed_event(Session, status="DRAFT")
        response = client.post("/api/v1/auth/public-event-registration", json={
            "eventId": "evt-test", "name": "Test User", "email": "new.participant@example.com"
        })
        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "EVENT_NOT_PUBLISHED"
        db = Session()
        try:
            assert db.query(User).filter(User.email == "new-participant@example.test").count() == 0
            assert db.query(EventMember).filter(EventMember.event_id == "evt-test").count() == 0
        finally:
            db.close()
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def test_registration_deadline_expired_returns_typed_error_without_user_mutation():
    client, Session, engine = seeded_client()
    try:
        seed_event(Session, deadline_hours=-1)
        response = client.post("/api/v1/auth/public-event-registration", json={
            "eventId": "evt-test", "name": "Test User", "email": "expired.participant@example.com"
        })
        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "REGISTRATION_CLOSED"
        db = Session()
        try:
            assert db.query(User).filter(User.email == "expired-participant@example.test").count() == 0
            assert db.query(EventMember).filter(EventMember.event_id == "evt-test").count() == 0
        finally:
            db.close()
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def test_public_registration_existing_account_preserves_identity_and_role(monkeypatch):
    from app.core.security import get_password_hash

    client, Session, engine = seeded_client()
    email = "existing.account@example.com"
    try:
        seed_event(Session, event_id="evt-existing-account")
        db = Session()
        try:
            existing = User(
                id="usr-existing-account",
                name="Existing Organization Admin",
                email=email,
                password_hash=get_password_hash("Existing-password-123!"),
                role="ORGANIZATION_ADMIN",
                organization_id=None,
            )
            db.add(existing)
            db.commit()
        finally:
            db.close()

        response = client.post("/api/v1/auth/public-event-registration", json={
            "eventId": "evt-existing-account",
            "name": "Attempted Replacement",
            "email": email,
        })
        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "PARTICIPANT_ACCOUNT_EXISTS"

        db = Session()
        try:
            persisted = db.query(User).filter(User.email == email).one()
            assert persisted.id == "usr-existing-account"
            assert persisted.name == "Existing Organization Admin"
            assert persisted.role == "ORGANIZATION_ADMIN"
            assert db.query(EventMember).filter(
                EventMember.event_id == "evt-existing-account",
                EventMember.email == email,
            ).count() == 0
        finally:
            db.close()
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def test_public_registration_existing_event_membership_returns_typed_conflict():
    client, Session, engine = seeded_client()
    email = "already.member@example.com"
    try:
        seed_event(Session, event_id="evt-existing-member")
        db = Session()
        try:
            db.add(EventMember(
                id="mem-existing-member",
                event_id="evt-existing-member",
                user_id=None,
                name="Existing Member",
                email=email,
                role="PARTICIPANT",
                status="ACTIVE",
            ))
            db.commit()
        finally:
            db.close()

        response = client.post("/api/v1/auth/public-event-registration", json={
            "eventId": "evt-existing-member",
            "name": "Duplicate Member",
            "email": email,
        })
        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "PARTICIPANT_ALREADY_REGISTERED"

        db = Session()
        try:
            assert db.query(User).filter(User.email == email).count() == 0
            assert db.query(EventMember).filter(
                EventMember.event_id == "evt-existing-member",
                EventMember.email == email,
                EventMember.role == "PARTICIPANT",
            ).count() == 1
        finally:
            db.close()
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def test_public_registration_smtp_failure_rolls_back_user_and_membership(monkeypatch):
    import app.api.v1.auth as auth_module

    def fail_delivery(*_args, **_kwargs):
        raise EmailDeliveryError("isolated smtp failure")

    monkeypatch.setattr(auth_module, "send_participant_credentials", fail_delivery)
    client, Session, engine = seeded_client()
    email = "smtp.failure@example.com"
    try:
        seed_event(Session, event_id="evt-smtp-failure")
        response = client.post("/api/v1/auth/public-event-registration", json={
            "eventId": "evt-smtp-failure",
            "name": "SMTP Rollback Test",
            "email": email,
        })
        assert response.status_code == 503
        assert response.json()["detail"]["code"] == "EMAIL_DELIVERY_UNAVAILABLE"

        db = Session()
        try:
            # The attempt audit remains committed to preserve throttling; the
            # new identity/membership and success audit must be rolled back.
            assert db.query(User).filter(User.email == email).count() == 0
            assert db.query(EventMember).filter(
                EventMember.event_id == "evt-smtp-failure",
                EventMember.email == email,
            ).count() == 0
            assert db.query(AuditLog).filter(
                AuditLog.event_id == "evt-smtp-failure",
                AuditLog.action == "PUBLIC_REGISTRATION_ATTEMPT",
            ).count() == 1
            assert db.query(AuditLog).filter(
                AuditLog.event_id == "evt-smtp-failure",
                AuditLog.action == "PUBLIC_PARTICIPANT_REGISTERED",
            ).count() == 0
        finally:
            db.close()
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def test_public_registration_ip_throttle_survives_rejected_attempt(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "PUBLIC_REGISTRATION_IP_LIMIT", 1)
    monkeypatch.setattr(settings, "PUBLIC_REGISTRATION_IP_WINDOW_MINUTES", 30)
    client, Session, engine = seeded_client()
    try:
        seed_event(Session, status="DRAFT", event_id="evt-throttle")
        first = client.post("/api/v1/auth/public-event-registration", json={
            "eventId": "evt-throttle",
            "name": "Throttle Test",
            "email": "throttle.one@example.com",
        })
        assert first.status_code == 409
        assert first.json()["detail"]["code"] == "EVENT_NOT_PUBLISHED"

        second = client.post("/api/v1/auth/public-event-registration", json={
            "eventId": "evt-throttle",
            "name": "Throttle Test",
            "email": "throttle.two@example.com",
        })
        assert second.status_code == 429
        assert int(second.headers["Retry-After"]) > 0

        db = Session()
        try:
            assert db.query(AuditLog).filter(
                AuditLog.event_id == "evt-throttle",
                AuditLog.action == "PUBLIC_REGISTRATION_ATTEMPT",
            ).count() == 1
            assert db.query(User).filter(User.email.in_([
                "throttle.one@example.com", "throttle.two@example.com"
            ])).count() == 0
            assert db.query(EventMember).filter(EventMember.event_id == "evt-throttle").count() == 0
        finally:
            db.close()
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
