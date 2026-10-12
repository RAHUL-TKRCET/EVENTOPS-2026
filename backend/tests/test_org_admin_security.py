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


def test_organization_admin_cannot_use_stale_event_context_for_another_event():
    actor = _user("ORGANIZATION_ADMIN", "org-a", "evt-a")
    with pytest.raises(HTTPException) as error:
        require_event_scope(_event("evt-b", "org-a"), actor)
    assert error.value.status_code == 403


def test_event_admin_is_limited_to_owned_event():
    actor = _user("EVENT_ADMIN", "org-a")
    assert require_event_scope(_event("evt-a", "org-a", owner_id=actor.id), actor) is None
    with pytest.raises(HTTPException) as error:
        require_event_scope(_event("evt-b", "org-a", owner_id="someone-else"), actor)
    assert error.value.status_code == 403


def test_non_admin_event_role_cannot_administer_event():
    actor = _user("JUDGE", "org-a")
    with pytest.raises(HTTPException) as error:
        require_event_scope(_event("evt-a", "org-a"), actor)
    assert error.value.status_code == 403


def test_platform_admin_without_event_context_can_cross_organization_boundary():
    actor = _user("SUPER_ADMIN", organization_id=None)
    assert require_event_scope(_event("evt-other-org", "org-b"), actor) is None


def test_public_event_metadata_route_is_registered_and_public_safe():
    from app.api.v1.events import get_public_event
    from app.schemas.entities import PublicEventResponse

    assert callable(get_public_event)
    assert "id" in PublicEventResponse.model_fields
    assert "organizationId" not in PublicEventResponse.model_fields
    assert "ownerId" not in PublicEventResponse.model_fields


def test_organization_admin_can_open_both_events_in_same_organization_scope():
    actor = _user("ORGANIZATION_ADMIN", "org-e1abe51acc01")
    assert require_event_scope(_event("evt-cdf51aa8", "org-e1abe51acc01"), actor) is None
    assert require_event_scope(_event("evt-34896300", "org-e1abe51acc01"), actor) is None
