"""
Backend tests for: email verification, registration with/without email, resend-verification.
Rate limit awareness: register=5/min, login=10/min. Uses module-level fixtures to minimize API calls.
"""
import pytest
import requests
import time
import random

BASE_URL = 'http://localhost:8001'
ADMIN_USER = 'admin'
ADMIN_PASS = '@dm1n'

RUN_ID = random.randint(10000, 99999)


# ── Shared session ─────────────────────────────────────────────────────────────
@pytest.fixture(scope='module')
def http():
    s = requests.Session()
    s.headers.update({'Content-Type': 'application/json'})
    return s


@pytest.fixture(scope='module')
def admin_token(http):
    resp = http.post(f'{BASE_URL}/api/auth/login', json={'username': ADMIN_USER, 'password': ADMIN_PASS})
    assert resp.status_code == 200, f'Admin login failed: {resp.text}'
    return resp.json()['token']


# ── Module-level test users (created once, shared across tests) ────────────────
@pytest.fixture(scope='module')
def user_with_email(http):
    """Register one user WITH email — shared by all tests needing it."""
    time.sleep(1)  # Small delay to avoid rate limit between test runs
    username = f'emvf{RUN_ID}'
    email = f'emvf{RUN_ID}@testexample.com'
    resp = http.post(f'{BASE_URL}/api/auth/register', json={
        'username': username,
        'password': 'TestPass1!',
        'email': email,
    })
    assert resp.status_code == 200, f'Register with email failed: {resp.text}'
    return resp.json()


@pytest.fixture(scope='module')
def user_without_email(http, user_with_email):
    """Register one user WITHOUT email — shared by all tests needing it."""
    time.sleep(1)  # Small delay
    username = f'noeml{RUN_ID}'
    resp = http.post(f'{BASE_URL}/api/auth/register', json={
        'username': username,
        'password': 'TestPass1!',
    })
    assert resp.status_code == 200, f'Register without email failed: {resp.text}'
    return resp.json()


# ── Registration WITH email ────────────────────────────────────────────────────

class TestRegisterWithEmail:
    """POST /api/auth/register with email"""

    def test_register_with_email_has_token(self, user_with_email):
        data = user_with_email
        assert 'token' in data, f'No token: {data}'
        assert isinstance(data['token'], str) and len(data['token']) > 10

    def test_register_with_email_verified_is_false(self, user_with_email):
        user = user_with_email.get('user', {})
        assert user.get('emailVerified') is False, \
            f'Expected emailVerified=False, got: {user.get("emailVerified")}'

    def test_register_with_email_has_emailSent_field(self, user_with_email):
        assert 'emailSent' in user_with_email, f'Missing emailSent field: {user_with_email}'

    def test_register_with_email_user_has_email(self, user_with_email):
        user = user_with_email.get('user', {})
        assert user.get('email') is not None, f'No email in user: {user}'

    def test_register_with_email_user_has_id_and_username(self, user_with_email):
        user = user_with_email.get('user', {})
        assert 'id' in user and 'username' in user, f'Missing id/username: {user}'


# ── Registration WITHOUT email ─────────────────────────────────────────────────

class TestRegisterWithoutEmail:
    """POST /api/auth/register without email"""

    def test_register_without_email_has_token(self, user_without_email):
        data = user_without_email
        assert 'token' in data, f'No token: {data}'

    def test_register_without_email_verified_is_null(self, user_without_email):
        user = user_without_email.get('user', {})
        assert user.get('emailVerified') is None, \
            f'Expected emailVerified=None, got: {user.get("emailVerified")}'

    def test_register_without_email_emailSent_is_false(self, user_without_email):
        data = user_without_email
        assert data.get('emailSent') is False, \
            f'Expected emailSent=False, got: {data.get("emailSent")}'

    def test_register_without_email_user_email_is_null(self, user_without_email):
        user = user_without_email.get('user', {})
        assert not user.get('email'), f'Expected no email, got: {user.get("email")}'


# ── Registration Validation ────────────────────────────────────────────────────

