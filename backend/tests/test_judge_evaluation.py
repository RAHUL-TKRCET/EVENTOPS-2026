from types import SimpleNamespace

import pytest
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.v1 import evaluation
from app.models.entities import Evaluation, Round, Team
from app.models.entities import User, Base, Event, Judge


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



def test_assigned_judge_resolver_uses_persisted_judge_row():
    """The real resolver must match both the authenticated user and active event."""
    from app.api.v1.evaluation import _assigned_judge

    user = _judge_user()
    db = FakeDB([SimpleNamespace(id="judge-db-id", user_id=user.id, event_id="evt-a")])

    resolved = _assigned_judge(db, user, "evt-a")

    assert resolved.id == "judge-db-id"
    assert db.queried_models == [evaluation.Judge]


@pytest.mark.parametrize("role,event_id", [
    ("PARTICIPANT", "evt-a"),
    ("EVENT_ADMIN", "evt-a"),
    ("JUDGE", "evt-b"),
])
def test_assigned_judge_resolver_rejects_wrong_role_or_event(role, event_id):
    from app.api.v1.evaluation import _assigned_judge

    user = _judge_user()
    user.active_role = role
    db = FakeDB([])

    with pytest.raises(HTTPException) as error:
        _assigned_judge(db, user, event_id)

    assert error.value.status_code == 403
    assert db.queried_models == []


def test_assigned_judge_resolver_rejects_missing_persisted_assignment():
    from app.api.v1.evaluation import _assigned_judge

    user = _judge_user()
    db = FakeDB([None])

    with pytest.raises(HTTPException) as error:
        _assigned_judge(db, user, "evt-a")

    assert error.value.status_code == 403
    assert db.queried_models == [evaluation.Judge]



@pytest.fixture
def persisted_judge_db():
    """Use a real SQLAlchemy session so assignment filters are actually exercised."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = Session()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def _persisted_event(event_id: str):
    now = datetime.now(timezone.utc)
    return Event(
        id=event_id,
        name=f"Event {event_id}",
        type="HACKATHON",
        status="PUBLISHED",
        start_date=now + timedelta(days=1),
        end_date=now + timedelta(days=2),
        registration_deadline=now + timedelta(hours=12),
    )


def _persisted_judge_user(user_id: str, event_id: str):
    user = User(
        id=user_id,
        name=f"Judge {user_id}",
        email=f"{user_id}@example.com",
        password_hash="test-hash-not-used",
        role="JUDGE",
        organization_id=None,
    )
    user.active_role = "JUDGE"
    user.active_event_id = event_id
    return user


def test_real_assignment_resolver_matches_user_and_event(persisted_judge_db):
    from app.api.v1.evaluation import _assigned_judge

    db = persisted_judge_db
    user = _persisted_judge_user("user-a", "evt-a")
    db.add_all([
        _persisted_event("evt-a"),
        _persisted_event("evt-b"),
        user,
        Judge(id="judge-other-event", event_id="evt-b", user_id=user.id, name="Judge A", email=user.email),
        Judge(id="judge-other-user", event_id="evt-a", user_id="user-b", name="Judge B", email="other@example.com"),
        Judge(id="judge-a-event-a", event_id="evt-a", user_id=user.id, name="Judge A", email=user.email),
    ])
    db.flush()

    result = _assigned_judge(db, user, "evt-a")

    assert result.id == "judge-a-event-a"
    assert result.user_id == user.id
    assert result.event_id == "evt-a"


def test_real_assignment_resolver_denies_missing_assignment(persisted_judge_db):
    from app.api.v1.evaluation import _assigned_judge

    db = persisted_judge_db
    user = _persisted_judge_user("user-a", "evt-a")
    db.add_all([_persisted_event("evt-a"), _persisted_event("evt-b"), user])
    db.flush()
    # Both nearby candidates are deliberately wrong: one has the wrong event,
    # and the other has the wrong user. A permissive lookup would grant access.
    db.add_all([
        Judge(id="judge-event-b", event_id="evt-b", user_id=user.id, name="Judge A", email=user.email),
        Judge(id="judge-user-b", event_id="evt-a", user_id="user-b", name="Judge B", email="other@example.com"),
    ])
    db.flush()

    with pytest.raises(HTTPException) as error:
        _assigned_judge(db, user, "evt-a")

    assert error.value.status_code == 403
    assert "assignment" in error.value.detail.lower()


def test_scorecard_endpoint_uses_real_assignment_resolver(persisted_judge_db):
    db = persisted_judge_db
    user = _persisted_judge_user("user-a", "evt-a")
    event = _persisted_event("evt-a")
    team = Team(
        id="team-a", event_id="evt-a", name="Team A",
        lead_name="Lead A", lead_email="lead-a@example.com",
        project_title="Project A", project_domain="AI",
        qr_code_token="test-token-a", assigned_judges=[],
    )
    round_record = Round(
        id="round-a", event_id="evt-a", name="Round A", round_order=1,
        status="ACTIVE",
        start_time=datetime.now(timezone.utc) + timedelta(hours=1),
        end_time=datetime.now(timezone.utc) + timedelta(hours=2),
    )
    judge = Judge(
        id="judge-a", event_id="evt-a", user_id=user.id,
        name=user.name, email=user.email, assigned_teams=["team-a"],
    )
    record = Evaluation(
        id="eval-a", event_id="evt-a", round_id="round-a", judge_id="judge-a",
        team_id="team-a", scores={"criterion-1": 8.0}, total_score=8.0,
        feedback="Persisted feedback", strengths="", areas_to_improve="",
        status="SUBMITTED",
    )
    db.add_all([event, user, team, round_record, judge, record])
    db.flush()

    result = evaluation.get_my_team_evaluation(
        team_id="team-a",
        roundId="round-a",
        db=db,
        current_user=user,
    )

    assert result is not None
    assert result.id == "eval-a"
    assert result.judgeId == "judge-a"
    assert result.scores == {"criterion-1": 8.0}
    assert result.feedback == "Persisted feedback"



def test_scorecard_endpoint_denies_unassigned_team_with_persisted_rows(persisted_judge_db):
    db = persisted_judge_db
    user = _persisted_judge_user("user-a", "evt-a")
    event = _persisted_event("evt-a")
    team = Team(
        id="team-unassigned", event_id="evt-a", name="Unassigned Team",
        lead_name="Lead", lead_email="lead@example.com",
        project_title="Unassigned Project", project_domain="AI",
        qr_code_token="test-token-unassigned", assigned_judges=[],
    )
    round_record = Round(
        id="round-a", event_id="evt-a", name="Round A", round_order=1,
        status="ACTIVE",
        start_time=datetime.now(timezone.utc) + timedelta(hours=1),
        end_time=datetime.now(timezone.utc) + timedelta(hours=2),
    )
    judge = Judge(
        id="judge-a", event_id="evt-a", user_id=user.id,
        name=user.name, email=user.email, assigned_teams=[],
    )
    db.add_all([event, user, team, round_record, judge])
    db.flush()

    with pytest.raises(HTTPException) as error:
        evaluation.get_my_team_evaluation(
            team_id="team-unassigned",
            roundId="round-a",
            db=db,
            current_user=user,
        )

    assert error.value.status_code == 403
    assert "not assigned" in error.value.detail.lower()
