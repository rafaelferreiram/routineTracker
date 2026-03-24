"""
Backend tests for Shared Events (Eventos com Amigos) feature
Tests all new collaborative events endpoints: GET/POST/PUT/DELETE events,
invite, leave, migrate, and participant visibility
"""

import pytest
import requests
import os
import time

BASE_URL = "http://localhost:8001"

# Test credentials
ADMIN_CREDS = {"username": "admin", "password": "@dm1n"}
GABRIELA_CREDS = {"username": "gabriela", "password": "Gabriela@123"}


# ── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def admin_token():
    """Get admin JWT token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    token = response.json().get("token")
    assert token, "No token returned for admin"
    return token


@pytest.fixture(scope="module")
def gabriela_token():
    """Get gabriela JWT token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json=GABRIELA_CREDS)
    assert response.status_code == 200, f"Gabriela login failed: {response.text}"
    token = response.json().get("token")
    assert token, "No token returned for gabriela"
    return token


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture
def gabriela_headers(gabriela_token):
    return {"Authorization": f"Bearer {gabriela_token}", "Content-Type": "application/json"}


@pytest.fixture
def created_event(admin_headers):
    """Create a test event and clean up after test"""
    future_date = "2027-06-15"
    payload = {
        "title": "TEST_Viagem Colaborativa",
        "date": future_date,
        "end_date": "2027-06-20",
        "emoji": "✈️",
        "color": "#3b82f6",
        "note": "Test event for automated testing"
    }
    resp = requests.post(f"{BASE_URL}/api/events", json=payload, headers=admin_headers)
    assert resp.status_code == 200, f"Failed to create event: {resp.text}"
    event = resp.json()["event"]
    yield event
    # Cleanup
    requests.delete(f"{BASE_URL}/api/events/{event['id']}", headers=admin_headers)


# ── Auth Tests ───────────────────────────────────────────────────────────────

class TestSharedEventsAuth:
    """Test authentication requirements"""

    def test_get_events_requires_auth(self):
        """GET /api/events should return 401 or 403 without token"""
        resp = requests.get(f"{BASE_URL}/api/events")
        assert resp.status_code in (401, 403), f"Expected 401/403, got {resp.status_code}"
        print(f"PASS: GET /api/events requires auth - got {resp.status_code}")

    def test_post_event_requires_auth(self):
        """POST /api/events should return 401 or 403 without token"""
        resp = requests.post(f"{BASE_URL}/api/events", json={"title": "test", "date": "2027-01-01"})
        assert resp.status_code in (401, 403), f"Expected 401/403, got {resp.status_code}"
        print(f"PASS: POST /api/events requires auth - got {resp.status_code}")


# ── CRUD Tests ───────────────────────────────────────────────────────────────

