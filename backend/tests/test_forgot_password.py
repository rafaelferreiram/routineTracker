"""
Test suite for Forgot Password / Reset Password functionality
Tests the complete password reset flow:
1. POST /api/auth/forgot-password - Request password reset email
2. POST /api/auth/reset-password - Reset password with token
3. Login with new password verification
"""
import pytest
import requests
import os
from pymongo import MongoClient
from datetime import datetime, timezone, timedelta

BASE_URL = "https://streak-trophies.preview.emergentagent.com"
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb+srv://root:root123@cluster0.vjkzl83.mongodb.net/routinetracker?retryWrites=true&w=majority')
DB_NAME = os.environ.get('DB_NAME', 'routinetracker')


@pytest.fixture(scope="module")
def db_client():
    """MongoDB client for direct DB access to verify tokens."""
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    yield db
    client.close()


@pytest.fixture
def api_client():
    """Shared requests session."""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestForgotPasswordAPI:
    """Tests for POST /api/auth/forgot-password endpoint"""
    
    def test_forgot_password_returns_success_for_existing_email(self, api_client):
        """Test that forgot-password returns success for a registered email (rafael)."""
        response = api_client.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": "ferreira.rafah@gmail.com"
        })
        
        # Should always return 200 to not reveal if email exists
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("ok") == True
        assert "message" in data
        print(f"✓ Forgot password for existing email returned: {data}")
    
    def test_forgot_password_returns_success_for_nonexistent_email(self, api_client):
        """Test that forgot-password returns success even for non-existent email (security)."""
        response = api_client.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": "nonexistent_user_12345@example.com"
        })
        
        # Should return 200 to not reveal if email exists
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("ok") == True
        print(f"✓ Forgot password for non-existent email returned: {data}")
    
    def test_forgot_password_creates_reset_token_in_db(self, api_client, db_client):
        """Test that forgot-password creates a reset_token in the database."""
        email = "ferreira.rafah@gmail.com"
        
        # Call forgot-password
        response = api_client.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": email
        })
        assert response.status_code == 200
        
        # Check database for reset_token
        user = db_client.users.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})
        assert user is not None, "User should exist in database"
        assert "reset_token" in user, "reset_token should be set in user document"
        assert "reset_token_expires" in user, "reset_token_expires should be set"
        
        # Verify token expiry is in the future (1 hour from now)
        expires = user["reset_token_expires"]
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        assert expires > datetime.now(timezone.utc), "Token expiry should be in the future"
        
        print(f"✓ Reset token created in DB: {user['reset_token'][:20]}...")
        return user["reset_token"]


class TestResetPasswordAPI:
    """Tests for POST /api/auth/reset-password endpoint"""
    
    def test_reset_password_with_invalid_token(self, api_client):
        """Test that reset-password fails with invalid token."""
        response = api_client.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": "invalid_token_12345",
            "new_password": "newpassword123"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"✓ Invalid token rejected: {data['detail']}")
    
    def test_reset_password_with_short_password(self, api_client, db_client):
        """Test that reset-password fails with password < 6 chars."""
        # First get a valid token
        email = "ferreira.rafah@gmail.com"
        api_client.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": email})
        
        user = db_client.users.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})
        token = user.get("reset_token")
        
        if token:
            response = api_client.post(f"{BASE_URL}/api/auth/reset-password", json={
                "token": token,
                "new_password": "abc"  # Too short
            })
            
            assert response.status_code == 400
            data = response.json()
            assert "detail" in data
            print(f"✓ Short password rejected: {data['detail']}")
    
    def test_reset_password_full_flow(self, api_client, db_client):
        """Test complete password reset flow: forgot -> reset -> login."""
        email = "ferreira.rafah@gmail.com"
        new_password = "newpassword"  # Reset to the expected password
        
        # Step 1: Request password reset
        response = api_client.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": email
        })
        assert response.status_code == 200
        print("✓ Step 1: Forgot password request successful")
        
        # Step 2: Get token from database
        user = db_client.users.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})
        assert user is not None
        token = user.get("reset_token")
        assert token is not None, "Reset token should exist"
        print(f"✓ Step 2: Got reset token from DB: {token[:20]}...")
        
        # Step 3: Reset password with token
        response = api_client.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": token,
            "new_password": new_password
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") == True
        print(f"✓ Step 3: Password reset successful: {data}")
        
        # Step 4: Verify token is cleared from database
        user = db_client.users.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})
        assert user.get("reset_token") is None, "Reset token should be cleared after use"
        print("✓ Step 4: Reset token cleared from database")
        
        # Step 5: Login with new password
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "username": "rafael",
            "password": new_password
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["username"] == "rafael"
        print(f"✓ Step 5: Login with new password successful")
    
    def test_reset_password_token_cannot_be_reused(self, api_client, db_client):
        """Test that a reset token cannot be used twice."""
        email = "ferreira.rafah@gmail.com"
        
        # Request new token
        api_client.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": email})
        
        user = db_client.users.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})
        token = user.get("reset_token")
        
        if token:
            # First use - should succeed
            response = api_client.post(f"{BASE_URL}/api/auth/reset-password", json={
                "token": token,
                "new_password": "newpassword"
            })
            assert response.status_code == 200
            print("✓ First token use successful")
            
            # Second use - should fail
            response = api_client.post(f"{BASE_URL}/api/auth/reset-password", json={
                "token": token,
                "new_password": "anotherpassword123"
            })
            assert response.status_code == 400
            print("✓ Token reuse correctly rejected")


class TestResetPasswordExpiry:
    """Tests for token expiry handling"""
    
    def test_expired_token_is_rejected(self, api_client, db_client):
        """Test that an expired token is rejected."""
        email = "ferreira.rafah@gmail.com"
        
        # Request token
        api_client.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": email})
        
        user = db_client.users.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})
        token = user.get("reset_token")
        
        if token:
            # Manually expire the token in DB
            db_client.users.update_one(
                {"email": {"$regex": f"^{email}$", "$options": "i"}},
                {"$set": {"reset_token_expires": datetime.now(timezone.utc) - timedelta(hours=1)}}
            )
            
            # Try to use expired token
            response = api_client.post(f"{BASE_URL}/api/auth/reset-password", json={
                "token": token,
                "new_password": "newpassword123"
            })
            
            assert response.status_code == 400
            data = response.json()
            assert "expirado" in data.get("detail", "").lower() or "expired" in data.get("detail", "").lower()
            print(f"✓ Expired token rejected: {data['detail']}")
            
            # Clean up - request new token to reset state
            api_client.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": email})


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
