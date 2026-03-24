"""Backend API tests for RoutineQuest"""
import pytest
import requests
import os

BASE_URL = "https://friend-events-2.preview.emergentagent.com"

class TestHealth:
    def test_health(self):
        r = requests.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

class TestAuth:
    """Auth endpoint tests"""

    def test_login_rafael(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "rafael", "password": "admin"})
        assert r.status_code == 200
        data = r.json()
        assert "token" in data
        assert data["user"]["username"] == "rafael"

    def test_login_gabriela(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "gabriela", "password": "gabriela"})
        assert r.status_code == 200
        data = r.json()
        assert "token" in data
        assert data["user"]["username"] == "gabriela"

    def test_login_wrong_password(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "rafael", "password": "wrongpass"})
        assert r.status_code == 400

    def test_login_unknown_user(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "nobody_xyz", "password": "pass"})
        assert r.status_code == 400

    def test_register_new_user(self):
        import time
        import random
        username = f"testuser{int(time.time())}{random.randint(100,999)}"[:20]  # alphanumeric only, max 20 chars
        r = requests.post(f"{BASE_URL}/api/auth/register", json={"username": username, "password": "testpass123"})
        assert r.status_code == 200
        data = r.json()
        assert "token" in data
        assert data["user"]["username"] == username.lower()

    def test_register_duplicate_user(self):
        r = requests.post(f"{BASE_URL}/api/auth/register", json={"username": "rafael", "password": "whatever"})
        assert r.status_code == 400

class TestData:
    """Data endpoints with auth"""

    @pytest.fixture
    def token(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "rafael", "password": "admin"})
        return r.json()["token"]

    def test_get_data_authenticated(self, token):
        r = requests.get(f"{BASE_URL}/api/data", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.json()
        assert "data" in data  # may be null on fresh DB

    def test_get_data_unauthenticated(self):
        r = requests.get(f"{BASE_URL}/api/data")
        assert r.status_code == 403

    def test_put_data_and_verify(self, token):
        payload = {"habits": [], "profile": {"name": "Rafael", "totalXP": 100}}
        r = requests.put(
            f"{BASE_URL}/api/data",
            json={"data": payload},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert r.status_code == 200
        assert r.json()["ok"] is True

        # Verify persistence
        r2 = requests.get(f"{BASE_URL}/api/data", headers={"Authorization": f"Bearer {token}"})
        assert r2.status_code == 200
        saved = r2.json()["data"]
        assert saved is not None
        assert saved["profile"]["name"] == "Rafael"

    def test_put_data_unauthenticated(self):
        r = requests.put(f"{BASE_URL}/api/data", json={"data": {}})
        assert r.status_code == 403
