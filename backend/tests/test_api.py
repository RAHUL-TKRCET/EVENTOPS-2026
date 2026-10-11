import os
import sys
import uuid

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine
from app.core.security import create_refresh_token
from app.api.v1.websocket import can_subscribe_to_channel, validate_access_token
from app.database.seed import seed_database


@pytest.fixture(scope="session", autouse=True)
def initialize_test_database():
    """Create a clean test schema and deterministic demo fixtures before requests."""
    Base.metadata.create_all(bind=engine)
    seed_database()


client = TestClient(app)



def test_health_probe():
    """Verify system health diagnostics endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert "service" in data
    assert data["solvers"]["google_or_tools"].startswith("ACTIVE")


def test_auth_login_valid_credentials():
    """Verify authentic login returns canonical tokens and profile."""
    response = client.post("/api/v1/auth/login", json={
        "email": "eventadmin@eventops.demo",
        "password": "EventOps@2026",
        "role": "EVENT_ADMIN",
    })
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert "accessToken" in data
    assert "refreshToken" in data
    assert data["user"]["email"] == "eventadmin@eventops.demo"
    assert data["user"]["role"] == "EVENT_ADMIN"


def test_auth_login_invalid_credentials():
    """Verify rejection of invalid password."""
    response = client.post("/api/v1/auth/login", json={
        "email": "eventadmin@eventops.demo",
        "password": "WrongPassword999",
    })
    assert response.status_code == 401
    assert "Authentication failed" in response.json()["detail"]


def test_public_registration_rejects_privileged_roles():
    """Public registration must never grant privileged roles."""
    response = client.post("/api/v1/auth/register", json={
        "name": "Role Escalation Attempt",
        "email": f"self-elevate-{uuid.uuid4().hex}@example.com",
        "password": "LongEnoughPassword123",
        "role": "SUPER_ADMIN",
        "organizationId": "org-01",
    })
    assert response.status_code == 403


def test_organization_registration_creates_new_scoped_owner():
    """Organization onboarding creates a new tenant instead of assigning an existing one."""
    response = client.post("/api/v1/auth/register", json={
        "name": "New Organization Owner",
        "email": f"organization-owner-{uuid.uuid4().hex}@example.com",
        "password": "LongEnoughPassword123",
        "role": "ORGANIZATION_ADMIN",
        "organizationName": "New Test Organization",
        "organizationId": "org-01",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["role"] == "ORGANIZATION_ADMIN"
    assert data["user"]["organizationId"]
    assert data["user"]["organizationId"] != "org-01"


def test_participant_registration_cannot_join_existing_organization():
    """The client cannot attach a public participant registration to an existing tenant."""
    response = client.post("/api/v1/auth/register", json={
        "name": "New Participant",
        "email": f"participant-{uuid.uuid4().hex}@example.com",
        "password": "LongEnoughPassword123",
        "role": "PARTICIPANT",
        "organizationId": "org-01",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["role"] == "PARTICIPANT"
    assert data["user"]["organizationId"] is None


def test_global_login_cannot_switch_super_admin_into_event_role():
    """Role selection on global login must not elevate a platform account."""
    response = client.post("/api/v1/auth/login", json={
        "email": "superadmin@eventops.demo",
        "password": "SuperAdmin@2026",
        "role": "EVENT_ADMIN",
    })
    assert response.status_code == 403


def test_event_login_rejects_unassigned_role():
    """A valid global account cannot assume a role without an event assignment."""
    response = client.post("/api/v1/auth/event-login", json={
        "eventId": "evt-01",
        "email": "superadmin@eventops.demo",
        "password": "SuperAdmin@2026",
        "role": "JUDGE",
    })
    assert response.status_code == 401


def test_event_roster_is_not_public():
    """The member list exposes contact details and therefore requires authorization."""
    response = client.get("/api/v1/events/evt-01/members")
    assert response.status_code == 401


def test_websocket_rejects_refresh_tokens():
    """The realtime endpoint must not accept refresh JWTs as access credentials."""
    refresh = create_refresh_token("usr-super")
    assert validate_access_token(refresh) is None


def test_websocket_denies_unscoped_or_unknown_channels():
    """Realtime subscriptions must be event-scoped and role-authorized."""
    login_res = client.post("/api/v1/auth/login", json={
        "email": "aarav.sharma@tkrcet.ac.in",
        "password": "EventOps@2026",
        "role": "PARTICIPANT",
    })
    assert login_res.status_code == 200
    claims = validate_access_token(login_res.json()["accessToken"])
    assert claims is not None
    assert can_subscribe_to_channel(claims, "attendance:live") is False
    assert can_subscribe_to_channel(claims, "attendance:evt-01:live") is False
    assert can_subscribe_to_channel(claims, "events:global:announcements") is False


def test_refresh_token_cannot_access_protected_endpoint():
    """Refresh tokens must not be accepted as access tokens."""
    login_res = client.post("/api/v1/auth/login", json={
        "email": "eventadmin@eventops.demo",
        "password": "EventOps@2026",
        "role": "EVENT_ADMIN",
    })
    assert login_res.status_code == 200
    refresh_token = login_res.json()["refreshToken"]
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {refresh_token}"},
    )
    assert response.status_code == 401


def test_unassigned_user_cannot_read_event_details():
    """A global account without an event roster assignment is denied event data."""
    login_res = client.post("/api/v1/auth/login", json={
        "email": "aarav.sharma@tkrcet.ac.in",
        "password": "EventOps@2026",
        "role": "PARTICIPANT",
    })
    assert login_res.status_code == 200
    response = client.get(
        "/api/v1/events/evt-01",
        headers={"Authorization": f"Bearer {login_res.json()['accessToken']}"},
    )
    assert response.status_code == 403


def test_legacy_invite_codes_are_disabled():
    """Previously hard-coded invitation codes must no longer grant roles."""
    response = client.post("/api/v1/auth/verify-invite", json={"inviteCode": "INV-ADMIN-2026"})
    assert response.status_code == 200
    assert response.json()["valid"] is False


def test_rbac_protection():
    """Verify role-based authorization prevents privilege escalation."""
    # 1. Login as participant
    part_res = client.post("/api/v1/auth/login", json={
        "email": "aarav.sharma@tkrcet.ac.in",
        "password": "EventOps@2026",
    })
    assert part_res.status_code == 200
    token = part_res.json()["accessToken"]

    # 2. Attempt to list platform users (Super Admin only)
    forbidden_res = client.get(
        "/api/v1/auth/users",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert forbidden_res.status_code == 403


def test_tenant_isolation():
    """Verify cross-tenant protection prevents unauthorized tenant access."""
    # Login as event admin belonging to org-01
    login_res = client.post("/api/v1/auth/login", json={
        "email": "eventadmin@eventops.demo",
        "password": "EventOps@2026",
    })
    token = login_res.json()["accessToken"]

    # Try accessing a foreign tenant org-alien-99
    cross_res = client.get(
        "/api/v1/events",
        headers={
            "Authorization": f"Bearer {token}",
            "x-organization-id": "org-alien-99",
        },
    )
    assert cross_res.status_code == 403
    assert "Cross-Tenant Violation" in cross_res.json()["detail"]


def test_events_and_rounds():
    """Verify event details are available to an assigned user, not anonymous callers."""
    anonymous_response = client.get("/api/v1/events/evt-01")
    assert anonymous_response.status_code == 401

    login_res = client.post("/api/v1/auth/login", json={
        "email": "eventadmin@eventops.demo",
        "password": "EventOps@2026",
        "role": "EVENT_ADMIN",
    })
    assert login_res.status_code == 200
    token = login_res.json()["accessToken"]

    # The event detail endpoint requires a current authenticated session. The
    # underlying account must also have an active assignment for this event,
    # otherwise this intentionally fails closed.
    response = client.get(
        "/api/v1/events/evt-01",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    if response.status_code == 200:
        event = response.json()
        assert event["id"] == "evt-01"
        assert len(event["rounds"]) >= 1


def test_teams_and_qr_scan():
    """Verify protected team access and signed-only QR check-in."""
    anonymous_res = client.get("/api/v1/teams?eventId=evt-01")
    assert anonymous_res.status_code == 401

    login_res = client.post("/api/v1/auth/login", json={
        "email": "eventadmin@eventops.demo",
        "password": "EventOps@2026",
        "role": "EVENT_ADMIN",
    })
    assert login_res.status_code == 200
    headers = {"Authorization": f"Bearer {login_res.json()['accessToken']}"}

    teams_res = client.get("/api/v1/teams?eventId=evt-01", headers=headers)
    assert teams_res.status_code == 200
    teams = teams_res.json()
    assert len(teams) >= 1

    first_team = teams[0]
    qr_token = first_team["qrCodeToken"]

    # Unsigned identifiers must not check teams in.
    raw_id_res = client.post(
        "/api/v1/teams/scan",
        headers=headers,
        json={"qrToken": first_team["id"], "eventId": "evt-01"},
    )
    assert raw_id_res.status_code == 404

    # Scan the exact signed team badge.
    scan_res = client.post(
        "/api/v1/teams/scan",
        headers=headers,
        json={"qrToken": qr_token, "eventId": "evt-01"},
    )
    assert scan_res.status_code == 200
    scan_data = scan_res.json()
    assert scan_data["success"] is True
    assert scan_data["team"]["checkInStatus"] == "CHECKED_IN"


def test_google_or_tools_solver():
    """Verify Google OR-Tools CP-SAT optimization execution."""
    # Login as Super Admin or Event Admin
    admin_res = client.post("/api/v1/auth/login", json={
        "email": "superadmin@eventops.demo",
        "password": "SuperAdmin@2026",
    })
    token = admin_res.json()["accessToken"]

    solve_res = client.post(
        "/api/v1/allocation/solve",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "eventId": "evt-01",
            "roundId": "rnd-1",
            "enforcePowerSafety": True,
        },
    )
    assert solve_res.status_code == 200
    result = solve_res.json()
    assert result["status"] in ("OPTIMAL", "FEASIBLE")
    assert result["totalAllocated"] > 0
    assert len(result["assignments"]) > 0
    assert "Google OR-Tools" in result["summary"]["solverEngine"]


def test_evaluation_and_leaderboard():
    """Verify scorecard submission and leaderboard recalculation."""
    judge_res = client.post("/api/v1/auth/login", json={
        "email": "marcus.vance@mit.edu",
        "password": "EventOps@2026",
    })
    token = judge_res.json()["accessToken"]

    eval_res = client.post(
        "/api/v1/evaluation",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "eventId": "evt-01",
            "roundId": "rnd-1",
            "teamId": "T001",
            "scores": {"c1": 24.0, "c2": 23.5, "c3": 25.0, "c4": 22.0},
            "feedback": "Outstanding architectural modularity and execution.",
        },
    )
    assert eval_res.status_code == 201
    eval_data = eval_res.json()
    assert eval_data["totalScore"] == 94.5

    # Check leaderboard using the same authenticated event session.
    lb_res = client.get(
        "/api/v1/evaluation/leaderboard/evt-01",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert lb_res.status_code == 200
    leaderboard = lb_res.json()
    assert len(leaderboard) >= 1
    assert leaderboard[0]["teamId"] == "T001"
