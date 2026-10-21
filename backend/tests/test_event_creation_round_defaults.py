import os
import sys

import pytest
from pydantic import ValidationError

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.api.v1.events import _resolve_event_rounds
from app.schemas.entities import EventCreate, RoundSchema


START = "2030-10-28T08:00:00Z"
END = "2030-10-30T20:00:00Z"
DEADLINE = "2030-10-27T23:59:00Z"


def _payload(total_rounds: int, rounds=None) -> EventCreate:
    return EventCreate(
        name="Round Defaults Regression",
        type="Hackathon",
        description="Test default event round configuration.",
        location="Test venue",
        startDate=START,
        endDate=END,
        registrationDeadline=DEADLINE,
        expectedParticipants=25,
        totalRounds=total_rounds,
        rounds=rounds,
    )


def test_total_rounds_rejects_values_outside_supported_bounds():
    with pytest.raises(ValidationError):
        _payload(0)

    with pytest.raises(ValidationError):
        _payload(11)


def test_default_round_records_match_requested_total_rounds():
    total_rounds, rounds = _resolve_event_rounds(_payload(3))

    assert total_rounds == 3
    assert len(rounds) == 3
    assert [round_data.order for round_data in rounds] == [1, 2, 3]
    assert [round_data.name for round_data in rounds] == [
        "Screening",
        "Prototype Demo",
        "Jury Grand Finale",
    ]


def test_default_round_configuration_supports_one_and_more_than_three_rounds():
    one_total, one_round = _resolve_event_rounds(_payload(1))
    five_total, five_rounds = _resolve_event_rounds(_payload(5))

    assert one_total == 1
    assert len(one_round) == 1
    assert five_total == 5
    assert len(five_rounds) == 5
    assert [round_data.name for round_data in five_rounds[3:]] == [
        "Round 4",
        "Round 5",
    ]


def test_explicit_round_list_is_authoritative_for_persisted_total():
    custom_rounds = [
        RoundSchema(
            id="custom-1",
            name="Qualifiers",
            order=1,
            startTime=START,
            endTime=END,
            criteria=[],
        ),
        RoundSchema(
            id="custom-2",
            name="Finals",
            order=2,
            startTime=START,
            endTime=END,
            criteria=[],
        ),
    ]

    total_rounds, rounds = _resolve_event_rounds(_payload(3, rounds=custom_rounds))

    assert total_rounds == 2
    assert rounds == custom_rounds
