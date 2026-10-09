import pytest
from fastapi.testclient import TestClient
from app.main import app

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
    """Verify events listing and details."""
    response = client.get("/api/v1/events/evt-01")
    assert response.status_code == 200
    event = response.json()
    assert event["id"] == "evt-01"
    assert len(event["rounds"]) >= 1


def test_teams_and_qr_scan():
    """Verify team query and cryptographic QR badge scan."""
    teams_res = client.get("/api/v1/teams?eventId=evt-01")
    assert teams_res.status_code == 200
    teams = teams_res.json()
    assert len(teams) >= 1

    first_team = teams[0]
    qr_token = first_team["qrCodeToken"]

    # Scan the team badge
    scan_res = client.post("/api/v1/teams/scan", json={"qrToken": qr_token, "eventId": "evt-01"})
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

    # Check leaderboard
    lb_res = client.get("/api/v1/evaluation/leaderboard/evt-01")
    assert lb_res.status_code == 200
    leaderboard = lb_res.json()
    assert len(leaderboard) >= 1
    assert leaderboard[0]["teamId"] == "T001"
