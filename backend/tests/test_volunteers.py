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
from app.api.deps import get_current_user
from app.models.entities import AuditLog, Event, User, Volunteer, VolunteerTask


def build_client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db
    client = TestClient(app)
    client.workforce_session = SessionLocal
    client.workforce_engine = engine
    return client


def test_volunteer_sees_only_own_event_tasks_and_may_advance_status():
    client = build_client()
    now = datetime.now(timezone.utc)
    event_id = f"evt-{uuid.uuid4().hex[:10]}"
    actor_id = f"usr-{uuid.uuid4().hex[:10]}"
    task_id = f"task-{uuid.uuid4().hex[:10]}"
    db = client.workforce_session()
    try:
        db.add(Event(
            id=event_id, name="Volunteer API Test", type="HACKATHON", status="PUBLISHED",
            start_date=now + timedelta(days=2), end_date=now + timedelta(days=3),
            registration_deadline=now + timedelta(days=1),
        ))
        actor = User(
            id=actor_id, name="Assigned Volunteer", email=f"{actor_id}@example.com",
            password_hash=get_password_hash("test-password-123"), role="VOLUNTEER",
        )
        db.add(actor)
        db.flush()
        volunteer = Volunteer(
            id=f"vol-{uuid.uuid4().hex[:10]}", event_id=event_id, user_id=actor_id,
            name=actor.name, email=actor.email, role="Entrance", zone="Main Gate", status="ACTIVE",
        )
        db.add(volunteer)
        db.flush()
        task = VolunteerTask(
            id=task_id, event_id=event_id, volunteer_id=volunteer.id,
            title="Check participant wristbands", description="Verify event pass at entry.",
            zone="Main Gate", status="PENDING",
        )
        db.add(task)
        db.commit()
        actor.active_role = "VOLUNTEER"
        actor.active_event_id = event_id
    finally:
        db.close()

    app.dependency_overrides[get_current_user] = lambda: actor
    try:
        response = client.get(f"/api/v1/volunteers/mine?eventId={event_id}")
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["volunteer"]["id"].startswith("vol-")
        assert [item["id"] for item in payload["tasks"]] == [task_id]

        accepted = client.patch(f"/api/v1/volunteers/tasks/{task_id}/status", json={"status": "ACCEPTED"})
        assert accepted.status_code == 200, accepted.text
        assert accepted.json()["status"] == "ACCEPTED"

        started = client.patch(f"/api/v1/volunteers/tasks/{task_id}/status", json={"status": "IN_PROGRESS"})
        assert started.status_code == 200, started.text

        completed = client.patch(f"/api/v1/volunteers/tasks/{task_id}/status", json={"status": "COMPLETED"})
        assert completed.status_code == 200, completed.text
        assert completed.json()["status"] == "COMPLETED"

        invalid = client.patch(f"/api/v1/volunteers/tasks/{task_id}/status", json={"status": "PENDING"})
        assert invalid.status_code == 422, invalid.text

        db = client.workforce_session()
        try:
            audit_count = db.query(AuditLog).filter(
                AuditLog.event_id == event_id,
                AuditLog.action == "VOLUNTEER_TASK_STATUS_CHANGED",
                AuditLog.resource_id == task_id,
            ).count()
            assert audit_count == 3
        finally:
            db.close()
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_db, None)
        client.workforce_engine.dispose()


def test_volunteer_cannot_access_other_event_or_other_volunteers_task():
    client = build_client()
    now = datetime.now(timezone.utc)
    event_ids = [f"evt-{uuid.uuid4().hex[:10]}", f"evt-{uuid.uuid4().hex[:10]}"]
    actor_ids = [f"usr-{uuid.uuid4().hex[:10]}", f"usr-{uuid.uuid4().hex[:10]}"]
    volunteer_ids = [f"vol-{uuid.uuid4().hex[:10]}", f"vol-{uuid.uuid4().hex[:10]}"]
    task_ids = [f"task-{uuid.uuid4().hex[:10]}", f"task-{uuid.uuid4().hex[:10]}"]
    db = client.workforce_session()
    try:
        for index in range(2):
            db.add(Event(
                id=event_ids[index], name=f"Volunteer Scope {index}", type="HACKATHON",
                status="PUBLISHED", start_date=now + timedelta(days=2),
                end_date=now + timedelta(days=3), registration_deadline=now + timedelta(days=1),
            ))
            db.add(User(
                id=actor_ids[index], name=f"Volunteer {index}", email=f"{actor_ids[index]}@example.com",
                password_hash=get_password_hash("test-password-123"), role="VOLUNTEER",
            ))
        db.flush()
        for index in range(2):
            db.add(Volunteer(
                id=volunteer_ids[index], event_id=event_ids[index], user_id=actor_ids[index],
                name=f"Volunteer {index}", email=f"{actor_ids[index]}@example.com",
                role="Zone", zone="Gate", status="ACTIVE",
            ))
            db.add(VolunteerTask(
                id=task_ids[index], event_id=event_ids[index], volunteer_id=volunteer_ids[index],
                title=f"Task {index}", status="PENDING",
            ))
        db.commit()
        actor = db.query(User).filter(User.id == actor_ids[0]).one()
        actor.active_role = "VOLUNTEER"
        actor.active_event_id = event_ids[0]
    finally:
        db.close()

    app.dependency_overrides[get_current_user] = lambda: actor
    try:
        wrong_event = client.get(f"/api/v1/volunteers/mine?eventId={event_ids[1]}")
        assert wrong_event.status_code == 403, wrong_event.text
        other_task = client.patch(f"/api/v1/volunteers/tasks/{task_ids[1]}/status", json={"status": "ACCEPTED"})
        assert other_task.status_code == 404, other_task.text
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_db, None)
        client.workforce_engine.dispose()
