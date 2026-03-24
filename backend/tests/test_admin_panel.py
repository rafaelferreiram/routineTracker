"""
Admin Panel API Tests
Tests for admin user authentication, admin endpoints, and user management features.
Uses session-scoped fixtures to avoid rate limiting.
"""
import pytest
import requests
import time

BASE_URL = "http://localhost:8001"

# Admin credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "@dm1n"

# Regular user credentials
REGULAR_USERNAME = "rafael"
REGULAR_PASSWORD = "admin"


# Session-scoped fixtures to avoid rate limiting
@pytest.fixture(scope="session")
def admin_session():
    """Get admin token once for all tests"""
    time.sleep(1)  # Wait for rate limit to reset
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    data = response.json()
    return {
        "token": data["token"],
        "headers": {"Authorization": f"Bearer {data['token']}"},
        "user": data["user"]
    }


@pytest.fixture(scope="session")
def regular_session():
    """Get regular user token once for all tests"""
    time.sleep(1)  # Wait for rate limit to reset
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": REGULAR_USERNAME,
        "password": REGULAR_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return {
            "token": data["token"],
            "headers": {"Authorization": f"Bearer {data['token']}"},
            "user": data["user"]
        }
    return None


@pytest.fixture(scope="session")
def test_user(admin_session):
    """Get rafael user for testing"""
    response = requests.get(f"{BASE_URL}/api/admin/users?search=rafael", 
        headers=admin_session["headers"])
    if response.status_code == 200:
        users = response.json().get("users", [])
        return next((u for u in users if u["username"] == "rafael"), None)
    return None


class TestAdminAuthentication:
    """Test admin user login and authentication"""
    
    def test_admin_login_success(self, admin_session):
        """Admin can login with correct credentials admin/@dm1n"""
        assert admin_session["user"]["username"] == ADMIN_USERNAME
        assert admin_session["user"]["isAdmin"] == True, "Admin user should have isAdmin: true"
        print(f"✓ Admin login successful, isAdmin: {admin_session['user']['isAdmin']}")
    
    def test_admin_login_wrong_password(self):
        """Admin login fails with wrong password"""
        time.sleep(0.5)
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": "wrongpassword"
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Admin login correctly rejected with wrong password")
    
    def test_regular_user_not_admin(self, regular_session):
        """Regular user login does not have isAdmin flag"""
        if not regular_session:
            pytest.skip("Regular user login failed")
        
        is_admin = regular_session["user"].get("isAdmin", False)
        assert is_admin == False, f"Regular user should not be admin, got isAdmin: {is_admin}"
        print(f"✓ Regular user {REGULAR_USERNAME} correctly has isAdmin: {is_admin}")


