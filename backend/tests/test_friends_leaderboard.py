"""
Friends Leaderboard API Tests
Tests the /api/friends endpoint that powers the FriendsLeaderboard component.

Verifies:
- Auth guard (unauthenticated requests are rejected)
- Empty friends list for a new user
- Response structure contains all fields the leaderboard needs
  (data.habits, data.profile, data.achievements)
- Friend data is sufficient to compute stats (XP, streaks, medals, today%)
- Adding and removing friends updates the list correctly
- Friend search endpoint works for leaderboard friend-add flow
"""

import pytest
import requests
import time
import random
import string

BASE_URL = "http://localhost:8001"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "@dm1n"


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def admin_token():
    """Get admin token once for all tests in this module."""
    time.sleep(0.5)
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD,
    })
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def user_a(admin_token):
    """Create a fresh test user A for leaderboard tests."""
    suffix = ''.join(random.choices(string.digits, k=6))
    username = f"lbtest{suffix}"
    password = "Test123!"
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "username": username,
        "password": password,
    })
    assert r.status_code == 200, f"Register user_a failed: {r.text}"
    data = r.json()
    return {
        "username": username,
        "password": password,
        "token": data["token"],
        "id": data["user"]["id"],
        "headers": {"Authorization": f"Bearer {data['token']}"},
    }


@pytest.fixture(scope="module")
def user_b(admin_token):
    """Create a fresh test user B (will be added as friend of A)."""
    suffix = ''.join(random.choices(string.digits, k=6))
    username = f"lbfriend{suffix}"
    password = "Test123!"
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "username": username,
        "password": password,
    })
    assert r.status_code == 200, f"Register user_b failed: {r.text}"
    data = r.json()
    # Give user_b some data so leaderboard stats are non-trivial
    sample_data = {
        "habits": [
            {
                "id": "h1",
                "name": "Meditar",
                "frequency": "daily",
                "completions": [],
                "category": "Health",
                "emoji": "🧘",
            }
        ],
        "profile": {"totalXP": 350, "name": username},
        "achievements": [{"id": "ach1"}, {"id": "ach2"}],
        "events": [],
    }
    save_r = requests.put(
        f"{BASE_URL}/api/data",
        json={"data": sample_data},
        headers={"Authorization": f"Bearer {data['token']}"},
    )
    assert save_r.status_code == 200, f"Save user_b data failed: {save_r.text}"
    return {
        "username": username,
        "password": password,
        "token": data["token"],
        "id": data["user"]["id"],
        "headers": {"Authorization": f"Bearer {data['token']}"},
    }


@pytest.fixture(scope="module", autouse=True)
def cleanup(admin_token, user_a, user_b):
    """Disable test users after all tests complete."""
    yield
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    for user in [user_a, user_b]:
        requests.post(
            f"{BASE_URL}/api/admin/user/action",
            json={"user_id": user["id"], "action": "disable"},
            headers=admin_headers,
        )


# ── Auth guard ────────────────────────────────────────────────────────────────

class TestFriendsAuthGuard:
    def test_unauthenticated_get_friends_rejected(self):
        """GET /api/friends without token returns 403."""
        r = requests.get(f"{BASE_URL}/api/friends")
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}"
        print("✓ Unauthenticated GET /api/friends rejected")

    def test_unauthenticated_add_friend_rejected(self):
        """POST /api/friends/add without token returns 403."""
        r = requests.post(f"{BASE_URL}/api/friends/add", json={"username": "anyone"})
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}"
        print("✓ Unauthenticated POST /api/friends/add rejected")

    def test_invalid_token_rejected(self):
        """Requests with an invalid token are rejected."""
        r = requests.get(
            f"{BASE_URL}/api/friends",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}"
        print("✓ Invalid token rejected")


# ── Empty friends list ────────────────────────────────────────────────────────

class TestEmptyFriendsList:
    def test_new_user_has_no_friends(self, user_a):
        """Freshly registered user starts with an empty friends list."""
        r = requests.get(f"{BASE_URL}/api/friends", headers=user_a["headers"])
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert "friends" in data, "Response must contain 'friends' key"
        assert isinstance(data["friends"], list), "'friends' must be a list"
        assert len(data["friends"]) == 0, "New user should have no friends"
        print("✓ New user starts with empty friends list")


# ── Adding friends ────────────────────────────────────────────────────────────

