from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.api.v1 import evaluation
from app.models.entities import Evaluation, Round, Team, User, Event, Judge, Organization


class FakeQuery:
    def __init__(self, value):
        self.value = value

    def filter(self, *conditions):
        return self

    def first(self):
        return self.value

    def order_by(self, *conditions):
        return self

    def all(self):
        return self.value


class FakeDB:
    def __init__(self, values):
        self.values = list(values)
        self.queried_models = []

    def query(self, model):
        self.queried_models.append(model)
        if not self.values:
            raise AssertionError(f"Unexpected query for {model.__name__}")
        return FakeQuery(self.values.pop(0))


def _judge_user():
    user = User(
        id="user-judge-1",
        name="Assigned Judge",
        email="judge@example.com",
        password_hash="not-used",
        role="JUDGE",
        organization_id="org-a",
    )
    user.active_role = "JUDGE"
    user.active_event_id = "evt-a"
    return user


def _team():
    return SimpleNamespace(
        id="T001",
        event_id="evt-a",
        name="Assigned Team",
        assigned_judges=[],
    )


def _round():
    return SimpleNamespace(id="rnd-1", event_id="evt-a")


def _record():
    return SimpleNamespace(
        id="eval-own",
        event_id="evt-a",
        round_id="rnd-1",
        judge_id="judge-db-id",
        team_id="T001",
        scores={"criterion-1": 17.0},
        total_score=17.0,
        feedback="Own feedback",
        strengths="Own strengths",
        areas_to_improve="Own improvement",
        status="SUBMITTED",
        submitted_at=None,
    )


def test_judge_scorecard_lookup_filters_by_current_judge(monkeypatch):
    judge = SimpleNamespace(id="judge-db-id", assigned_teams=["T001"])
    monkeypatch.setattr(evaluation, "_assigned_judge", lambda db, user, event_id: judge)
    db = FakeDB([_team(), _round(), _record()])

    result = evaluation.get_my_team_evaluation(
        team_id="T001",
        roundId="rnd-1",
        db=db,
        current_user=_judge_user(),
    )

    assert result is not None
    assert result.judgeId == "judge-db-id"
    assert result.scores == {"criterion-1": 17.0}
    assert db.queried_models == [Team, Round, Evaluation]


def test_judge_scorecard_lookup_denies_unassigned_team(monkeypatch):
    judge = SimpleNamespace(id="judge-db-id", assigned_teams=[])
    monkeypatch.setattr(evaluation, "_assigned_judge", lambda db, user, event_id: judge)
    db = FakeDB([_team()])

    with pytest.raises(HTTPException) as error:
        evaluation.get_my_team_evaluation(
            team_id="T001",
            roundId="rnd-1",
            db=db,
            current_user=_judge_user(),
        )

    assert error.value.status_code == 403
    assert db.queried_models == [Team]


def test_judge_history_is_filtered_to_active_event_and_current_judge(monkeypatch):
    judge = SimpleNamespace(id="judge-db-id", assigned_teams=["T001"])
    record = _record()
    team = _team()
    monkeypatch.setattr(evaluation, "_assigned_judge", lambda db, user, event_id: judge)
    db = FakeDB([[record], [team]])

    result = evaluation.get_my_evaluations(
        eventId="evt-a",
        db=db,
        current_user=_judge_user(),
    )

    assert len(result) == 1
    assert result[0].judgeId == "judge-db-id"
    assert result[0].teamId == "T001"
    assert result[0].teamName == "Assigned Team"
    assert db.queried_models == [Evaluation, Team]


def test_judge_history_rejects_a_different_event(monkeypatch):
    db = FakeDB([])

    with pytest.raises(HTTPException) as error:
        evaluation.get_my_evaluations(
            eventId="evt-foreign",
            db=db,
            current_user=_judge_user(),
        )

    assert error.value.status_code == 403
    assert db.queried_models == []



