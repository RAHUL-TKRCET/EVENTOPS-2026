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
from app.api.deps import get_current_user
from app.models.entities import AttendanceRecord, Event, Team, User, Organization, AuditLog


def _client_for(actor):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = lambda: actor
    client = TestClient(app)
    client.workspace_session = session_factory
    client.workspace_engine = engine
    return client


def _event(db, event_id):
    now = datetime.now(timezone.utc)
    event = Event(
        id=event_id,
        name="Workspace test event",
        type="HACKATHON",
        status="PUBLISHED",
        organization_id=None,
        start_date=now + timedelta(days=2),
        end_date=now + timedelta(days=3),
        registration_deadline=now + timedelta(days=1),
    )
    db.add(event)
    return event


def _close_client(client):
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_db, None)
    client.workspace_engine.dispose()


def test_resource_qr_scan_is_event_scoped_and_does_not_check_in_team():
    event_id = f"evt-{uuid.uuid4().hex[:10]}"
    actor = User(id=f"usr-{uuid.uuid4().hex[:10]}", name="Resource Manager",
                 email=f"resource-{uuid.uuid4().hex[:8]}@example.com",
                 password_hash="hash", role="RESOURCE_MANAGER")
    actor.active_role = "RESOURCE_MANAGER"
    actor.active_event_id = event_id
    client = _client_for(actor)
    try:
        db = client.workspace_session()
        try:
            _event(db, event_id)
            team = Team(
                id=f"team-{uuid.uuid4().hex[:8]}", event_id=event_id,
                name="Verified Team", lead_name="Team Lead", lead_email="lead@example.com",
                project_title="Verified project", project_domain="AI",
                registration_status="APPROVED", check_in_status="NOT_CHECKED_IN",
                qr_code_token=f"real-token-{uuid.uuid4().hex}",
            )
            db.add(team)
            db.commit()
            team_id, qr_token = team.id, team.qr_code_token
        finally:
            db.close()

        response = client.post("/api/v1/resources/scan-team", json={
            "eventId": event_id, "qrToken": qr_token,
        })
        assert response.status_code == 200, response.text
        assert response.json()["teamId"] == team_id
        assert response.json()["eventId"] == event_id

        db = client.workspace_session()
        try:
            team = db.query(Team).filter(Team.id == team_id).one()
            assert team.check_in_status == "NOT_CHECKED_IN"
            assert db.query(AttendanceRecord).filter(AttendanceRecord.event_id == event_id).count() == 0
        finally:
            db.close()

        other_event = client.post("/api/v1/resources/scan-team", json={
            "eventId": event_id + "-wrong", "qrToken": qr_token,
        })
        assert other_event.status_code == 404
    finally:
        _close_client(client)


def test_super_admin_overview_requires_global_unscoped_session():
    event_id = f"evt-{uuid.uuid4().hex[:10]}"
    actor = User(id=f"usr-{uuid.uuid4().hex[:10]}", name="Super Admin",
                 email=f"super-{uuid.uuid4().hex[:8]}@example.com",
                 password_hash="hash", role="SUPER_ADMIN")
    actor.active_role = "SUPER_ADMIN"
    actor.active_event_id = None
    client = _client_for(actor)
    try:
        db = client.workspace_session()
        try:
            _event(db, event_id)
            db.add(Organization(
                id=f"org-{uuid.uuid4().hex[:8]}", name="Workspace Org", type="COLLEGE",
                country="India", city="Hyderabad",
            ))
            db.add(AuditLog(
                event_id=event_id, action="WORKSPACE_TEST", resource_type="Event",
                resource_id=event_id, user_role="SUPER_ADMIN",
            ))
            db.commit()
        finally:
            db.close()

        response = client.get("/api/v1/admin/overview")
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["counts"]["events"] == 1
        assert body["counts"]["organizations"] == 1
        assert body["counts"]["auditRecords"] == 1
        assert body["eventsByStatus"]["PUBLISHED"] == 1
        assert body["recentActivity"][0]["action"] == "WORKSPACE_TEST"
    finally:
        _close_client(client)


def test_super_admin_overview_rejects_event_scoped_super_admin_session():
    actor = User(id=f"usr-{uuid.uuid4().hex[:10]}", name="Scoped Admin",
                 email=f"scoped-{uuid.uuid4().hex[:8]}@example.com",
                 password_hash="hash", role="SUPER_ADMIN")
    actor.active_role = "SUPER_ADMIN"
    actor.active_event_id = f"evt-{uuid.uuid4().hex[:8]}"
    client = _client_for(actor)
    try:
        response = client.get("/api/v1/admin/overview")
        assert response.status_code == 403, response.text
    finally:
        _close_client(client)