class TestAdminEndpoints:
    """Test admin-only endpoints"""
    
    def test_admin_stats_endpoint(self, admin_session):
        """Admin can access /api/admin/stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=admin_session["headers"])
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify stats structure
        assert "total_users" in data, "Stats should contain total_users"
        assert "active_users" in data, "Stats should contain active_users"
        assert "new_users_today" in data, "Stats should contain new_users_today"
        assert "google_users" in data, "Stats should contain google_users"
        assert "password_users" in data, "Stats should contain password_users"
        assert "disabled_users" in data, "Stats should contain disabled_users"
        assert "total_habits" in data, "Stats should contain total_habits"
        assert "total_events" in data, "Stats should contain total_events"
        assert "daily_logins" in data, "Stats should contain daily_logins"
        
        print(f"✓ Admin stats: {data['total_users']} users, {data['active_users']} active, {data['disabled_users']} disabled")
    
    def test_admin_users_endpoint(self, admin_session):
        """Admin can access /api/admin/users endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=admin_session["headers"])
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "users" in data, "Response should contain users list"
        assert "total" in data, "Response should contain total count"
        assert isinstance(data["users"], list), "Users should be a list"
        
        # Verify user structure
        if len(data["users"]) > 0:
            user = data["users"][0]
            assert "id" in user, "User should have id"
            assert "username" in user, "User should have username"
            assert "stats" in user, "User should have stats"
        
        print(f"✓ Admin users endpoint: {data['total']} total users, {len(data['users'])} returned")
    
    def test_admin_users_search(self, admin_session):
        """Admin can search users"""
        response = requests.get(f"{BASE_URL}/api/admin/users?search=rafael", headers=admin_session["headers"])
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "users" in data
        print(f"✓ Admin search for 'rafael': {len(data['users'])} results")
    
    def test_admin_users_filter_google(self, admin_session):
        """Admin can filter users by auth type"""
        response = requests.get(f"{BASE_URL}/api/admin/users?filter_type=google", headers=admin_session["headers"])
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "users" in data
        print(f"✓ Admin filter by Google auth: {len(data['users'])} users")
    
    def test_non_admin_cannot_access_stats(self, regular_session):
        """Non-admin users get 403 when accessing admin endpoints"""
        if not regular_session:
            pytest.skip("Regular user login failed")
        
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=regular_session["headers"])
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("✓ Non-admin correctly denied access to /api/admin/stats")
    
    def test_non_admin_cannot_access_users(self, regular_session):
        """Non-admin users get 403 when accessing admin users endpoint"""
        if not regular_session:
            pytest.skip("Regular user login failed")
        
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=regular_session["headers"])
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("✓ Non-admin correctly denied access to /api/admin/users")
    
    def test_unauthenticated_cannot_access_admin(self):
        """Unauthenticated requests get 401/403 for admin endpoints"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Unauthenticated request correctly denied")


class TestAdminUserActions:
    """Test admin user management actions"""
    
    def test_disable_user(self, admin_session, test_user):
        """Admin can disable a user"""
        if not test_user:
            pytest.skip("Test user not found")
        
        response = requests.post(f"{BASE_URL}/api/admin/user/action", 
            headers=admin_session["headers"],
            json={
                "user_id": test_user["id"],
                "action": "disable"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("ok") == True, "Action should return ok: true"
        print(f"✓ User {test_user['username']} disabled successfully")
    
    def test_disabled_user_cannot_login(self, admin_session, test_user):
        """Disabled users cannot login (get 403)"""
        if not test_user:
            pytest.skip("Test user not found")
        
        # Ensure user is disabled
        requests.post(f"{BASE_URL}/api/admin/user/action", 
            headers=admin_session["headers"],
            json={
                "user_id": test_user["id"],
                "action": "disable"
            }
        )
        
        time.sleep(0.5)  # Small delay
        
        # Try to login as disabled user
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": REGULAR_USERNAME,
            "password": REGULAR_PASSWORD
        })
        assert response.status_code == 403, f"Expected 403 for disabled user, got {response.status_code}: {response.text}"
        print("✓ Disabled user correctly cannot login (403)")
    
    def test_enable_user(self, admin_session, test_user):
        """Admin can enable a disabled user"""
        if not test_user:
            pytest.skip("Test user not found")
        
        response = requests.post(f"{BASE_URL}/api/admin/user/action", 
            headers=admin_session["headers"],
            json={
                "user_id": test_user["id"],
                "action": "enable"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("ok") == True, "Action should return ok: true"
        print(f"✓ User {test_user['username']} enabled successfully")
    
    def test_enabled_user_can_login(self, admin_session, test_user):
        """Re-enabled user can login again"""
        if not test_user:
            pytest.skip("Test user not found")
        
        # Enable the user first
        requests.post(f"{BASE_URL}/api/admin/user/action", 
            headers=admin_session["headers"],
            json={
                "user_id": test_user["id"],
                "action": "enable"
            }
        )
        
        time.sleep(0.5)  # Small delay
        
        # Try to login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": REGULAR_USERNAME,
            "password": REGULAR_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200 for enabled user, got {response.status_code}: {response.text}"
        print("✓ Re-enabled user can login successfully")
    
    def test_reset_password(self, admin_session, test_user):
        """Admin can reset user password"""
        if not test_user:
            pytest.skip("Test user not found")
        
        new_password = "newpass123"
        response = requests.post(f"{BASE_URL}/api/admin/user/action", 
            headers=admin_session["headers"],
            json={
                "user_id": test_user["id"],
                "action": "reset_password",
                "new_password": new_password
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("ok") == True, "Action should return ok: true"
        print(f"✓ Password reset for {test_user['username']}")
        
        time.sleep(0.5)  # Small delay
        
        # Verify new password works
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": REGULAR_USERNAME,
            "password": new_password
        })
        assert response.status_code == 200, f"Login with new password failed: {response.text}"
        print("✓ User can login with new password")
        
        # Reset back to original password
        requests.post(f"{BASE_URL}/api/admin/user/action", 
            headers=admin_session["headers"],
            json={
                "user_id": test_user["id"],
                "action": "reset_password",
                "new_password": REGULAR_PASSWORD
            }
        )
    
    def test_reset_password_validation(self, admin_session, test_user):
        """Password reset validates password requirements"""
        if not test_user:
            pytest.skip("Test user not found")
        
        # Try with too short password
        response = requests.post(f"{BASE_URL}/api/admin/user/action", 
            headers=admin_session["headers"],
            json={
                "user_id": test_user["id"],
                "action": "reset_password",
                "new_password": "abc"  # Too short
            }
        )
        assert response.status_code == 400, f"Expected 400 for invalid password, got {response.status_code}"
        print("✓ Password validation works (rejects short passwords)")
    
    def test_toggle_feature(self, admin_session, test_user):
        """Admin can toggle user features"""
        if not test_user:
            pytest.skip("Test user not found")
        
        # Disable a feature
        response = requests.post(f"{BASE_URL}/api/admin/user/action", 
            headers=admin_session["headers"],
            json={
                "user_id": test_user["id"],
                "action": "toggle_feature",
                "feature": "habits"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("ok") == True, "Action should return ok: true"
        assert "disabledFeatures" in data, "Response should contain disabledFeatures"
        print(f"✓ Feature toggle successful, disabled features: {data['disabledFeatures']}")
        
        # Toggle back (enable)
        response = requests.post(f"{BASE_URL}/api/admin/user/action", 
            headers=admin_session["headers"],
            json={
                "user_id": test_user["id"],
                "action": "toggle_feature",
                "feature": "habits"
            }
        )
        assert response.status_code == 200
        print("✓ Feature re-enabled successfully")
    
    def test_cannot_modify_admin_user(self, admin_session):
        """Admin cannot disable/modify the admin user itself"""
        # Get admin user ID - admin should not be in the users list
        response = requests.get(f"{BASE_URL}/api/admin/users?search=admin", headers=admin_session["headers"])
        if response.status_code != 200:
            pytest.skip("Could not search users")
        
        users = response.json().get("users", [])
        admin_in_list = any(u["username"] == "admin" for u in users)
        
        # Admin user should be excluded from the list
        # If somehow in list, try to disable and expect 403
        if admin_in_list:
            admin_user = next(u for u in users if u["username"] == "admin")
            response = requests.post(f"{BASE_URL}/api/admin/user/action", 
                headers=admin_session["headers"],
                json={
                    "user_id": admin_user["id"],
                    "action": "disable"
                }
            )
            assert response.status_code == 403, f"Should not be able to disable admin, got {response.status_code}"
        
        print("✓ Admin user is protected from modification")
    
    def test_get_user_detail(self, admin_session, test_user):
        """Admin can get detailed user info"""
        if not test_user:
            pytest.skip("Test user not found")
        
        response = requests.get(f"{BASE_URL}/api/admin/user/{test_user['id']}", 
            headers=admin_session["headers"])
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "user" in data, "Response should contain user"
        assert "data" in data, "Response should contain user data"
        print(f"✓ Got detailed info for user {data['user']['username']}")


class TestGoogleAuthGoogleIdPriority:
    """Test that Google login prioritizes google_id (sub) for user lookup"""
    
    def test_google_auth_endpoint_exists(self):
        """Verify Google auth endpoint exists"""
        response = requests.post(f"{BASE_URL}/api/auth/google", json={
            "session_id": "invalid_session"
        })
        # Should get 400 or 502, not 404
        assert response.status_code in [400, 502], f"Expected 400/502, got {response.status_code}"
        print("✓ Google auth endpoint exists and responds")


# Cleanup fixture to ensure rafael user is enabled after tests
@pytest.fixture(scope="session", autouse=True)
def cleanup_after_tests(admin_session, test_user):
    """Ensure test user is enabled after all tests"""
    yield
    if test_user:
        # Enable user
        requests.post(f"{BASE_URL}/api/admin/user/action", 
            headers=admin_session["headers"],
            json={
                "user_id": test_user["id"],
                "action": "enable"
            }
        )
        # Reset password to original
        requests.post(f"{BASE_URL}/api/admin/user/action", 
            headers=admin_session["headers"],
            json={
                "user_id": test_user["id"],
                "action": "reset_password",
                "new_password": REGULAR_PASSWORD
            }
        )
        print("\n[Cleanup] Rafael user re-enabled and password reset")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
