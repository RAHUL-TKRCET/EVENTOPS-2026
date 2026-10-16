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


def seed_event(Session, *, status="PUBLISHED", deadline_hours=6, event_id="evt-test"):
    db = Session()
    org = Organization(id="org-test", name="Test Org", type="Organization", country="India", city="Hyderabad")
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
    db.add_all([org, event])
    db.commit()
    db.close()


def test_public_discovery_lists_only_published_and_has_no_auth_requirement():
    client, Session, engine = seeded_client()
    try:
        seed_event(Session, status="PUBLISHED", event_id="evt-published")
        seed_event(Session, status="DRAFT", event_id="evt-draft")
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
            "eventId": "evt-test", "name": "Test User", "email": "new-participant@example.test"
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
            "eventId": "evt-test", "name": "Test User", "email": "expired-participant@example.test"
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