class TestSharedEventsCRUD:
    """Test basic CRUD operations on shared events"""

    def test_get_events_returns_list(self, admin_headers):
        """GET /api/events should return a list"""
        resp = requests.get(f"{BASE_URL}/api/events", headers=admin_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "events" in data, "Response should have 'events' key"
        assert isinstance(data["events"], list), "events should be a list"
        print(f"PASS: GET /api/events returned {len(data['events'])} events")

    def test_create_event_success(self, admin_headers):
        """POST /api/events creates a new event"""
        payload = {
            "title": "TEST_Create Event Test",
            "date": "2027-07-04",
            "emoji": "🎉",
            "color": "#22c55e",
            "note": "Test creation"
        }
        resp = requests.post(f"{BASE_URL}/api/events", json=payload, headers=admin_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "event" in data, "Response should have 'event' key"
        event = data["event"]
        assert event["title"] == "TEST_Create Event Test"
        assert event["date"] == "2027-07-04"
        assert event["emoji"] == "🎉"
        assert event["color"] == "#22c55e"
        assert event["is_owner"] == True
        assert "id" in event
        assert event["participants"] == []
        print(f"PASS: Event created with id={event['id']}")
        # Cleanup
        requests.delete(f"{BASE_URL}/api/events/{event['id']}", headers=admin_headers)

    def test_create_event_fields_validation(self, admin_headers):
        """POST /api/events validates required fields"""
        # Missing title
        resp = requests.post(f"{BASE_URL}/api/events", json={"date": "2027-01-01"}, headers=admin_headers)
        assert resp.status_code == 422, f"Expected 422 for missing title, got {resp.status_code}"
        print("PASS: Missing title returns 422")

    def test_update_event_as_owner(self, admin_headers, created_event):
        """PUT /api/events/{id} owner can update all fields"""
        event_id = created_event["id"]
        update_payload = {
            "title": "TEST_Updated Title",
            "note": "Updated note"
        }
        resp = requests.put(f"{BASE_URL}/api/events/{event_id}", json=update_payload, headers=admin_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "event" in data
        event = data["event"]
        assert event["title"] == "TEST_Updated Title"
        assert event["note"] == "Updated note"
        print(f"PASS: Owner can update event - title: {event['title']}")

    def test_update_event_not_found(self, admin_headers):
        """PUT /api/events/{id} returns 404 for nonexistent event"""
        resp = requests.put(f"{BASE_URL}/api/events/nonexistent_id_12345", json={"title": "test"}, headers=admin_headers)
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}"
        print("PASS: PUT nonexistent event returns 404")

    def test_delete_event_as_owner(self, admin_headers):
        """DELETE /api/events/{id} owner can delete"""
        # Create event for deletion test
        resp = requests.post(f"{BASE_URL}/api/events", json={
            "title": "TEST_Delete Me",
            "date": "2027-08-01"
        }, headers=admin_headers)
        assert resp.status_code == 200
        event_id = resp.json()["event"]["id"]

        del_resp = requests.delete(f"{BASE_URL}/api/events/{event_id}", headers=admin_headers)
        assert del_resp.status_code == 200, f"Expected 200, got {del_resp.status_code}: {del_resp.text}"
        data = del_resp.json()
        assert data.get("ok") == True
        print(f"PASS: Owner can delete event {event_id}")

    def test_delete_nonexistent_event(self, admin_headers):
        """DELETE /api/events/{id} returns 404 for nonexistent"""
        resp = requests.delete(f"{BASE_URL}/api/events/nonexistent_xyz", headers=admin_headers)
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}"
        print("PASS: DELETE nonexistent event returns 404")


# ── Invite / Participants Tests ───────────────────────────────────────────────

class TestSharedEventsInvite:
    """Test invite and participant management"""

    def test_invite_user_to_event(self, admin_headers, created_event):
        """POST /api/events/{id}/invite adds a participant"""
        event_id = created_event["id"]
        resp = requests.post(
            f"{BASE_URL}/api/events/{event_id}/invite",
            json={"username": "gabriela"},
            headers=admin_headers
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "participant" in data
        participant = data["participant"]
        assert participant["username"] == "gabriela"
        assert "message" in data
        print(f"PASS: Invited gabriela - message: {data['message']}")

    def test_invite_nonexistent_user(self, admin_headers, created_event):
        """POST /api/events/{id}/invite returns 404 for unknown username"""
        event_id = created_event["id"]
        resp = requests.post(
            f"{BASE_URL}/api/events/{event_id}/invite",
            json={"username": "nonexistent_user_xyz_12345"},
            headers=admin_headers
        )
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}: {resp.text}"
        print("PASS: Invite nonexistent user returns 404")

    def test_invite_self_returns_error(self, admin_headers, created_event):
        """POST /api/events/{id}/invite owner cannot invite self"""
        event_id = created_event["id"]
        resp = requests.post(
            f"{BASE_URL}/api/events/{event_id}/invite",
            json={"username": "admin"},
            headers=admin_headers
        )
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}: {resp.text}"
        print("PASS: Cannot invite self - 400 returned")

    def test_invite_duplicate_participant(self, admin_headers, created_event):
        """POST /api/events/{id}/invite returns 400 for already-invited user"""
        event_id = created_event["id"]
        # First invite
        requests.post(
            f"{BASE_URL}/api/events/{event_id}/invite",
            json={"username": "gabriela"},
            headers=admin_headers
        )
        # Duplicate invite
        resp = requests.post(
            f"{BASE_URL}/api/events/{event_id}/invite",
            json={"username": "gabriela"},
            headers=admin_headers
        )
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}: {resp.text}"
        print("PASS: Duplicate invite returns 400")

    def test_non_owner_cannot_invite(self, gabriela_headers, created_event):
        """Non-owner cannot invite participants"""
        event_id = created_event["id"]
        resp = requests.post(
            f"{BASE_URL}/api/events/{event_id}/invite",
            json={"username": "testuser"},
            headers=gabriela_headers
        )
        assert resp.status_code == 403, f"Expected 403, got {resp.status_code}: {resp.text}"
        print("PASS: Non-owner cannot invite - 403 returned")

    def test_non_owner_cannot_delete(self, gabriela_headers, created_event):
        """Non-owner cannot delete event"""
        event_id = created_event["id"]
        resp = requests.delete(f"{BASE_URL}/api/events/{event_id}", headers=gabriela_headers)
        assert resp.status_code == 403, f"Expected 403, got {resp.status_code}: {resp.text}"
        print("PASS: Non-owner cannot delete - 403 returned")


