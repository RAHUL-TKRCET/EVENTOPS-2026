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
from app.models.entities import Event, EventMember, User


def test_participant_event_login_requires_matching_active_membership():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        email = f"participant-login-{uuid.uuid4().hex[:10]}@example.com"
        password = "A-strong-test-password-2026"
        user_id = f"usr-{uuid.uuid4().hex[:12]}"
        event_id = f"evt-{uuid.uuid4().hex[:10]}"
        other_event_id = f"evt-{uuid.uuid4().hex[:10]}"
        now = datetime.now(timezone.utc)

        db = SessionLocal()
        try:
            db.add(User(
                id=user_id,
                name="Participant Login Test",
                email=email,
                password_hash=get_password_hash(password),
                role="PARTICIPANT",
            ))
            db.add_all([
                Event(
                    id=event_id,
                    name="Participant Login Event",
                    type="HACKATHON",
                    status="PUBLISHED",
                    start_date=now + timedelta(days=1),
                    end_date=now + timedelta(days=2),
                    registration_deadline=now + timedelta(hours=12),
                ),
                Event(
                    id=other_event_id,
                    name="Other Event",
                    type="HACKATHON",
                    status="PUBLISHED",
                    start_date=now + timedelta(days=1),
                    end_date=now + timedelta(days=2),
                    registration_deadline=now + timedelta(hours=12),
                ),
            ])
            db.add(EventMember(
                id=f"mem-{uuid.uuid4().hex[:10]}",
                event_id=event_id,
                user_id=user_id,
                name="Participant Login Test",
                email=email,
                role="PARTICIPANT",
                status="ACTIVE",
            ))
            db.commit()
        finally:
            db.close()

        client = TestClient(app)
        allowed = client.post("/api/v1/auth/event-login", json={
            "eventId": event_id,
            "email": email,
            "password": password,
            "role": "PARTICIPANT",
        })
        assert allowed.status_code == 200, allowed.text
        assert allowed.json()["user"]["id"] == user_id
        assert allowed.json()["user"]["role"] == "PARTICIPANT"
        assert allowed.json()["accessToken"]

        denied = client.post("/api/v1/auth/event-login", json={
            "eventId": other_event_id,
            "email": email,
            "password": password,
            "role": "PARTICIPANT",
        })
        assert denied.status_code == 403, denied.text
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()
