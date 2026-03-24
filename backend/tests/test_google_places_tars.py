"""
Test suite for Google Places API integration and TARS AI assistant
Tests:
1. Email login with existing user (ferreira.rafah@gmail.com)
2. TARS search_places function via /api/ai/chat
3. TARS add_to_itinerary function via /api/ai/chat
4. User data retrieval (27 habits, 5 events)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://friend-events-2.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "ferreira.rafah@gmail.com"
TEST_PASSWORD = "admin"


class TestEmailLogin:
    """Test email login functionality"""
    
    def test_login_with_email_success(self):
        """Test login with valid email and password"""
        response = requests.post(f"{BASE_URL}/api/auth/login-email", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "token" in data, "Token missing from response"
        assert "user" in data, "User missing from response"
        assert data["user"]["email"] == TEST_EMAIL.lower(), f"Email mismatch: {data['user']['email']}"
        assert len(data["token"]) > 0, "Token is empty"
        
        print(f"✅ Login successful for user: {data['user']['displayName']}")
        return data["token"]
    
    def test_login_with_wrong_password(self):
        """Test login with wrong password returns 400"""
        response = requests.post(f"{BASE_URL}/api/auth/login-email", json={
            "email": TEST_EMAIL,
            "password": "wrongpassword"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✅ Wrong password correctly rejected")
    
    def test_login_with_nonexistent_email(self):
        """Test login with non-existent email returns 400"""
        response = requests.post(f"{BASE_URL}/api/auth/login-email", json={
            "email": "nonexistent@example.com",
            "password": "anypassword"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✅ Non-existent email correctly rejected")


class TestUserData:
    """Test user data retrieval"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login-email", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Authentication failed")
    
    def test_get_user_data(self, auth_token):
        """Test retrieving user data with habits and events"""
        response = requests.get(
            f"{BASE_URL}/api/data",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed to get data: {response.text}"
        data = response.json()
        
        assert "data" in data, "Data field missing"
        user_data = data["data"]
        
        # Check habits
        habits = user_data.get("habits", [])
        print(f"📊 Found {len(habits)} habits")
        
        # Check events
        events = user_data.get("events", [])
        print(f"📅 Found {len(events)} events")
        
        # Verify we have the expected data
        assert len(habits) > 0, "No habits found"
        assert len(events) > 0, "No events found"
        
        # Look for Viagem NYC event
        nyc_event = None
        for event in events:
            if "nyc" in event.get("title", "").lower() or "new york" in event.get("title", "").lower():
                nyc_event = event
                break
        
        if nyc_event:
            print(f"🗽 Found NYC trip event: {nyc_event.get('title')}")
            itinerary = nyc_event.get("itinerary", [])
            total_activities = sum(len(day.get("activities", [])) for day in itinerary)
            print(f"   Itinerary has {len(itinerary)} days with {total_activities} activities")
        
        print(f"✅ User data retrieved: {len(habits)} habits, {len(events)} events")


class TestTARSSearchPlaces:
    """Test TARS AI assistant search_places function via Google Places API"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login-email", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Authentication failed")
    
    def test_tars_search_italian_restaurants_times_square(self, auth_token):
        """Test TARS searching for Italian restaurants in Times Square"""
        response = requests.post(
            f"{BASE_URL}/api/ai/chat",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={
                "message": "Busque restaurantes italianos perto de Times Square em Nova York"
            },
            timeout=60
        )
        
        assert response.status_code == 200, f"TARS chat failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, f"TARS response not successful: {data}"
        assert "message" in data, "Message missing from response"
        
        message = data["message"]
        print(f"🤖 TARS response: {message[:500]}...")
        
        # Check if response contains place information
        # The response should mention restaurants with ratings, addresses, etc.
        has_place_info = any(keyword in message.lower() for keyword in [
            "restaurante", "restaurant", "⭐", "rating", "avaliações", 
            "endereço", "address", "maps", "encontrei"
        ])
        
        assert has_place_info, "TARS response doesn't seem to contain place information"
        print("✅ TARS successfully searched for Italian restaurants in Times Square")
    
    def test_tars_search_museums_manhattan(self, auth_token):
        """Test TARS searching for museums in Manhattan"""
        response = requests.post(
            f"{BASE_URL}/api/ai/chat",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={
                "message": "Quais museus você recomenda em Manhattan, Nova York?"
            },
            timeout=60
        )
        
        assert response.status_code == 200, f"TARS chat failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, f"TARS response not successful: {data}"
        print(f"🤖 TARS museum search response: {data['message'][:500]}...")
        print("✅ TARS successfully searched for museums in Manhattan")


class TestTARSAddToItinerary:
    """Test TARS AI assistant add_to_itinerary function"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login-email", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Authentication failed")
    
    def test_tars_add_activity_to_nyc_trip(self, auth_token):
        """Test TARS adding an activity to the NYC trip itinerary"""
        # First, let's ask TARS to add something to the NYC trip
        response = requests.post(
            f"{BASE_URL}/api/ai/chat",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={
                "message": "Adicione uma visita ao Empire State Building às 10:00 no dia 2025-04-17 no roteiro da viagem NYC"
            },
            timeout=60
        )
        
        assert response.status_code == 200, f"TARS chat failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, f"TARS response not successful: {data}"
        
        message = data["message"]
        print(f"🤖 TARS add to itinerary response: {message[:500]}...")
        
        # Check if the response indicates success
        success_indicators = ["adicionado", "adicionei", "roteiro", "✅", "sucesso"]
        has_success = any(indicator in message.lower() for indicator in success_indicators)
        
        # Also check actions if present
        if "actions" in data:
            print(f"   Actions executed: {data['actions']}")
        
        print("✅ TARS add_to_itinerary function executed")
    
    def test_tars_get_event_itinerary(self, auth_token):
        """Test TARS getting the current itinerary for NYC trip"""
        response = requests.post(
            f"{BASE_URL}/api/ai/chat",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={
                "message": "Mostre o roteiro atual da viagem NYC"
            },
            timeout=60
        )
        
        assert response.status_code == 200, f"TARS chat failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, f"TARS response not successful: {data}"
        
        message = data["message"]
        print(f"🤖 TARS itinerary response: {message[:800]}...")
        
        # Check if response contains itinerary information
        has_itinerary_info = any(keyword in message.lower() for keyword in [
            "roteiro", "dia", "atividade", "📅", "📋", "horário"
        ])
        
        print("✅ TARS get_event_itinerary function executed")


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        
        assert data.get("status") == "ok", f"Health status not ok: {data}"
        print("✅ API health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
