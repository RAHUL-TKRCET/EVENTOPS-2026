import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from app.main import app
from app.models.entities import Event, User
from app.api.v1.events import require_event_scope
from app.api.v1.evaluation import _assigned_judge

client = TestClient(app)


def _user(role: str, organization_id: str | None = None, event_id: str | None = None) -> User:
    user = User(id='test-user', name='Test Actor', email='test@example.com', password_hash='not-used', role=role, organization_id=organization_id)
    user.active_role = role
    user.active_organization_id = organization_id
    user.active_event_id = event_id
    return user


def _event(event_id: str, organization_id: str, owner_id: str = 'owner') -> Event:
    return Event(id=event_id, name='Test Event', type='HACKATHON', organization_id=organization_id, owner_id=owner_id)


def test_organization_admin_cannot_cross_organization_event_scope():
    actor = _user('ORGANIZATION_ADMIN', 'org-a')
    with pytest.raises(HTTPException) as error:
        require_event_scope(_event('evt-b', 'org-b'), actor)
    assert error.value.status_code == 403


def test_organization_admin_can_manage_event_in_own_organization():
    actor = _user('ORGANIZATION_ADMIN', 'org-a')
    assert require_event_scope(_event('evt-a', 'org-a'), actor) is None


def test_active_event_actor_cannot_access_another_event_in_same_organization():
    actor = _user('JUDGE', 'org-a', 'evt-a')
    with pytest.raises(HTTPException) as error:
        require_event_scope(_event('evt-b', 'org-a'), actor)
    assert error.value.status_code == 403


def test_organization_admin_cannot_submit_scoring_as_a_judge():
    with pytest.raises(HTTPException) as error:
        _assigned_judge(None, _user('ORGANIZATION_ADMIN', 'org-a'), 'evt-a')
    assert error.value.status_code == 403


def test_event_detail_requires_authentication():
    response = client.get('/api/v1/events/evt-01')
    assert response.status_code == 401


def test_judge_roster_requires_authentication():
    response = client.get('/api/v1/judges')
    assert response.status_code == 401