def test_team_evaluations_for_judge_return_only_own_scorecards(persisted_judge_db):
    db = persisted_judge_db
    user = _persisted_judge_user("user-a", "evt-a")
    event = _persisted_event("evt-a")
    team = Team(
        id="team-shared", event_id="evt-a", name="Shared Team",
        lead_name="Lead", lead_email="lead@example.com",
        project_title="Shared Project", project_domain="AI",
        qr_code_token="test-shared", assigned_judges=["judge-a", "judge-b"],
    )
    round_record = Round(
        id="round-a", event_id="evt-a", name="Round A", round_order=1,
        status="ACTIVE",
        start_time=datetime.now(timezone.utc) + timedelta(hours=1),
        end_time=datetime.now(timezone.utc) + timedelta(hours=2),
    )
    judges = [
        Judge(id="judge-a", event_id="evt-a", user_id=user.id, name=user.name, email=user.email, assigned_teams=["team-shared"]),
        Judge(id="judge-b", event_id="evt-a", user_id="user-b", name="Judge B", email="judge-b@example.com", assigned_teams=["team-shared"]),
    ]
    records = [
        Evaluation(id="eval-a", event_id="evt-a", round_id="round-a", judge_id="judge-a", team_id="team-shared", scores={"criterion-1": 8.0}, total_score=8.0, feedback="A private", strengths="", areas_to_improve="", status="SUBMITTED"),
        Evaluation(id="eval-b", event_id="evt-a", round_id="round-a", judge_id="judge-b", team_id="team-shared", scores={"criterion-1": 3.0}, total_score=3.0, feedback="B private", strengths="", areas_to_improve="", status="SUBMITTED"),
    ]
    db.add_all([event, user, team, round_record, *judges, *records])
    db.flush()

    result = evaluation.get_team_evaluations(team_id="team-shared", db=db, current_user=user)

    assert [item.id for item in result] == ["eval-a"]
    assert result[0].judgeId == "judge-a"
    assert result[0].feedback == "A private"


@pytest.mark.parametrize("role", ["PARTICIPANT", "VOLUNTEER", "COORDINATOR", "TECHNICAL_STAFF", "RESOURCE_MANAGER"])
def test_non_admin_event_roles_cannot_read_all_team_scorecards(persisted_judge_db, role):
    db = persisted_judge_db
    user = User(
        id=f"user-{role.lower()}",
        name=f"{role} user",
        email=f"{role.lower()}@example.com",
        password_hash="test-hash-not-used",
        role=role,
        organization_id=None,
    )
    user.active_role = role
    user.active_event_id = "evt-a"
    user.active_organization_id = None
    event = _persisted_event("evt-a")
    team = Team(
        id="team-private", event_id="evt-a", name="Private Team",
        lead_name="Lead", lead_email="lead@example.com",
        project_title="Private Project", project_domain="AI",
        qr_code_token="test-private", assigned_judges=[],
    )
    db.add_all([event, user, team])
    db.flush()

    with pytest.raises(HTTPException) as error:
        evaluation.get_team_evaluations(team_id="team-private", db=db, current_user=user)

    assert error.value.status_code == 403


def test_org_admin_in_scope_can_read_team_scorecards(persisted_judge_db):
    db = persisted_judge_db
    now = datetime.now(timezone.utc)
    org = Organization(
        id="org-a", name="Test Org", type="INSTITUTION", country="IN", city="Hyderabad",
        owner_id="user-admin", contact_email="admin@example.com",
    )
    user = User(
        id="user-admin", name="Admin", email="admin@example.com",
        password_hash="test-hash-not-used", role="ORGANIZATION_ADMIN", organization_id="org-a",
    )
    user.active_role = "ORGANIZATION_ADMIN"
    user.active_event_id = None
    user.active_organization_id = "org-a"
    event = Event(
        id="evt-a", organization_id="org-a", name="Event A", type="HACKATHON", status="PUBLISHED",
        start_date=now + timedelta(days=1), end_date=now + timedelta(days=2),
        registration_deadline=now + timedelta(hours=12),
    )
    team = Team(
        id="team-a", event_id="evt-a", name="Team A",
        lead_name="Lead", lead_email="lead@example.com",
        project_title="Project A", project_domain="AI", qr_code_token="test-admin",
    )
    records = [
        Evaluation(id="eval-a", event_id="evt-a", round_id="round-a", judge_id="judge-a", team_id="team-a", scores={"a": 1.0}, total_score=1.0, feedback="A", strengths="", areas_to_improve="", status="SUBMITTED"),
        Evaluation(id="eval-b", event_id="evt-a", round_id="round-a", judge_id="judge-b", team_id="team-a", scores={"b": 2.0}, total_score=2.0, feedback="B", strengths="", areas_to_improve="", status="SUBMITTED"),
    ]
    round_record = Round(
        id="round-a", event_id="evt-a", name="Round A", round_order=1,
        start_time=now + timedelta(hours=1), end_time=now + timedelta(hours=2),
    )
    db.add_all([org,user,event,team,round_record,*records])
    db.flush()

    result = evaluation.get_team_evaluations(team_id="team-a", db=db, current_user=user)

    assert {item.id for item in result} == {"eval-a", "eval-b"}