class TestAddFriend:
    def test_add_friend_by_username(self, user_a, user_b):
        """User A can add user B as a friend."""
        r = requests.post(
            f"{BASE_URL}/api/friends/add",
            json={"username": user_b["username"]},
            headers=user_a["headers"],
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert "friend" in data, "Response should contain 'friend'"
        assert data["friend"]["username"] == user_b["username"]
        print(f"✓ User A added user B ({user_b['username']}) as friend")

    def test_cannot_add_same_friend_twice(self, user_a, user_b):
        """Adding the same friend twice returns 400."""
        # Already added in previous test
        r = requests.post(
            f"{BASE_URL}/api/friends/add",
            json={"username": user_b["username"]},
            headers=user_a["headers"],
        )
        assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"
        print("✓ Duplicate friend rejected with 400")

    def test_cannot_add_yourself(self, user_a):
        """Adding yourself as a friend returns 400."""
        r = requests.post(
            f"{BASE_URL}/api/friends/add",
            json={"username": user_a["username"]},
            headers=user_a["headers"],
        )
        assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"
        print("✓ Self-add rejected with 400")

    def test_add_nonexistent_user_returns_404(self, user_a):
        """Adding a username that doesn't exist returns 404."""
        r = requests.post(
            f"{BASE_URL}/api/friends/add",
            json={"username": "definitelynotarealusername_xyz999"},
            headers=user_a["headers"],
        )
        assert r.status_code == 404, f"Expected 404, got {r.status_code}: {r.text}"
        print("✓ Non-existent user returns 404")


# ── Friends list data structure (leaderboard contract) ────────────────────────

class TestFriendsListStructure:
    def test_friends_list_contains_friend(self, user_a, user_b):
        """After adding, the friend appears in the list."""
        r = requests.get(f"{BASE_URL}/api/friends", headers=user_a["headers"])
        assert r.status_code == 200
        friends = r.json()["friends"]
        usernames = [f["username"] for f in friends]
        assert user_b["username"] in usernames, (
            f"Expected {user_b['username']} in friends list, got {usernames}"
        )
        print(f"✓ {user_b['username']} appears in user A's friends list")

    def test_friend_has_required_identity_fields(self, user_a, user_b):
        """Each friend entry has id, username, displayName needed for leaderboard."""
        r = requests.get(f"{BASE_URL}/api/friends", headers=user_a["headers"])
        assert r.status_code == 200
        friend = next(
            (f for f in r.json()["friends"] if f["username"] == user_b["username"]),
            None,
        )
        assert friend is not None, "Friend not found in list"
        for field in ("id", "username", "displayName"):
            assert field in friend, f"Friend entry missing '{field}'"
        print("✓ Friend entry has id, username, displayName")

    def test_friend_has_data_field_for_leaderboard(self, user_a, user_b):
        """Friend entry includes 'data' object (habits, profile, achievements)."""
        r = requests.get(f"{BASE_URL}/api/friends", headers=user_a["headers"])
        assert r.status_code == 200
        friend = next(
            (f for f in r.json()["friends"] if f["username"] == user_b["username"]),
            None,
        )
        assert friend is not None
        assert "data" in friend, "Friend must include 'data' for leaderboard stats"
        data = friend["data"]
        # All three fields the leaderboard uses must be present
        assert "habits" in data, "friend.data must contain 'habits'"
        assert "profile" in data, "friend.data must contain 'profile'"
        assert "achievements" in data, "friend.data must contain 'achievements'"
        print("✓ friend.data has habits, profile, achievements")

    def test_friend_profile_has_totalXP(self, user_a, user_b):
        """friend.data.profile includes totalXP used for XP ranking."""
        r = requests.get(f"{BASE_URL}/api/friends", headers=user_a["headers"])
        assert r.status_code == 200
        friend = next(
            (f for f in r.json()["friends"] if f["username"] == user_b["username"]),
            None,
        )
        profile = friend["data"]["profile"]
        assert "totalXP" in profile, "profile must contain 'totalXP'"
        assert isinstance(profile["totalXP"], (int, float)), "totalXP must be numeric"
        assert profile["totalXP"] == 350, f"Expected 350 XP, got {profile['totalXP']}"
        print(f"✓ friend.data.profile.totalXP = {profile['totalXP']}")

    def test_friend_habits_are_a_list(self, user_a, user_b):
        """friend.data.habits is a list (used for streak and today% computation)."""
        r = requests.get(f"{BASE_URL}/api/friends", headers=user_a["headers"])
        assert r.status_code == 200
        friend = next(
            (f for f in r.json()["friends"] if f["username"] == user_b["username"]),
            None,
        )
        habits = friend["data"]["habits"]
        assert isinstance(habits, list), "habits must be a list"
        assert len(habits) >= 1, "Should have at least the seeded habit"
        print(f"✓ friend.data.habits is a list with {len(habits)} entry/entries")

    def test_friend_habits_have_completions_field(self, user_a, user_b):
        """Each habit has a 'completions' array — needed for today% and streak."""
        r = requests.get(f"{BASE_URL}/api/friends", headers=user_a["headers"])
        assert r.status_code == 200
        friend = next(
            (f for f in r.json()["friends"] if f["username"] == user_b["username"]),
            None,
        )
        for habit in friend["data"]["habits"]:
            assert "completions" in habit, f"Habit '{habit.get('name')}' missing 'completions'"
            assert isinstance(habit["completions"], list)
        print("✓ All habits have 'completions' list")

    def test_friend_achievements_are_a_list(self, user_a, user_b):
        """friend.data.achievements is a list (used for medals count)."""
        r = requests.get(f"{BASE_URL}/api/friends", headers=user_a["headers"])
        assert r.status_code == 200
        friend = next(
            (f for f in r.json()["friends"] if f["username"] == user_b["username"]),
            None,
        )
        achievements = friend["data"]["achievements"]
        assert isinstance(achievements, list), "achievements must be a list"
        assert len(achievements) == 2, f"Expected 2 achievements, got {len(achievements)}"
        print(f"✓ friend.data.achievements count = {len(achievements)}")

    def test_friend_has_theme_for_accent_color(self, user_a, user_b):
        """friend.theme exists (used for accent color in leaderboard rows)."""
        r = requests.get(f"{BASE_URL}/api/friends", headers=user_a["headers"])
        assert r.status_code == 200
        friend = next(
            (f for f in r.json()["friends"] if f["username"] == user_b["username"]),
            None,
        )
        assert "theme" in friend, "Friend must have 'theme' for accent color"
        print("✓ friend.theme present")


# ── User search (used by the Add Friend flow) ─────────────────────────────────

class TestUserSearch:
    def test_search_returns_matching_users(self, user_a, user_b):
        """User search finds users by partial username."""
        query = user_b["username"][:5]  # partial match
        r = requests.get(
            f"{BASE_URL}/api/users/search?q={query}",
            headers=user_a["headers"],
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert "users" in data, "Response must contain 'users'"
        assert isinstance(data["users"], list)
        usernames = [u["username"] for u in data["users"]]
        assert user_b["username"] in usernames, (
            f"Expected {user_b['username']} in search results"
        )
        print(f"✓ Search for '{query}' found {user_b['username']}")

    def test_search_excludes_current_user(self, user_a):
        """User search never returns the requesting user themselves."""
        query = user_a["username"][:5]
        r = requests.get(
            f"{BASE_URL}/api/users/search?q={query}",
            headers=user_a["headers"],
        )
        assert r.status_code == 200
        user_ids = [u["id"] for u in r.json()["users"]]
        assert user_a["id"] not in user_ids, "Search should not return the caller"
        print("✓ Search excludes current user")

    def test_search_requires_at_least_2_chars(self, user_a):
        """Search with a single character returns an empty list."""
        r = requests.get(
            f"{BASE_URL}/api/users/search?q=x",
            headers=user_a["headers"],
        )
        assert r.status_code == 200
        assert r.json()["users"] == [], "Single-char search should return []"
        print("✓ Single-char search returns empty list")

    def test_search_result_has_leaderboard_fields(self, user_a, user_b):
        """Search result contains id, username, displayName, theme."""
        query = user_b["username"]
        r = requests.get(
            f"{BASE_URL}/api/users/search?q={query}",
            headers=user_a["headers"],
        )
        assert r.status_code == 200
        users = r.json()["users"]
        user = next((u for u in users if u["username"] == user_b["username"]), None)
        assert user is not None
        for field in ("id", "username", "displayName", "theme"):
            assert field in user, f"Search result missing '{field}'"
        print("✓ Search result has id, username, displayName, theme")


# ── Remove friend ─────────────────────────────────────────────────────────────

class TestRemoveFriend:
    def test_remove_friend(self, user_a, user_b):
        """User A can remove user B from friends list."""
        r = requests.delete(
            f"{BASE_URL}/api/friends/{user_b['id']}",
            headers=user_a["headers"],
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        print(f"✓ User A removed user B ({user_b['username']})")

    def test_friend_gone_after_removal(self, user_a, user_b):
        """After removal, user B no longer appears in user A's friends list."""
        r = requests.get(f"{BASE_URL}/api/friends", headers=user_a["headers"])
        assert r.status_code == 200
        usernames = [f["username"] for f in r.json()["friends"]]
        assert user_b["username"] not in usernames, (
            f"{user_b['username']} should not be in friends list after removal"
        )
        print("✓ Removed friend no longer in list")

    def test_remove_nonexistent_friend_returns_404(self, user_a):
        """Removing a friend that doesn't exist returns 404."""
        r = requests.delete(
            f"{BASE_URL}/api/friends/000000000000000000000000",
            headers=user_a["headers"],
        )
        assert r.status_code == 404, f"Expected 404, got {r.status_code}"
        print("✓ Removing nonexistent friend returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
