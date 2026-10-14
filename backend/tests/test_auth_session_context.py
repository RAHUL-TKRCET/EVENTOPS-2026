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
from app.models.entities import User


def test_current_user_returns_verified_event_role_and_organization_scope():
    user = User(
        id=f"usr-{uuid.uuid4().hex[:8]}",
        name="Assigned Judge",
        email=f"judge-{uuid.uuid4().hex[:8]}@example.com",
        password_hash="not-used",
        role="PARTICIPANT",
        organization_id="org-account",
    )
    # These are derived by get_current_user from the validated access JWT.
    user.active_role = "JUDGE"
    user.active_event_id = "event-assigned"
    user.active_organization_id = "org-event"

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    previous_db = app.dependency_overrides.get(get_db)
    previous_user = app.dependency_overrides.get(get_current_user)
    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = lambda: user
    try:
        response = TestClient(app).get("/api/v1/auth/me")
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["role"] == "JUDGE"
        assert body["organizationId"] == "org-event"
    finally:
        if previous_db is None:
            app.dependency_overrides.pop(get_db, None)
        else:
            app.dependency_overrides[get_db] = previous_db
        if previous_user is None:
            app.dependency_overrides.pop(get_current_user, None)
        else:
            app.dependency_overrides[get_current_user] = previous_user
        engine.dispose()
