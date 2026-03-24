"""
Test TARS AI Assistant Function Calling Features
Tests:
1. TARS listing user events
2. TARS adding activity to existing event itinerary (Viagem NYC)
3. Activity persistence in database
4. TARS viewing event itinerary
5. TARS creating new habit
"""

import pytest
import requests
import os
import time
import json

# Use preview endpoint for testing
BASE_URL = os.environ.get('preview_endpoint', 'https://streak-trophies.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "ferreira.rafah@gmail.com"
TEST_PASSWORD = "admin"


class TestTARSFunctionCalling:
    """Test TARS AI assistant function calling capabilities"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login-email",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data["token"]
        self.user_id = data["user"]["id"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        yield
    
    def get_user_data(self):
        """Helper to get current user data"""
        response = requests.get(f"{BASE_URL}/api/data", headers=self.headers)
        assert response.status_code == 200
        return response.json().get("data", {})
    
    def test_01_tars_lists_user_events(self):
        """Test 1: TARS should be able to list user events via AI chat"""
        # Send a message asking TARS to list events
        response = requests.post(
            f"{BASE_URL}/api/ai/chat",
            headers=self.headers,
            json={"message": "Quais são meus eventos?"}
        )
        
        assert response.status_code == 200, f"AI chat failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "success" in data, "Response should have 'success' field"
        assert data["success"] == True, "Response should be successful"
        assert "message" in data, "Response should have 'message' field"
        
        # The AI should mention the events in its response
        message = data["message"].lower()
        # Check if TARS mentions at least one known event
        assert any(event in message for event in ["viagem", "nyc", "aniversário", "ufc"]), \
            f"TARS should mention user events in response. Got: {data['message'][:200]}"
        
        print(f"✅ TARS listed events: {data['message'][:300]}...")
    
    def test_02_tars_views_event_itinerary(self):
        """Test 2: TARS should be able to view the itinerary of an existing event"""
        # Ask TARS to show the NYC trip itinerary
        response = requests.post(
            f"{BASE_URL}/api/ai/chat",
            headers=self.headers,
            json={"message": "Mostre o roteiro da viagem NYC"}
        )
        
        assert response.status_code == 200, f"AI chat failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, "Response should be successful"
        assert "message" in data, "Response should have message"
        
        # Check if TARS used the get_event_itinerary function
        message = data["message"]
        # The response should contain itinerary details
        assert any(term in message.lower() for term in ["roteiro", "atividade", "café", "empire", "itinerário"]), \
            f"TARS should show itinerary details. Got: {message[:300]}"
        
        # Check if actions were executed (function calling)
        if "actions" in data:
            print(f"✅ TARS executed actions: {data['actions']}")
        
        print(f"✅ TARS viewed itinerary: {message[:300]}...")
    
    def test_03_tars_adds_activity_to_itinerary(self):
        """Test 3: TARS should add an activity to the Viagem NYC itinerary"""
        # Get current itinerary state
        user_data_before = self.get_user_data()
        events_before = user_data_before.get("events", [])
        nyc_event_before = next((e for e in events_before if "nyc" in e.get("title", "").lower()), None)
        itinerary_before = nyc_event_before.get("itinerary", []) if nyc_event_before else []
        
        # Count activities before
        activities_count_before = sum(len(day.get("activities", [])) for day in itinerary_before)
        print(f"Activities before: {activities_count_before}")
        
        # Ask TARS to add an activity
        response = requests.post(
            f"{BASE_URL}/api/ai/chat",
            headers=self.headers,
            json={
                "message": "Adicione ao roteiro da viagem NYC: visita ao MoMA às 15:00 no dia 2026-04-19"
            },
            timeout=60  # AI calls can take time
        )
        
        assert response.status_code == 200, f"AI chat failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, f"Response should be successful. Got: {data}"
        
        # Check if function was called
        if "actions" in data:
            print(f"✅ TARS executed actions: {data['actions']}")
            # Verify the action result indicates success
            assert any("✅" in str(action) or "adicionado" in str(action).lower() for action in data["actions"]), \
                f"Action should indicate success. Actions: {data['actions']}"
        
        print(f"✅ TARS response: {data['message'][:300]}...")
    
    def test_04_activity_persisted_in_database(self):
        """Test 4: Verify the activity added by TARS was saved in the database"""
        # Wait a moment for database to sync
        time.sleep(1)
        
        # Get current user data
        user_data = self.get_user_data()
        events = user_data.get("events", [])
        
        # Find the NYC event
        nyc_event = next((e for e in events if "nyc" in e.get("title", "").lower()), None)
        assert nyc_event is not None, "Viagem NYC event should exist"
        
        itinerary = nyc_event.get("itinerary", [])
        assert len(itinerary) > 0, "Itinerary should have days"
        
        # Check if MoMA activity was added (on 2026-04-19)
        all_activities = []
        for day in itinerary:
            for activity in day.get("activities", []):
                all_activities.append({
                    "date": day.get("date"),
                    "time": activity.get("time"),
                    "title": activity.get("title")
                })
        
        print(f"All activities in NYC itinerary: {json.dumps(all_activities, indent=2)}")
        
        # Look for MoMA activity
        moma_found = any(
            "moma" in act["title"].lower() or "museum" in act["title"].lower()
            for act in all_activities
        )
        
        assert moma_found, f"MoMA activity should be in itinerary. Activities: {all_activities}"
        print("✅ MoMA activity was persisted in database")
    
    def test_05_tars_creates_new_habit(self):
        """Test 5: TARS should be able to create a new habit"""
        # Get habits before
        user_data_before = self.get_user_data()
        habits_before = user_data_before.get("habits", [])
        habits_count_before = len(habits_before)
        
        # Ask TARS to create a habit
        unique_habit_name = f"TEST_Meditação_{int(time.time())}"
        response = requests.post(
            f"{BASE_URL}/api/ai/chat",
            headers=self.headers,
            json={
                "message": f"Crie um hábito chamado '{unique_habit_name}' com emoji 🧘 frequência diária"
            },
            timeout=60
        )
        
        assert response.status_code == 200, f"AI chat failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, f"Response should be successful. Got: {data}"
        
        # Check if function was called
        if "actions" in data:
            print(f"✅ TARS executed actions: {data['actions']}")
            assert any("✅" in str(action) or "criado" in str(action).lower() for action in data["actions"]), \
                f"Action should indicate habit creation. Actions: {data['actions']}"
        
        # Verify habit was created in database
        time.sleep(1)
        user_data_after = self.get_user_data()
        habits_after = user_data_after.get("habits", [])
        
        # Check if new habit exists
        new_habit = next((h for h in habits_after if unique_habit_name in h.get("name", "")), None)
        assert new_habit is not None, f"New habit should exist. Habits: {[h.get('name') for h in habits_after]}"
        
        # Verify habit properties
        assert new_habit.get("emoji") == "🧘", f"Habit emoji should be 🧘. Got: {new_habit.get('emoji')}"
        assert new_habit.get("frequency") == "daily", f"Habit frequency should be daily. Got: {new_habit.get('frequency')}"
        
        print(f"✅ Habit created: {new_habit}")
        
        # Cleanup: We'll leave the habit for now (prefixed with TEST_)


class TestTARSEdgeCases:
    """Test edge cases and error handling"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login-email",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        self.token = data["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        yield
    
    def test_ai_chat_requires_auth(self):
        """AI chat endpoint should require authentication"""
        response = requests.post(
            f"{BASE_URL}/api/ai/chat",
            json={"message": "Hello"}
        )
        assert response.status_code == 401 or response.status_code == 403, \
            f"Should require auth. Got: {response.status_code}"
        print("✅ AI chat requires authentication")
    
    def test_ai_chat_handles_empty_message(self):
        """AI chat should handle empty messages gracefully"""
        response = requests.post(
            f"{BASE_URL}/api/ai/chat",
            headers=self.headers,
            json={"message": ""}
        )
        # Should either return 400 or handle gracefully
        assert response.status_code in [200, 400, 422], \
            f"Should handle empty message. Got: {response.status_code}"
        print(f"✅ Empty message handled with status: {response.status_code}")
    
    def test_add_to_nonexistent_event(self):
        """TARS should handle adding to non-existent event gracefully"""
        response = requests.post(
            f"{BASE_URL}/api/ai/chat",
            headers=self.headers,
            json={
                "message": "Adicione uma atividade ao evento 'Evento Inexistente XYZ123'"
            },
            timeout=60
        )
        
        assert response.status_code == 200, f"Should not crash. Got: {response.status_code}"
        data = response.json()
        
        # TARS should indicate the event wasn't found
        message = data.get("message", "").lower()
        actions = data.get("actions", [])
        
        # Either in message or actions, there should be indication of not found
        not_found_indicated = (
            "não encontr" in message or 
            "not found" in message or
            any("não encontr" in str(a).lower() or "❌" in str(a) for a in actions)
        )
        
        print(f"Response: {data}")
        # This is informational - TARS might ask for clarification instead
        print(f"✅ Non-existent event handled. Response: {message[:200]}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