# ── Participant Visibility Tests ─────────────────────────────────────────────

class TestParticipantVisibility:
    """Test that invited users can see events"""

    def test_invited_user_sees_event(self, admin_headers, gabriela_headers):
        """Invited user (gabriela) can see event created by admin"""
        # 1. Create event as admin
        resp = requests.post(f"{BASE_URL}/api/events", json={
            "title": "TEST_Visibility Check Event",
            "date": "2027-09-10",
            "emoji": "🔍",
            "color": "#a78bfa"
        }, headers=admin_headers)
        assert resp.status_code == 200
        event = resp.json()["event"]
        event_id = event["id"]

        try:
            # 2. Verify gabriela cannot see it yet
            g_events_before = requests.get(f"{BASE_URL}/api/events", headers=gabriela_headers).json()["events"]
            g_event_ids_before = [e["id"] for e in g_events_before]
            assert event_id not in g_event_ids_before, "Gabriela should not see event before being invited"
            print("PASS: Gabriela cannot see event before invite")

            # 3. Invite gabriela
            invite_resp = requests.post(
                f"{BASE_URL}/api/events/{event_id}/invite",
                json={"username": "gabriela"},
                headers=admin_headers
            )
            assert invite_resp.status_code == 200

            # 4. Verify gabriela can now see the event
            g_events_after = requests.get(f"{BASE_URL}/api/events", headers=gabriela_headers).json()["events"]
            g_event_ids_after = [e["id"] for e in g_events_after]
            assert event_id in g_event_ids_after, "Gabriela should see event after being invited"
            print("PASS: Gabriela sees event after invite")

            # 5. Verify event details in gabriela's view
            g_event = next(e for e in g_events_after if e["id"] == event_id)
            assert g_event["title"] == "TEST_Visibility Check Event"
            assert g_event["is_owner"] == False
            assert g_event["owner_username"] == "admin"
            print(f"PASS: Gabriela sees event with is_owner=False, owner=admin")

        finally:
            # Cleanup
            requests.delete(f"{BASE_URL}/api/events/{event_id}", headers=admin_headers)

    def test_owner_sees_own_event(self, admin_headers):
        """Owner sees their own events in GET /api/events"""
        resp = requests.post(f"{BASE_URL}/api/events", json={
            "title": "TEST_Owner Visibility",
            "date": "2027-10-01"
        }, headers=admin_headers)
        assert resp.status_code == 200
        event_id = resp.json()["event"]["id"]
        try:
            events = requests.get(f"{BASE_URL}/api/events", headers=admin_headers).json()["events"]
            event_ids = [e["id"] for e in events]
            assert event_id in event_ids, "Owner should see their own event"
            owner_event = next(e for e in events if e["id"] == event_id)
            assert owner_event["is_owner"] == True
            print("PASS: Owner sees own event with is_owner=True")
        finally:
            requests.delete(f"{BASE_URL}/api/events/{event_id}", headers=admin_headers)


