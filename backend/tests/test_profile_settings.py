import os
import sys
import uuid

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
from app.models.entities import User, AuditLog


def _client_for(user):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = lambda: user
    client = TestClient(app)
    client._profile_session = Session
    client._profile_engine = engine
    return client


def _cleanup(client):
    app.dependency_overrides.pop(get_db, None)
    app.dependency_overrides.pop(get_current_user, None)
    client._profile_engine.dispose()


def test_profile_update_persists_safe_fields_and_audit_record():
    user = User(
        id=f"usr-{uuid.uuid4().hex[:8]}",
        name="Original Name",
        email=f"profile-{uuid.uuid4().hex[:8]}@example.com",
        password_hash="not-used",
        role="PARTICIPANT",
    )
    client = _client_for(user)
    try:
        db = client._profile_session()
        db.add(user)
        db.commit()

        response = client.patch("/api/v1/auth/me", json={
            "name": "Updated Name",
            "email": "updated@example.com",
            "phone": "+91 90000 12345",
        })
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["name"] == "Updated Name"
        assert body["email"] == "updated@example.com"
        assert body["phone"] == "+91 90000 12345"
        assert body["role"] == "PARTICIPANT"

        db = client._profile_session()
        saved = db.query(User).filter(User.id == user.id).one()
        assert saved.name == "Updated Name"
        assert saved.email == "updated@example.com"
        assert saved.phone == "+91 90000 12345"
        assert db.query(AuditLog).filter(AuditLog.action == "PROFILE_UPDATED").count() == 1
    finally:
        _cleanup(client)


def test_profile_update_rejects_duplicate_email_without_changing_user():
    user = User(
        id=f"usr-{uuid.uuid4().hex[:8]}",
        name="Original Name",
        email=f"profile-{uuid.uuid4().hex[:8]}@example.com",
        password_hash="not-used",
        role="PARTICIPANT",
    )
    other = User(
        id=f"usr-{uuid.uuid4().hex[:8]}",
        name="Other User",
        email="taken@example.com",
        password_hash="not-used",
        role="PARTICIPANT",
    )
    client = _client_for(user)
    try:
        db = client._profile_session()
        db.add_all([user, other])
        db.commit()

        response = client.patch("/api/v1/auth/me", json={
            "name": "Should Not Save",
            "email": "taken@example.com",
            "phone": "+91 90000 99999",
        })
        assert response.status_code == 409, response.text

        db = client._profile_session()
        saved = db.query(User).filter(User.id == user.id).one()
        assert saved.name == "Original Name"
        assert saved.email != "taken@example.com"
        assert saved.phone is None
    finally:
        _cleanup(client)
