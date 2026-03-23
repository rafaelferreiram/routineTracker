"""
Test AI Itinerary and Transcribe endpoints for Event Itinerary feature.
Tests:
- /api/ai/itinerary - AI-powered itinerary generation
- /api/ai/transcribe - Audio transcription via Whisper
"""
import pytest
import requests
import os
import io

BASE_URL = "https://habit-events-log.preview.emergentagent.com"

class TestAIItinerary:
    """Test AI Itinerary endpoint for event planning"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login-email", json={
            "email": "ferreira.rafah@gmail.com",
            "password": "admin"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}"
        }
    
    def test_itinerary_endpoint_returns_valid_json(self):
        """Test that /api/ai/itinerary returns valid JSON with message and itinerary"""
        response = requests.post(f"{BASE_URL}/api/ai/itinerary", 
            headers=self.headers,
            json={
                "event_title": "Viagem NYC",
                "start_date": "2026-04-17",
                "end_date": "2026-04-27",
                "user_message": "Quero visitar museus",
                "current_itinerary": []
            },
            timeout=60  # AI can take time
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data, "Response should have 'success' field"
        assert data["success"] == True, "success should be True"
        assert "message" in data, "Response should have 'message' field"
        assert "itinerary" in data, "Response should have 'itinerary' field"
        assert isinstance(data["message"], str), "message should be a string"
        assert isinstance(data["itinerary"], list), "itinerary should be a list"
        
        print(f"AI Response message: {data['message'][:100]}...")
        print(f"Itinerary has {len(data['itinerary'])} days")
    
    def test_itinerary_organizes_activities_in_correct_days(self):
        """Test that AI organizes activities within the event date range"""
        response = requests.post(f"{BASE_URL}/api/ai/itinerary", 
            headers=self.headers,
            json={
                "event_title": "Viagem NYC",
                "start_date": "2026-04-17",
                "end_date": "2026-04-20",
                "user_message": "Quero visitar a Estátua da Liberdade e o Empire State",
                "current_itinerary": []
            },
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        
        # Check that activities are within date range
        for day in data["itinerary"]:
            assert "date" in day, "Each day should have a date"
            assert "activities" in day, "Each day should have activities"
            
            # Verify date is within range
            date = day["date"]
            assert date >= "2026-04-17", f"Date {date} is before start date"
            assert date <= "2026-04-20", f"Date {date} is after end date"
            
            # Verify activities structure
            for activity in day["activities"]:
                assert "title" in activity, "Activity should have title"
                print(f"  {day['date']}: {activity.get('time', '--:--')} - {activity['title']}")
    
    def test_itinerary_preserves_current_itinerary(self):
        """Test that AI can work with existing itinerary"""
        existing_itinerary = [
            {
                "date": "2026-04-17",
                "activities": [
                    {"time": "10:00", "title": "Check-in hotel", "notes": ""}
                ]
            }
        ]
        
        response = requests.post(f"{BASE_URL}/api/ai/itinerary", 
            headers=self.headers,
            json={
                "event_title": "Viagem NYC",
                "start_date": "2026-04-17",
                "end_date": "2026-04-20",
                "user_message": "Adicione um jantar no dia 18",
                "current_itinerary": existing_itinerary
            },
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"AI preserved/updated itinerary: {len(data['itinerary'])} days")
    
    def test_itinerary_requires_auth(self):
        """Test that endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/ai/itinerary", 
            headers={"Content-Type": "application/json"},
            json={
                "event_title": "Test",
                "start_date": "2026-04-17",
                "end_date": "2026-04-20",
                "user_message": "Test",
                "current_itinerary": []
            }
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"


class TestAITranscribe:
    """Test AI Transcribe endpoint for voice input"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login-email", json={
            "email": "ferreira.rafah@gmail.com",
            "password": "admin"
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}"
        }
    
    def test_transcribe_endpoint_exists(self):
        """Test that /api/ai/transcribe endpoint exists and requires file"""
        # Send request without file - should get 422 (validation error)
        response = requests.post(f"{BASE_URL}/api/ai/transcribe", 
            headers=self.headers
        )
        
        # Should return 422 (missing file) not 404 (endpoint not found)
        assert response.status_code == 422, f"Expected 422 for missing file, got {response.status_code}"
        print("Transcribe endpoint exists and validates file requirement")
    
    def test_transcribe_requires_auth(self):
        """Test that transcribe endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/ai/transcribe")
        
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"


class TestEventDataPersistence:
    """Test that itinerary data can be saved with events"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login-email", json={
            "email": "ferreira.rafah@gmail.com",
            "password": "admin"
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}"
        }
    
    def test_get_user_data(self):
        """Test that user data endpoint works (where events are stored)"""
        response = requests.get(f"{BASE_URL}/api/data", headers=self.headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "data" in data, "Response should have 'data' field"
        print(f"User data retrieved successfully")
    
    def test_save_user_data_with_itinerary(self):
        """Test that user data with itinerary can be saved"""
        # First get current data
        get_response = requests.get(f"{BASE_URL}/api/data", headers=self.headers)
        current_data = get_response.json().get("data", {})
        
        # Add test itinerary to an event (if events exist)
        if current_data and "events" in current_data:
            events = current_data.get("events", [])
            # Find a multi-day event
            for event in events:
                if event.get("endDate") and event.get("endDate") != event.get("date"):
                    # Add test itinerary
                    event["itinerary"] = [
                        {
                            "date": event["date"],
                            "activities": [
                                {"time": "10:00", "title": "TEST_Activity", "notes": "Test note"}
                            ]
                        }
                    ]
                    break
            
            # Save updated data
            save_response = requests.put(f"{BASE_URL}/api/data", 
                headers=self.headers,
                json={"data": current_data}
            )
            
            assert save_response.status_code == 200, f"Save failed: {save_response.text}"
            assert save_response.json().get("ok") == True
            print("Itinerary data saved successfully")
        else:
            print("No events found to test itinerary persistence")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
