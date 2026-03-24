"""Backend API tests for RoutineTracker - Profile Management Features
Tests: Profile endpoints, change password, Google auth email linking
"""
import pytest
import requests
import time

BASE_URL = "https://streak-trophies.preview.emergentagent.com"

class TestProfileEndpoints:
    """Profile management endpoint tests"""

    @pytest.fixture
    def rafael_token(self):
        """Get token for rafael user"""
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "rafael", "password": "admin"})
        assert r.status_code == 200, f"Login failed: {r.text}"
        return r.json()["token"]

    @pytest.fixture
    def gabriela_token(self):
        """Get token for gabriela user"""
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "gabriela", "password": "gabriela"})
        assert r.status_code == 200, f"Login failed: {r.text}"
        return r.json()["token"]

    def test_get_profile_rafael(self, rafael_token):
        """GET /api/profile should return user info with hasPassword field"""
        r = requests.get(f"{BASE_URL}/api/profile", headers={"Authorization": f"Bearer {rafael_token}"})
        assert r.status_code == 200
        data = r.json()
        assert "user" in data
        user = data["user"]
        assert user["username"] == "rafael"
        assert "displayName" in user
        assert "hasPassword" in user
        assert user["hasPassword"] == True  # rafael has password
        print(f"Rafael profile: {user}")

    def test_get_profile_gabriela(self, gabriela_token):
        """GET /api/profile should return user info for gabriela"""
        r = requests.get(f"{BASE_URL}/api/profile", headers={"Authorization": f"Bearer {gabriela_token}"})
        assert r.status_code == 200
        data = r.json()
        user = data["user"]
        assert user["username"] == "gabriela"
        assert "hasPassword" in user
        print(f"Gabriela profile: {user}")

    def test_get_profile_unauthenticated(self):
        """GET /api/profile without token should fail"""
        r = requests.get(f"{BASE_URL}/api/profile")
        assert r.status_code == 403

    def test_update_profile_display_name(self, rafael_token):
        """PUT /api/profile should update display_name"""
        # Update display name
        r = requests.put(
            f"{BASE_URL}/api/profile",
            json={"display_name": "Rafael Updated"},
            headers={"Authorization": f"Bearer {rafael_token}"}
        )
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["displayName"] == "Rafael Updated"
        
        # Verify persistence
        r2 = requests.get(f"{BASE_URL}/api/profile", headers={"Authorization": f"Bearer {rafael_token}"})
        assert r2.json()["user"]["displayName"] == "Rafael Updated"
        
        # Restore original name
        requests.put(
            f"{BASE_URL}/api/profile",
            json={"display_name": "Rafael"},
            headers={"Authorization": f"Bearer {rafael_token}"}
        )

    def test_update_profile_short_name_fails(self, rafael_token):
        """PUT /api/profile with short name should fail"""
        r = requests.put(
            f"{BASE_URL}/api/profile",
            json={"display_name": "R"},
            headers={"Authorization": f"Bearer {rafael_token}"}
        )
        assert r.status_code == 400
        assert "2 caracteres" in r.json()["detail"]

    def test_update_profile_picture(self, rafael_token):
        """PUT /api/profile should update picture URL"""
        test_picture = "https://example.com/test-picture.jpg"
        r = requests.put(
            f"{BASE_URL}/api/profile",
            json={"picture": test_picture},
            headers={"Authorization": f"Bearer {rafael_token}"}
        )
        assert r.status_code == 200
        assert r.json()["user"]["picture"] == test_picture

    def test_update_profile_no_fields(self, rafael_token):
        """PUT /api/profile with no fields should fail"""
        r = requests.put(
            f"{BASE_URL}/api/profile",
            json={},
            headers={"Authorization": f"Bearer {rafael_token}"}
        )
        assert r.status_code == 400


