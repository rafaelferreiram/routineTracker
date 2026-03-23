"""
Backend API Tests for RoutineQuest - Google OAuth & Traditional Auth
Tests: Health check, traditional login, Google OAuth endpoint
"""
import pytest
import requests
import os

BASE_URL = "https://ai-itinerary-8.preview.emergentagent.com"


class TestHealthEndpoint:
    """Health check endpoint tests"""
    
    def test_health_returns_ok(self):
        """Test /api/health returns status ok"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "service" in data
        print(f"✓ Health check passed: {data}")


class TestTraditionalAuth:
    """Traditional username/password authentication tests"""
    
    def test_login_rafael_success(self):
        """Test login with rafael user (password: admin)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "rafael", "password": "admin"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["username"] == "rafael"
        assert data["user"]["displayName"] == "Rafael"
        assert len(data["token"]) > 0
        print(f"✓ Rafael login successful: {data['user']['username']}")
    
    def test_login_gabriela_success(self):
        """Test login with gabriela user (password: gabriela)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "gabriela", "password": "gabriela"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["username"] == "gabriela"
        assert data["user"]["displayName"] == "Gabriela"
        print(f"✓ Gabriela login successful: {data['user']['username']}")
    
    def test_login_wrong_password(self):
        """Test login with wrong password returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "rafael", "password": "wrongpassword"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "Wrong password" in data["detail"]
        print(f"✓ Wrong password correctly rejected")
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent user returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "nonexistent_user_xyz", "password": "anypassword"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower()
        print(f"✓ Non-existent user correctly rejected")


class TestGoogleOAuthEndpoint:
    """Google OAuth endpoint tests"""
    
    def test_google_auth_endpoint_exists(self):
        """Test /api/auth/google endpoint exists and accepts POST"""
        response = requests.post(
            f"{BASE_URL}/api/auth/google",
            json={"session_id": "test_invalid_session_id"}
        )
        # Should return 400 (invalid session) not 404 (endpoint not found)
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "Invalid Google session" in data["detail"]
        print(f"✓ Google auth endpoint exists and rejects invalid session")
    
    def test_google_auth_missing_session_id(self):
        """Test /api/auth/google requires session_id"""
        response = requests.post(
            f"{BASE_URL}/api/auth/google",
            json={}
        )
        # Should return 422 (validation error) for missing required field
        assert response.status_code == 422
        print(f"✓ Google auth correctly requires session_id field")
    
    def test_google_auth_empty_session_id(self):
        """Test /api/auth/google with empty session_id"""
        response = requests.post(
            f"{BASE_URL}/api/auth/google",
            json={"session_id": ""}
        )
        # Should return 400 (invalid session)
        assert response.status_code == 400
        print(f"✓ Google auth correctly rejects empty session_id")


class TestRegisterEndpoint:
    """User registration endpoint tests"""
    
    def test_register_duplicate_user(self):
        """Test registering existing username returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"username": "rafael", "password": "newpass123"}  # Valid password format
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "already taken" in data["detail"].lower()
        print(f"✓ Duplicate username correctly rejected")


class TestDataEndpoints:
    """Data persistence endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for rafael"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "rafael", "password": "admin"}
        )
        return response.json()["token"]
    
    def test_get_data_requires_auth(self):
        """Test /api/data requires authentication"""
        response = requests.get(f"{BASE_URL}/api/data")
        assert response.status_code in [401, 403]
        print(f"✓ Data endpoint correctly requires authentication")
    
    def test_get_data_with_auth(self, auth_token):
        """Test /api/data returns data with valid token"""
        response = requests.get(
            f"{BASE_URL}/api/data",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        print(f"✓ Data endpoint returns data with valid auth")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
