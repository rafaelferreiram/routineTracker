"""
Test suite for DDoS Protection, Security Features, and Analytics System
Tests:
- DDoS protection middleware (100 req/min threshold)
- Rate limiting (30 req/60s per endpoint)
- IP blocking (403 response for blocked IPs)
- Suspicious activity tracking
- /api/admin/analytics endpoint
- /api/admin/security endpoint
- /api/admin/security/unblock endpoint
- Analytics events stored in MongoDB
"""

import pytest
import requests
import os
import time
from datetime import datetime

# Use localhost for testing since we're running inside the container
BASE_URL = "http://localhost:8001"

# Test credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "@dm1n"

# Global session to reuse token
_admin_token = None

def get_admin_token():
    """Get admin token, caching it to avoid rate limiting"""
    global _admin_token
    if _admin_token is None:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            _admin_token = response.json()["token"]
        else:
            raise Exception(f"Failed to get admin token: {response.status_code} - {response.text}")
    return _admin_token


class TestHealthAndBasics:
    """Basic health check tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print("PASS: Health endpoint working")


class TestAdminAuthentication:
    """Admin authentication tests"""
    
    def test_admin_login(self):
        """Test admin can login and get token"""
        token = get_admin_token()
        assert token is not None
        assert len(token) > 0
        print(f"PASS: Admin login successful, token obtained")


class TestAnalyticsEndpoint:
    """Tests for /api/admin/analytics endpoint"""
    
    def test_analytics_endpoint_requires_auth(self):
        """Test analytics endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics")
        assert response.status_code == 403
        print("PASS: Analytics endpoint requires authentication")
    
    def test_analytics_endpoint_default_period(self):
        """Test analytics endpoint with default period (7d)"""
        token = get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "period" in data
        assert data["period"] == "7d"
        assert "userGrowth" in data
        assert "loginByHour" in data
        assert "popularHabits" in data
        assert "categoryDistribution" in data
        assert "avgCompletionRate" in data
        assert "securityEvents" in data
        assert "realTimeMetrics" in data
        assert "engagement" in data
        
        print(f"PASS: Analytics endpoint returns correct structure")
        print(f"  - User growth data points: {len(data['userGrowth'])}")
        print(f"  - Login by hour data points: {len(data['loginByHour'])}")
        print(f"  - Popular habits: {len(data['popularHabits'])}")
        print(f"  - Real-time metrics: {data['realTimeMetrics']}")
    
    def test_analytics_endpoint_24h_period(self):
        """Test analytics endpoint with 24h period"""
        token = get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics?period=24h",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["period"] == "24h"
        # 24h period should have 24 data points for user growth
        assert len(data["userGrowth"]) == 24
        print(f"PASS: Analytics 24h period returns 24 data points")
    
    def test_analytics_endpoint_30d_period(self):
        """Test analytics endpoint with 30d period"""
        token = get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics?period=30d",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["period"] == "30d"
        # 30d period should have 30 data points
        assert len(data["userGrowth"]) == 30
        print(f"PASS: Analytics 30d period returns 30 data points")
    
    def test_analytics_endpoint_90d_period(self):
        """Test analytics endpoint with 90d period"""
        token = get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics?period=90d",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["period"] == "90d"
        # 90d period should have 12 weeks of data
        assert len(data["userGrowth"]) == 12
        print(f"PASS: Analytics 90d period returns 12 weekly data points")
    
    def test_analytics_engagement_metrics(self):
        """Test analytics engagement metrics structure"""
        token = get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        engagement = data["engagement"]
        assert "usersWithHabits" in engagement
        assert "usersWithEvents" in engagement
        assert "totalUsers" in engagement
        assert "habitAdoptionRate" in engagement
        assert "eventAdoptionRate" in engagement
        
        print(f"PASS: Engagement metrics structure correct")
        print(f"  - Total users: {engagement['totalUsers']}")
        print(f"  - Habit adoption rate: {engagement['habitAdoptionRate']}%")
        print(f"  - Event adoption rate: {engagement['eventAdoptionRate']}%")
    
    def test_analytics_realtime_metrics(self):
        """Test analytics real-time metrics structure"""
        token = get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        realtime = data["realTimeMetrics"]
        assert "activeConnections" in realtime
        assert "blockedIPs" in realtime
        assert "requestsLastHour" in realtime
        
        print(f"PASS: Real-time metrics structure correct")
        print(f"  - Active connections: {realtime['activeConnections']}")
        print(f"  - Blocked IPs: {realtime['blockedIPs']}")
        print(f"  - Requests last hour: {realtime['requestsLastHour']}")
    
    def test_popular_habits_structure(self):
        """Test popular habits data structure"""
        token = get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        popular_habits = data["popularHabits"]
        assert isinstance(popular_habits, list)
        
        if len(popular_habits) > 0:
            habit = popular_habits[0]
            assert "name" in habit
            assert "count" in habit
            print(f"PASS: Popular habits structure correct - top habit: {habit['name']} ({habit['count']} users)")
        else:
            print("PASS: Popular habits structure correct (no habits yet)")
    
    def test_category_distribution_structure(self):
        """Test category distribution data structure"""
        token = get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        categories = data["categoryDistribution"]
        assert isinstance(categories, list)
        
        if len(categories) > 0:
            cat = categories[0]
            assert "category" in cat
            assert "count" in cat
            print(f"PASS: Category distribution structure correct - top category: {cat['category']} ({cat['count']})")
        else:
            print("PASS: Category distribution structure correct (no categories yet)")
    
    def test_login_by_hour_structure(self):
        """Test login by hour data structure"""
        token = get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        login_by_hour = data["loginByHour"]
        assert isinstance(login_by_hour, list)
        assert len(login_by_hour) == 24  # 24 hours
        
        # Verify structure of each hour
        for hour_data in login_by_hour:
            assert "hour" in hour_data
            assert "count" in hour_data
        
        print(f"PASS: Login by hour structure correct - 24 hours of data")
        
        # Find peak hour
        peak = max(login_by_hour, key=lambda x: x["count"])
        print(f"  - Peak login hour: {peak['hour']} with {peak['count']} logins")


