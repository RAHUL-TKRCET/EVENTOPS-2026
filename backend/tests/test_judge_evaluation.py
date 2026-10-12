from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.api.v1 import evaluation
from app.models.entities import Evaluation, Round, Team
from app.models.entities import User


class FakeQuery:
    def __init__(self, value):
        self.value = value

    def filter(self, *conditions):
        return self

    def first(self):
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