# ── Leave Event Tests ────────────────────────────────────────────────────────

class TestLeaveEvent:
    """Test participant leaving an event"""

    def test_participant_can_leave_event(self, admin_headers, gabriela_headers):
        """Participant (gabriela) can leave an event they were invited to"""
        # Create and invite
        resp = requests.post(f"{BASE_URL}/api/events", json={
            "title": "TEST_Leave Test Event",
            "date": "2027-11-15"
        }, headers=admin_headers)
        assert resp.status_code == 200
        event_id = resp.json()["event"]["id"]

        try:
            # Invite gabriela
            inv = requests.post(
                f"{BASE_URL}/api/events/{event_id}/invite",
                json={"username": "gabriela"},
                headers=admin_headers
            )
            assert inv.status_code == 200

            # Gabriela leaves
            leave_resp = requests.delete(
                f"{BASE_URL}/api/events/{event_id}/leave",
                headers=gabriela_headers
            )
            assert leave_resp.status_code == 200, f"Expected 200, got {leave_resp.status_code}: {leave_resp.text}"
            data = leave_resp.json()
            assert data.get("ok") == True
            print("PASS: Gabriela can leave event")

            # Verify gabriela no longer sees the event
            g_events = requests.get(f"{BASE_URL}/api/events", headers=gabriela_headers).json()["events"]
            g_event_ids = [e["id"] for e in g_events]
            assert event_id not in g_event_ids, "Gabriela should not see event after leaving"
            print("PASS: Gabriela no longer sees event after leaving")

        finally:
            requests.delete(f"{BASE_URL}/api/events/{event_id}", headers=admin_headers)

    def test_owner_cannot_leave_event(self, admin_headers):
        """Owner cannot leave their own event (should delete instead)"""
        resp = requests.post(f"{BASE_URL}/api/events", json={
            "title": "TEST_Owner Leave Attempt",
            "date": "2027-12-01"
        }, headers=admin_headers)
        assert resp.status_code == 200
        event_id = resp.json()["event"]["id"]
        try:
            leave_resp = requests.delete(f"{BASE_URL}/api/events/{event_id}/leave", headers=admin_headers)
            assert leave_resp.status_code == 400, f"Expected 400, got {leave_resp.status_code}: {leave_resp.text}"
            print("PASS: Owner cannot leave their own event - 400 returned")
        finally:
            requests.delete(f"{BASE_URL}/api/events/{event_id}", headers=admin_headers)


# ── Participant Update Permissions ───────────────────────────────────────────

class TestParticipantUpdatePermissions:
    """Test update permissions for participants vs owner"""

    def test_participant_can_update_review(self, admin_headers, gabriela_headers):
        """Participant (gabriela) can update review field"""
        # Create event and invite gabriela
        resp = requests.post(f"{BASE_URL}/api/events", json={
            "title": "TEST_Review Permission",
            "date": "2025-01-15",  # Past date for review
        }, headers=admin_headers)
        assert resp.status_code == 200
        event_id = resp.json()["event"]["id"]

        try:
            requests.post(
                f"{BASE_URL}/api/events/{event_id}/invite",
                json={"username": "gabriela"},
                headers=admin_headers
            )

            # Gabriela updates review
            review_data = {"review": {"mood": 5, "comment": "Amazing!", "photosByDay": {}}}
            resp = requests.put(
                f"{BASE_URL}/api/events/{event_id}",
                json=review_data,
                headers=gabriela_headers
            )
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
            event = resp.json()["event"]
            assert event["review"]["mood"] == 5
            print("PASS: Participant can update review field")

        finally:
            requests.delete(f"{BASE_URL}/api/events/{event_id}", headers=admin_headers)

    def test_participant_cannot_update_title(self, admin_headers, gabriela_headers):
        """Participant cannot update title (owner-only field)"""
        resp = requests.post(f"{BASE_URL}/api/events", json={
            "title": "TEST_Participant Cannot Update Title",
            "date": "2027-03-15"
        }, headers=admin_headers)
        assert resp.status_code == 200
        event_id = resp.json()["event"]["id"]
        original_title = "TEST_Participant Cannot Update Title"

        try:
            requests.post(
                f"{BASE_URL}/api/events/{event_id}/invite",
                json={"username": "gabriela"},
                headers=admin_headers
            )

            # Gabriela tries to update title
            resp = requests.put(
                f"{BASE_URL}/api/events/{event_id}",
                json={"title": "Hacked Title"},
                headers=gabriela_headers
            )
            # Should succeed (200) but title should NOT change (only review is allowed for participants)
            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
            event = resp.json()["event"]
            assert event["title"] == original_title, f"Title should not change! Got: {event['title']}"
            print("PASS: Participant cannot change title (title unchanged)")

        finally:
            requests.delete(f"{BASE_URL}/api/events/{event_id}", headers=admin_headers)