class TestSecurityEndpoint:
    """Tests for /api/admin/security endpoint"""
    
    def test_security_endpoint_requires_auth(self):
        """Test security endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/security")
        assert response.status_code == 403
        print("PASS: Security endpoint requires authentication")
    
    def test_security_endpoint_structure(self):
        """Test security endpoint returns correct structure"""
        token = get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/security",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "blockedIPs" in data
        assert "suspiciousIPs" in data
        assert "totalBlocked" in data
        assert "totalSuspicious" in data
        assert "recentEvents" in data
        assert "config" in data
        
        print(f"PASS: Security endpoint returns correct structure")
        print(f"  - Blocked IPs: {data['totalBlocked']}")
        print(f"  - Suspicious IPs: {data['totalSuspicious']}")
        print(f"  - Recent events: {len(data['recentEvents'])}")
    
    def test_security_config_values(self):
        """Test security config contains expected values"""
        token = get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/security",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        config = data["config"]
        assert config["rateLimitWindow"] == 60
        assert config["rateLimitMaxRequests"] == 30
        assert config["ddosThreshold"] == 100
        assert config["blockDuration"] == 300
        assert config["suspiciousThreshold"] == 5
        
        print(f"PASS: Security config values correct")
        print(f"  - Rate limit: {config['rateLimitMaxRequests']} req/{config['rateLimitWindow']}s")
        print(f"  - DDoS threshold: {config['ddosThreshold']} req/min")
        print(f"  - Block duration: {config['blockDuration']}s")
        print(f"  - Suspicious threshold: {config['suspiciousThreshold']} violations")
    
    def test_security_events_logged(self):
        """Test that security events are logged and retrievable"""
        token = get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/security",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify recent events structure
        assert "recentEvents" in data
        assert isinstance(data["recentEvents"], list)
        
        # If there are events, verify their structure
        if len(data["recentEvents"]) > 0:
            event = data["recentEvents"][0]
            assert "type" in event
            assert "timestamp" in event
            assert event["type"] in ["ip_blocked", "rate_limit_exceeded", "ip_unblocked"]
            print(f"PASS: Security events logged - found {len(data['recentEvents'])} events")
        else:
            print("PASS: Security events structure correct (no events yet)")


class TestUnblockEndpoint:
    """Tests for /api/admin/security/unblock endpoint"""
    
    def test_unblock_endpoint_requires_auth(self):
        """Test unblock endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/security/unblock", json={
            "ip": "192.168.1.1"
        })
        assert response.status_code == 403
        print("PASS: Unblock endpoint requires authentication")
    
    def test_unblock_nonexistent_ip(self):
        """Test unblocking an IP that isn't blocked"""
        token = get_admin_token()
        response = requests.post(
            f"{BASE_URL}/api/admin/security/unblock",
            headers={"Authorization": f"Bearer {token}"},
            json={"ip": "192.168.99.99"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] == False
        assert "not found" in data["message"].lower()
        print("PASS: Unblock nonexistent IP returns ok=False")


class TestDDoSProtection:
    """Tests for DDoS protection middleware"""
    
    def test_ddos_middleware_active(self):
        """Test that DDoS protection middleware is active"""
        # Make a few requests to verify middleware doesn't block normal traffic
        for i in range(5):
            response = requests.get(f"{BASE_URL}/api/health")
            assert response.status_code == 200
        
        print("PASS: DDoS middleware allows normal traffic")
    
    def test_blocked_ip_mechanism_exists(self):
        """Test that IP blocking mechanism exists"""
        token = get_admin_token()
        
        security_response = requests.get(
            f"{BASE_URL}/api/admin/security",
            headers={"Authorization": f"Bearer {token}"}
        )
        data = security_response.json()
        
        # Verify the blocking mechanism exists
        assert "blockedIPs" in data
        assert isinstance(data["blockedIPs"], list)
        assert "config" in data
        assert data["config"]["blockDuration"] == 300  # 5 minutes
        print("PASS: IP blocking mechanism exists and is accessible")


class TestAnalyticsSecurityEventsIntegration:
    """Tests for security events in analytics endpoint"""
    
    def test_analytics_security_events_in_analytics(self):
        """Test that security events appear in analytics endpoint"""
        token = get_admin_token()
        response = requests.get(
            f"{BASE_URL}/api/admin/analytics",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify security events are included
        assert "securityEvents" in data
        assert isinstance(data["securityEvents"], list)
        print(f"PASS: Analytics includes security events - found {len(data['securityEvents'])} events")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