class TestChangePassword:
    """Change password endpoint tests"""

    @pytest.fixture
    def test_user_token(self):
        """Create a test user and return token"""
        import random
        username = f"testpw{int(time.time())}{random.randint(1000, 9999)}"[:20]  # Unique, alphanumeric, max 20 chars
        r = requests.post(f"{BASE_URL}/api/auth/register", json={"username": username, "password": "oldpass123"})
        assert r.status_code == 200, f"Registration failed: {r.text}"
        return r.json()["token"], username

    def test_change_password_success(self, test_user_token):
        """POST /api/profile/change-password should change password"""
        token, username = test_user_token
        
        # Change password
        r = requests.post(
            f"{BASE_URL}/api/profile/change-password",
            json={"current_password": "oldpass123", "new_password": "newpass456"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert r.status_code == 200
        assert "sucesso" in r.json()["message"].lower()
        
        # Verify can login with new password
        r2 = requests.post(f"{BASE_URL}/api/auth/login", json={"username": username, "password": "newpass456"})
        assert r2.status_code == 200
        
        # Verify old password no longer works
        r3 = requests.post(f"{BASE_URL}/api/auth/login", json={"username": username, "password": "oldpass123"})
        assert r3.status_code == 400

    def test_change_password_wrong_current(self, test_user_token):
        """POST /api/profile/change-password with wrong current password should fail"""
        token, _ = test_user_token
        r = requests.post(
            f"{BASE_URL}/api/profile/change-password",
            json={"current_password": "wrongpassword", "new_password": "newpass456"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert r.status_code == 400
        assert "incorreta" in r.json()["detail"].lower()

    def test_change_password_weak_new(self, test_user_token):
        """POST /api/profile/change-password with weak new password should fail"""
        token, _ = test_user_token
        
        # Too short
        r = requests.post(
            f"{BASE_URL}/api/profile/change-password",
            json={"current_password": "oldpass123", "new_password": "abc"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert r.status_code == 400
        
        # No number
        r2 = requests.post(
            f"{BASE_URL}/api/profile/change-password",
            json={"current_password": "oldpass123", "new_password": "abcdefgh"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert r2.status_code == 400
        
        # No letter
        r3 = requests.post(
            f"{BASE_URL}/api/profile/change-password",
            json={"current_password": "oldpass123", "new_password": "12345678"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert r3.status_code == 400

    def test_change_password_unauthenticated(self):
        """POST /api/profile/change-password without token should fail"""
        r = requests.post(
            f"{BASE_URL}/api/profile/change-password",
            json={"current_password": "old", "new_password": "new123"}
        )
        assert r.status_code == 403


class TestGoogleAuthEndpoint:
    """Google OAuth endpoint tests"""

    def test_google_auth_endpoint_exists(self):
        """POST /api/auth/google should exist and accept session_id"""
        r = requests.post(f"{BASE_URL}/api/auth/google", json={"session_id": "invalid_session"})
        # Should return 400 (invalid session) or 502 (can't reach auth service), not 404
        assert r.status_code in [400, 502]

    def test_google_auth_missing_session_id(self):
        """POST /api/auth/google without session_id should fail validation"""
        r = requests.post(f"{BASE_URL}/api/auth/google", json={})
        assert r.status_code == 422  # Validation error


class TestLoginWithUserData:
    """Test login returns expected user data"""

    def test_login_rafael_returns_email(self):
        """Login should return user email if set"""
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "rafael", "password": "admin"})
        assert r.status_code == 200
        data = r.json()
        user = data["user"]
        print(f"Rafael login response: {user}")
        # Email may or may not be set depending on if Google auth was used
        assert "email" in user  # Field should exist even if empty

    def test_login_gabriela_returns_theme(self):
        """Login should return user theme"""
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "gabriela", "password": "gabriela"})
        assert r.status_code == 200
        data = r.json()
        user = data["user"]
        assert "theme" in user
        print(f"Gabriela theme: {user.get('theme')}")