# ── Migrate Events Tests ─────────────────────────────────────────────────────

class TestMigrateEvents:
    """Test local events migration"""

    def test_migrate_events_endpoint(self, admin_headers):
        """POST /api/events/migrate accepts events list"""
        local_events = [
            {
                "id": "local_test_evt_001",
                "title": "TEST_Migrated Event",
                "date": "2027-05-20",
                "endDate": "2027-05-22",
                "emoji": "🎯",
                "color": "#f97316",
                "note": "Migrated from local",
                "itinerary": [],
                "review": None
            }
        ]
        resp = requests.post(f"{BASE_URL}/api/events/migrate", json={"events": local_events}, headers=admin_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "migrated" in data
        print(f"PASS: Migration endpoint works - migrated: {data['migrated']} event(s)")

    def test_migrate_empty_events(self, admin_headers):
        """POST /api/events/migrate works with empty list"""
        resp = requests.post(f"{BASE_URL}/api/events/migrate", json={"events": []}, headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json().get("migrated") == 0
        print("PASS: Migrate empty events returns migrated=0")

    def test_migrate_skips_duplicates(self, admin_headers):
        """POST /api/events/migrate skips already-migrated events (idempotent)"""
        local_events = [{
            "id": "local_dup_test_evt_002",
            "title": "TEST_Dup Migrate Event",
            "date": "2027-06-01"
        }]
        # First migration
        resp1 = requests.post(f"{BASE_URL}/api/events/migrate", json={"events": local_events}, headers=admin_headers)
        first_count = resp1.json().get("migrated", 0)

        # Second migration (should skip)
        resp2 = requests.post(f"{BASE_URL}/api/events/migrate", json={"events": local_events}, headers=admin_headers)
        second_count = resp2.json().get("migrated", 0)

        assert second_count == 0, f"Expected 0 on second migration, got {second_count}"
        print(f"PASS: Duplicate migration skipped - first: {first_count}, second: {second_count}")


# ── Serialization Tests ──────────────────────────────────────────────────────

class TestEventSerialization:
    """Test that events are properly serialized (no MongoDB ObjectId)"""

    def test_event_response_has_no_mongodb_id(self, admin_headers):
        """Event response should not contain _id (MongoDB ObjectId)"""
        resp = requests.post(f"{BASE_URL}/api/events", json={
            "title": "TEST_Serialization Check",
            "date": "2027-04-01"
        }, headers=admin_headers)
        assert resp.status_code == 200
        event = resp.json()["event"]
        event_id = event["id"]

        try:
            assert "_id" not in event, "Response should not contain MongoDB _id"
            assert "id" in event, "Response should have 'id' field"
            assert "owner_id" in event
            assert "owner_username" in event
            assert "participants" in event
            assert "is_owner" in event
            print("PASS: Event serialized correctly (no _id, has all required fields)")
        finally:
            requests.delete(f"{BASE_URL}/api/events/{event_id}", headers=admin_headers)

    def test_events_list_has_no_mongodb_id(self, admin_headers):
        """GET /api/events should return events without _id"""
        resp = requests.get(f"{BASE_URL}/api/events", headers=admin_headers)
        assert resp.status_code == 200
        events = resp.json()["events"]
        for event in events:
            assert "_id" not in event, f"Event {event.get('id')} has _id in response"
        print(f"PASS: All {len(events)} events are properly serialized (no _id)")