class TestRegisterValidation:
    """Registration validation — rate limit aware (uses admin_token fixture which resets after module)"""

    def test_register_duplicate_username_returns_400(self, http, admin_token):
        """admin user already exists → 400"""
        time.sleep(2)  # wait to avoid rate limiting
        resp = http.post(f'{BASE_URL}/api/auth/login', json={'username': ADMIN_USER, 'password': ADMIN_PASS})
        # Re-register admin to trigger duplicate check
        resp2 = http.post(f'{BASE_URL}/api/auth/register', json={'username': ADMIN_USER, 'password': 'TestPass1!'})
        assert resp2.status_code == 400, f'Expected 400 for duplicate, got {resp2.status_code}: {resp2.text}'

    def test_register_invalid_email_returns_400(self, http):
        time.sleep(13)  # Wait for rate limit window to reset (5 req/min=12s between regs)
        resp = http.post(f'{BASE_URL}/api/auth/register', json={
            'username': f'badml{RUN_ID}',
            'password': 'TestPass1!',
            'email': 'notanemail',
        })
        assert resp.status_code == 400, f'Expected 400 for invalid email, got {resp.status_code}: {resp.text}'


# ── Email Verification Endpoint ────────────────────────────────────────────────

class TestVerifyEmail:
    """GET /api/auth/verify-email"""

    def test_verify_email_invalid_token_returns_404(self, http):
        resp = http.get(f'{BASE_URL}/api/auth/verify-email?token=totally_invalid_token_abc123xyz')
        assert resp.status_code == 404, f'Expected 404 for invalid token, got {resp.status_code}: {resp.text}'

    def test_verify_email_invalid_token_has_detail(self, http):
        resp = http.get(f'{BASE_URL}/api/auth/verify-email?token=another_bad_token_xyz789')
        data = resp.json()
        assert 'detail' in data, f'No detail in error response: {data}'

    def test_verify_email_invalid_token_error_message(self, http):
        resp = http.get(f'{BASE_URL}/api/auth/verify-email?token=badtokenxyz')
        data = resp.json()
        detail = data.get('detail', '')
        assert detail, f'Empty detail message: {data}'


# ── Resend Verification ────────────────────────────────────────────────────────

class TestResendVerification:
    """POST /api/auth/resend-verification"""

    def test_resend_unauthenticated_returns_401(self, http):
        """No auth token → 401/403"""
        unauth = requests.Session()
        unauth.headers.update({'Content-Type': 'application/json'})
        resp = unauth.post(f'{BASE_URL}/api/auth/resend-verification')
        assert resp.status_code in [401, 403], \
            f'Expected 401 or 403, got {resp.status_code}: {resp.text}'

    def test_resend_admin_no_email_returns_400(self, http, admin_token):
        """Admin has no email → 400"""
        resp = http.post(f'{BASE_URL}/api/auth/resend-verification',
            headers={'Authorization': f'Bearer {admin_token}'})
        assert resp.status_code == 400, \
            f'Expected 400 (no email), got {resp.status_code}: {resp.text}'
        assert 'detail' in resp.json()

    def test_resend_with_email_user_returns_ok_or_resend_restriction(self, http, user_with_email):
        """User with unverified email — Resend test mode only allows owner email"""
        token = user_with_email['token']
        resp = http.post(f'{BASE_URL}/api/auth/resend-verification',
            headers={'Authorization': f'Bearer {token}'})
        # 200 = email sent, 500 = Resend test mode restriction (non-owner email)
        assert resp.status_code in [200, 500], \
            f'Expected 200 or 500, got {resp.status_code}: {resp.text}'


# ── Login Endpoint ─────────────────────────────────────────────────────────────

class TestLoginEndpoints:
    """POST /api/auth/login"""

    def test_login_returns_token(self, http):
        resp = http.post(f'{BASE_URL}/api/auth/login', json={'username': ADMIN_USER, 'password': ADMIN_PASS})
        assert resp.status_code == 200, f'Login failed: {resp.text}'
        assert 'token' in resp.json()

    def test_login_returns_user_object(self, http):
        resp = http.post(f'{BASE_URL}/api/auth/login', json={'username': ADMIN_USER, 'password': ADMIN_PASS})
        user = resp.json().get('user', {})
        assert 'id' in user and 'username' in user

    def test_login_invalid_credentials_returns_401(self, http):
        resp = http.post(f'{BASE_URL}/api/auth/login', json={'username': 'nobody99', 'password': 'wrongpass'})
        assert resp.status_code in [401, 400], f'Expected 401/400, got {resp.status_code}'
