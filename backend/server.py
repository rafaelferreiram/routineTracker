from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, validator, EmailStr
from pymongo import MongoClient
import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timezone, timedelta
from typing import Any, Optional, List
import os
import requests as http_req
from dotenv import load_dotenv
import asyncio
import io
import re
from collections import defaultdict
import time
import secrets
import resend

load_dotenv()

# ── Config ─────────────────────────────────────────────────────────────────────
MONGO_URL  = os.environ.get('MONGO_URL')
DB_NAME    = os.environ.get('DB_NAME')
JWT_SECRET = os.environ.get('JWT_SECRET', 'change_this_in_production_' + os.urandom(16).hex())
JWT_ALG    = 'HS256'
JWT_DAYS   = 90
# Use user's OpenAI key or fallback to Emergent LLM Key
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
# Google Maps API Key
GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY')
# Resend Email
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL   = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
APP_URL        = os.environ.get('APP_URL', 'http://localhost:3000')
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(title='RoutineTracker API')

# CORS configuration - more restrictive for production
ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', '*').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS != ['*'] else ['*'],
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allow_headers=['Authorization', 'Content-Type', 'X-Requested-With'],
)

# ── Database ───────────────────────────────────────────────────────────────────
client  = MongoClient(MONGO_URL)
db      = client[DB_NAME]
users_c = db['users']
data_c  = db['user_data']

users_c.create_index('username', unique=True)
data_c.create_index('user_id')

# ── Security ───────────────────────────────────────────────────────────────────
bearer = HTTPBearer()

# ═══════════════════════════════════════════════════════════════════════════════
# ═══ ADVANCED DDoS PROTECTION & SECURITY SYSTEM ════════════════════════════════
# ═══════════════════════════════════════════════════════════════════════════════

# Rate limiting storage
rate_limit_store = defaultdict(list)
blocked_ips = {}  # IP -> unblock_timestamp
suspicious_activity = defaultdict(int)  # IP -> violation count
request_analytics = defaultdict(list)  # endpoint -> timestamps for analytics

# Configuration
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 30  # max requests per window for general endpoints
DDOS_BLOCK_DURATION = 300  # 5 minutes block for DDoS attempts
DDOS_THRESHOLD = 100  # requests per minute to trigger DDoS protection
SUSPICIOUS_THRESHOLD = 5  # violations before IP gets blocked
MAX_REQUEST_SIZE = 10 * 1024 * 1024  # 10MB max request size

# Analytics collection for admin dashboard
analytics_c = db['analytics']
analytics_c.create_index([('type', 1), ('timestamp', -1)])
analytics_c.create_index('timestamp', expireAfterSeconds=30*24*60*60)  # 30 days TTL

def log_analytics_event(event_type: str, data: dict = None):
    """Log analytics event for admin dashboard."""
    try:
        analytics_c.insert_one({
            'type': event_type,
            'timestamp': datetime.now(timezone.utc),
            'data': data or {},
        })
    except Exception as e:
        print(f'[ANALYTICS] Error logging event: {e}')

def is_ip_blocked(ip: str) -> bool:
    """Check if IP is currently blocked."""
    if ip in blocked_ips:
        if time.time() < blocked_ips[ip]:
            return True
        else:
            del blocked_ips[ip]
            suspicious_activity[ip] = 0
    return False

def block_ip(ip: str, duration: int = DDOS_BLOCK_DURATION):
    """Block an IP for specified duration."""
    blocked_ips[ip] = time.time() + duration
    log_analytics_event('ip_blocked', {'ip': ip, 'duration': duration})
    print(f'[SECURITY] Blocked IP: {ip} for {duration} seconds')

def check_ddos_protection(request: Request):
    """Check for DDoS attacks and block suspicious IPs."""
    ip = request.client.host if request.client else 'unknown'
    
    # Check if IP is blocked
    if is_ip_blocked(ip):
        raise HTTPException(status_code=403, detail='Access temporarily blocked. Try again later.')
    
    # Track requests for DDoS detection
    now = time.time()
    key = f"ddos:{ip}"
    rate_limit_store[key] = [t for t in rate_limit_store[key] if now - t < 60]
    rate_limit_store[key].append(now)
    
    # Check for DDoS (too many requests in short time)
    if len(rate_limit_store[key]) > DDOS_THRESHOLD:
        block_ip(ip, DDOS_BLOCK_DURATION)
        raise HTTPException(status_code=429, detail='Too many requests. Access blocked temporarily.')

def check_rate_limit(ip: str, endpoint: str = 'default', max_requests: int = RATE_LIMIT_MAX_REQUESTS):
    """Enhanced rate limiting with violation tracking."""
    # Check if IP is blocked
    if is_ip_blocked(ip):
        raise HTTPException(status_code=403, detail='Access temporarily blocked.')
    
    key = f"{ip}:{endpoint}"
    now = time.time()
    
    # Clean old entries
    rate_limit_store[key] = [t for t in rate_limit_store[key] if now - t < RATE_LIMIT_WINDOW]
    
    if len(rate_limit_store[key]) >= max_requests:
        # Track violation
        suspicious_activity[ip] += 1
        
        # Log analytics
        log_analytics_event('rate_limit_exceeded', {'ip': ip, 'endpoint': endpoint})
        
        # Block if too many violations
        if suspicious_activity[ip] >= SUSPICIOUS_THRESHOLD:
            block_ip(ip)
            raise HTTPException(status_code=403, detail='Access blocked due to repeated violations.')
        
        raise HTTPException(status_code=429, detail='Too many requests. Please try again later.')
    
    rate_limit_store[key].append(now)

# Middleware for global security
@app.middleware("http")
async def security_middleware(request: Request, call_next):
    """Global security middleware for DDoS protection and request validation."""
    ip = request.client.host if request.client else 'unknown'
    
    # Check if IP is blocked
    if is_ip_blocked(ip):
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=403,
            content={"detail": "Access temporarily blocked. Try again later."}
        )
    
    # Track request for analytics
    endpoint = request.url.path
    request_analytics[endpoint].append(time.time())
    
    # Clean old analytics data (keep last hour)
    now = time.time()
    for ep in list(request_analytics.keys()):
        request_analytics[ep] = [t for t in request_analytics[ep] if now - t < 3600]
    
    # DDoS check for all requests
    try:
        check_ddos_protection(request)
    except HTTPException as e:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=e.status_code, content={"detail": e.detail})
    
    # Log page view for analytics (only for main endpoints)
    if endpoint in ['/', '/api/data', '/api/habits']:
        log_analytics_event('page_view', {'endpoint': endpoint, 'ip_hash': hash(ip) % 10000})
    
    response = await call_next(request)
    return response

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_pw(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode('utf-8'), hashed.encode('utf-8'))

def make_token(uid: str, username: str) -> str:
    payload = {
        'sub': uid,
        'username': username,
        'exp': datetime.now(timezone.utc) + timedelta(days=JWT_DAYS),
        'iat': datetime.now(timezone.utc),  # Issued at
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
        # Validate required fields
        if not payload.get('sub') or not payload.get('username'):
            raise HTTPException(status_code=401, detail='Invalid token payload')
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail='Invalid or expired token')

# Input sanitization helper
def sanitize_string(s: str, max_length: int = 1000) -> str:
    """Sanitize string input to prevent injection attacks."""
    if not s:
        return ''
    # Remove null bytes and control characters
    s = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', s)
    # Trim to max length
    return s[:max_length].strip()

# ── Pydantic Models ─────────────────────────────────────────────────────────────
class AuthReq(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

class EmailLoginReq(BaseModel):
    email: str
    password: str

class GoogleAuthReq(BaseModel):
    session_id: str

class DataReq(BaseModel):
    data: Any

class ChangePasswordReq(BaseModel):
    current_password: str
    new_password: str

class ForgotPasswordReq(BaseModel):
    email: str

class ResetPasswordReq(BaseModel):
    token: str
    new_password: str

class UpdateProfileReq(BaseModel):
    picture: Optional[str] = None
    display_name: Optional[str] = None

# ── Auth Routes ────────────────────────────────────────────────────────────────
@app.get('/api/health')
def health():
    return {'status': 'ok', 'service': 'RoutineTracker API'}

# ── Data Sync Endpoint (for importing data to production) ──────────────────────
SYNC_SECRET = os.environ.get('SYNC_SECRET', 'routine_sync_2026_secret')

class SyncDataReq(BaseModel):
    secret: str
    email: str
    data: Any
    user_info: Optional[dict] = None

@app.post('/api/sync/import')
def sync_import(req: SyncDataReq):
    """Import user data (for syncing between environments). Protected by secret."""
    if req.secret != SYNC_SECRET:
        raise HTTPException(status_code=403, detail='Invalid sync secret')
    
    email = req.email.lower().strip()
    
    # Find user by email
    user = users_c.find_one({'email': email})
    if not user:
        # Also check by regex
        user = users_c.find_one({'email': re.compile(f'^{re.escape(email)}$', re.IGNORECASE)})
    
    if not user:
        # Create user if user_info is provided
        if req.user_info:
            username = req.user_info.get('username', email.split('@')[0])
            # Make sure username is unique
            base_username = username
            counter = 1
            while users_c.find_one({'username': username}):
                username = f'{base_username}{counter}'
                counter += 1
            
            theme = req.user_info.get('theme', {'accentColor': '#22c55e', 'bgColor': '#080808', 'bgCard': '#111111', 'bgBorder': '#1f1f1f'})
            ins = users_c.insert_one({
                'username': username,
                'display_name': req.user_info.get('display_name', username),
                'email': email,
                'picture': req.user_info.get('picture', ''),
                'theme': theme,
                'password_hash': hash_pw('admin'),  # Default password
                'auth_provider': 'synced',
                'created_at': datetime.now(timezone.utc),
            })
            user = users_c.find_one({'_id': ins.inserted_id})
            print(f'[SYNC] Created new user: {username} with email {email}')
        else:
            raise HTTPException(status_code=404, detail=f'User with email {email} not found. Please login first or provide user_info.')
    
    uid = str(user['_id'])
    
    # Update or create user_data
    result = data_c.update_one(
        {'user_id': uid},
        {'$set': {
            'data': req.data,
            'synced_at': datetime.now(timezone.utc)
        }},
        upsert=True
    )
    
    habits_count = len(req.data.get('habits', []))
    events_count = len(req.data.get('events', []))
    
    return {
        'success': True,
        'message': f'Data imported for {email}',
        'user_id': uid,
        'username': user['username'],
        'habits': habits_count,
        'events': events_count
    }

@app.post('/api/sync/setup-password')
def sync_setup_password(req: SyncDataReq):
    """Add password to a Google-only account. Protected by secret."""
    if req.secret != SYNC_SECRET:
        raise HTTPException(status_code=403, detail='Invalid sync secret')
    
    email = req.email.lower().strip()
    password = req.data.get('password', 'admin')
    
    # Find user by email
    user = users_c.find_one({'email': email})
    if not user:
        user = users_c.find_one({'email': re.compile(f'^{re.escape(email)}$', re.IGNORECASE)})
    
    if not user:
        raise HTTPException(status_code=404, detail=f'User with email {email} not found')
    
    # Update password
    users_c.update_one(
        {'_id': user['_id']},
        {'$set': {'password_hash': hash_pw(password)}}
    )
    
    return {
        'success': True,
        'message': f'Password set for {email}',
        'username': user['username']
    }


@app.get('/api/sync/diagnose')
def sync_diagnose(email: str, secret: str):
    """Diagnose account issues for an email. Protected by secret."""
    if secret != SYNC_SECRET:
        raise HTTPException(status_code=403, detail='Invalid sync secret')
    
    import re
    email_lower = email.lower().strip()
    
    results = {
        'email_searched': email_lower,
        'users_found': [],
        'user_data_found': [],
    }
    
    # Search for users with this email (multiple strategies)
    users_exact = list(users_c.find({'email': email_lower}, {'_id': 1, 'username': 1, 'email': 1, 'auth_provider': 1, 'google_id': 1, 'created_at': 1}))
    users_regex = list(users_c.find({'email': re.compile(f'^{re.escape(email_lower)}$', re.IGNORECASE)}, {'_id': 1, 'username': 1, 'email': 1, 'auth_provider': 1, 'google_id': 1, 'created_at': 1}))
    
    # Combine and dedupe
    seen_ids = set()
    for u in users_exact + users_regex:
        uid = str(u['_id'])
        if uid not in seen_ids:
            seen_ids.add(uid)
            results['users_found'].append({
                'id': uid,
                'username': u.get('username'),
                'email': u.get('email'),
                'auth_provider': u.get('auth_provider', 'password'),
                'google_id': u.get('google_id'),
                'created_at': str(u.get('created_at', 'unknown'))
            })
    
    # Also search by username (email prefix)
    email_prefix = email_lower.split('@')[0]
    users_by_username = list(users_c.find({'username': email_prefix}, {'_id': 1, 'username': 1, 'email': 1, 'auth_provider': 1}))
    for u in users_by_username:
        uid = str(u['_id'])
        if uid not in seen_ids:
            seen_ids.add(uid)
            results['users_found'].append({
                'id': uid,
                'username': u.get('username'),
                'email': u.get('email', 'NOT SET'),
                'auth_provider': u.get('auth_provider', 'password'),
                'note': 'Found by username match'
            })
    
    # Get user_data for each found user
    for user_info in results['users_found']:
        uid = user_info['id']
        data_doc = data_c.find_one({'user_id': uid})
        if data_doc:
            data = data_doc.get('data', {})
            results['user_data_found'].append({
                'user_id': uid,
                'username': user_info['username'],
                'habits_count': len(data.get('habits', [])),
                'events_count': len(data.get('events', [])),
                'total_xp': data.get('profile', {}).get('totalXP', 0),
                'synced_at': str(data_doc.get('synced_at', 'never'))
            })
    
    # Summary
    results['summary'] = {
        'total_users_found': len(results['users_found']),
        'total_data_docs': len(results['user_data_found']),
        'recommendation': ''
    }
    
    if len(results['users_found']) == 0:
        results['summary']['recommendation'] = 'No user found with this email. The user needs to register first or sync data using /api/sync/import with user_info.'
    elif len(results['users_found']) == 1:
        results['summary']['recommendation'] = 'Single user found. Google login should work if email matches exactly.'
    else:
        results['summary']['recommendation'] = f'Multiple users found ({len(results["users_found"])}). This may cause issues. Consider merging accounts or deleting duplicates.'
    
    return results


@app.post('/api/auth/login')
def login(req: AuthReq, request: Request):
    # Rate limit login attempts
    client_ip = request.client.host if request.client else 'unknown'
    check_rate_limit(client_ip, 'login', max_requests=10)  # 10 attempts per minute
    
    username = sanitize_string(req.username.lower(), 50)
    user = users_c.find_one({'username': username})
    if not user:
        raise HTTPException(status_code=400, detail='User not found')
    
    # Check if user is disabled
    if user.get('disabled'):
        raise HTTPException(status_code=403, detail='Conta desativada. Entre em contato com o administrador.')
    
    if not user.get('password_hash'):
        raise HTTPException(status_code=400, detail='Esta conta não tem senha. Use o login com Google.')
    
    if not check_pw(req.password, user['password_hash']):
        raise HTTPException(status_code=400, detail='Wrong password')
    
    # Update last login timestamp
    users_c.update_one(
        {'_id': user['_id']},
        {'$set': {'last_login_at': datetime.now(timezone.utc)}}
    )
    
    is_admin = user.get('is_admin', False)
    
    token = make_token(str(user['_id']), user['username'])
    return {
        'token': token,
        'user': {
            'id': str(user['_id']),
            'username': user['username'],
            'displayName': user.get('display_name', user['username']),
            'email': user.get('email', ''),
            'picture': user.get('picture', ''),
            'theme': user.get('theme', {}),
            'isAdmin': is_admin,
            'emailVerified': user.get('email_verified') if user.get('email') else None,
        }
    }

@app.post('/api/auth/login-email')
def login_email(req: EmailLoginReq, request: Request):
    """Login using email instead of username."""
    # Rate limit login attempts
    client_ip = request.client.host if request.client else 'unknown'
    check_rate_limit(client_ip, 'login', max_requests=10)  # 10 attempts per minute
    
    email = sanitize_string(req.email.lower(), 100)
    
    # Validate email format
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        raise HTTPException(status_code=400, detail='Email inválido')
    
    # Find user by email
    user = users_c.find_one({'email': email})
    if not user:
        user = users_c.find_one({'email': re.compile(f'^{re.escape(email)}$', re.IGNORECASE)})
    
    if not user:
        raise HTTPException(status_code=400, detail='Email não encontrado')
    
    # Check if user is disabled
    if user.get('disabled'):
        raise HTTPException(status_code=403, detail='Conta desativada. Entre em contato com o administrador.')
    
    if not user.get('password_hash'):
        raise HTTPException(status_code=400, detail='Esta conta não tem senha. Use o login com Google.')
    
    if not check_pw(req.password, user['password_hash']):
        raise HTTPException(status_code=400, detail='Senha incorreta')
    
    # Update last login timestamp
    users_c.update_one(
        {'_id': user['_id']},
        {'$set': {'last_login_at': datetime.now(timezone.utc)}}
    )
    
    token = make_token(str(user['_id']), user['username'])
    return {
        'token': token,
        'user': {
            'id': str(user['_id']),
            'username': user['username'],
            'displayName': user.get('display_name', user['username']),
            'email': user.get('email', ''),
            'picture': user.get('picture', ''),
            'theme': user.get('theme', {}),
            'emailVerified': user.get('email_verified') if user.get('email') else None,
        }
    }

# Password validation helper
def validate_password(password: str) -> tuple[bool, str]:
    """Validate password strength. Returns (is_valid, error_message)."""
    if len(password) < 6:
        return False, 'Senha deve ter no mínimo 6 caracteres'
    if len(password) > 50:
        return False, 'Senha deve ter no máximo 50 caracteres'
    if not any(c.isalpha() for c in password):
        return False, 'Senha deve conter pelo menos uma letra'
    if not any(c.isdigit() for c in password):
        return False, 'Senha deve conter pelo menos um número'
    return True, ''

def get_verification_email_html(username: str, display_name: str, verify_url: str) -> str:
    """Generate a beautiful HTML verification email matching the RoutineTracker dark theme."""
    logo_url = "https://static.prod-images.emergentagent.com/jobs/7c35102d-0122-480a-a772-76b2c409d53e/images/c2ad3e66b2aca02f2e8da438696dcf1dd640baa086f3996f3beb40a89fca2916.png"
    return f"""
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirme seu e-mail - RoutineTracker</title>
</head>
<body style="margin:0;padding:0;background-color:#080808;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#080808;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="{logo_url}" width="56" height="56" alt="RoutineTracker" style="border-radius:16px;display:block;margin:0 auto 16px auto;" />
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">RoutineTracker</h1>
              <p style="margin:6px 0 0;color:#6b7280;font-size:13px;">Transforme sua rotina em conquistas</p>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color:#111111;border:1px solid #1f1f1f;border-radius:24px;padding:40px 36px;">

              <!-- Green top accent bar -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                <tr>
                  <td style="height:3px;background:linear-gradient(90deg,#22c55e,#16a34a);border-radius:99px;"></td>
                </tr>
              </table>

              <!-- Greeting -->
              <h2 style="margin:0 0 8px;color:#ffffff;font-size:20px;font-weight:700;">Olá, {display_name}! 👋</h2>
              <p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.6;">
                Bem-vindo ao RoutineTracker! Para ativar sua conta e começar a transformar seus hábitos, confirme seu endereço de e-mail clicando no botão abaixo.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="{verify_url}" target="_blank"
                      style="display:inline-block;background-color:#22c55e;color:#000000;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:14px;letter-spacing:0.3px;">
                      ✓ Confirmar E-mail
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                <tr>
                  <td style="height:1px;background-color:#1f1f1f;"></td>
                </tr>
              </table>

              <!-- What you'll get section -->
              <p style="margin:0 0 16px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
                Com o RoutineTracker você terá:
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:6px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;vertical-align:middle;"><span style="display:inline-block;width:20px;height:20px;background:#22c55e18;border:1px solid #22c55e30;border-radius:6px;text-align:center;line-height:20px;font-size:11px;">✅</span></td>
                        <td style="padding-left:10px;color:#d1d5db;font-size:14px;">Rastreamento de hábitos com XP e níveis</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;vertical-align:middle;"><span style="display:inline-block;width:20px;height:20px;background:#22c55e18;border:1px solid #22c55e30;border-radius:6px;text-align:center;line-height:20px;font-size:11px;">✈️</span></td>
                        <td style="padding-left:10px;color:#d1d5db;font-size:14px;">Eventos compartilhados com amigos</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;vertical-align:middle;"><span style="display:inline-block;width:20px;height:20px;background:#22c55e18;border:1px solid #22c55e30;border-radius:6px;text-align:center;line-height:20px;font-size:11px;">🤖</span></td>
                        <td style="padding-left:10px;color:#d1d5db;font-size:14px;">Assistente TARS com IA personalizada</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Small print about link expiry -->
              <p style="margin:24px 0 0;color:#6b7280;font-size:12px;line-height:1.6;">
                Este link é válido por <strong style="color:#9ca3af;">72 horas</strong>. Se não foi você, pode ignorar este e-mail.
              </p>
            </td>
          </tr>

          <!-- Fallback URL -->
          <tr>
            <td style="padding:24px 16px 0;text-align:center;">
              <p style="margin:0 0 8px;color:#6b7280;font-size:12px;">Ou copie e cole este link no navegador:</p>
              <p style="margin:0;word-break:break-all;">
                <a href="{verify_url}" style="color:#22c55e;font-size:11px;text-decoration:none;">{verify_url}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 16px 0;text-align:center;border-top:1px solid #1f1f1f;margin-top:28px;">
              <p style="margin:0 0 4px;color:#6b7280;font-size:11px;">© 2026 RoutineTracker — Transforme sua rotina em conquistas.</p>
              <p style="margin:0;color:#374151;font-size:10px;">Você está recebendo este e-mail porque se cadastrou no RoutineTracker.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

async def send_verification_email(email: str, username: str, display_name: str, token: str):
    """Send email verification asynchronously via Resend."""
    if not RESEND_API_KEY:
        print('[EMAIL] RESEND_API_KEY not configured, skipping email')
        return False
    verify_url = f"{APP_URL}/?verify_email={token}"
    html = get_verification_email_html(username, display_name, verify_url)
    params = {
        "from": f"RoutineTracker <{SENDER_EMAIL}>",
        "to": [email],
        "subject": "✅ Confirme seu e-mail — RoutineTracker",
        "html": html,
    }
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        print(f'[EMAIL] Sent verification to {email}: {result}')
        return True
    except Exception as e:
        print(f'[EMAIL] Failed to send to {email}: {e}')
        return False

@app.post('/api/auth/register')
async def register(req: AuthReq, request: Request):
    # Rate limit registration attempts
    client_ip = request.client.host if request.client else 'unknown'
    check_rate_limit(client_ip, 'register', max_requests=5)

    username = sanitize_string(req.username.lower(), 20)
    display  = sanitize_string(req.username, 20)
    password = req.password
    email    = req.email.strip().lower() if req.email else None

    if not username or not password:
        raise HTTPException(status_code=400, detail='Username and password are required')
    if len(username) < 2:
        raise HTTPException(status_code=400, detail='Username must be at least 2 characters')
    if len(username) > 20:
        raise HTTPException(status_code=400, detail='Username must be at most 20 characters')
    if not username.isalnum():
        raise HTTPException(status_code=400, detail='Username must contain only letters and numbers')

    is_valid, error_msg = validate_password(password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    if users_c.find_one({'username': username}):
        raise HTTPException(status_code=400, detail='Username already taken')

    if email:
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
            raise HTTPException(status_code=400, detail='E-mail inválido')
        if users_c.find_one({'email': email}):
            raise HTTPException(status_code=400, detail='Este e-mail já está em uso')

    theme = {'accentColor': '#22c55e', 'bgColor': '#080808', 'bgCard': '#111111', 'bgBorder': '#1f1f1f'}

    verification_token   = secrets.token_urlsafe(32) if email else None
    verification_expires = datetime.now(timezone.utc) + timedelta(hours=72) if email else None

    user_doc = {
        'username':      username,
        'display_name':  display,
        'password_hash': hash_pw(password),
        'theme':         theme,
        'created_at':    datetime.now(timezone.utc),
    }
    if email:
        user_doc.update({
            'email':                email,
            'email_verified':       False,
            'verification_token':   verification_token,
            'verification_expires': verification_expires,
        })

    ins   = users_c.insert_one(user_doc)
    uid   = str(ins.inserted_id)
    token = make_token(uid, username)

    email_sent = False
    if email and verification_token:
        email_sent = await send_verification_email(email, username, display, verification_token)

    return {
        'token': token,
        'user': {
            'id':           uid,
            'username':     username,
            'displayName':  display,
            'theme':        theme,
            'email':        email,
            'emailVerified': False if email else None,
        },
        'emailSent': email_sent,
    }

# ── Email Verification ─────────────────────────────────────────────────────────

@app.get('/api/auth/verify-email')
async def verify_email(token: str):
    """Verify email using the token from the verification email."""
    if not token:
        raise HTTPException(status_code=400, detail='Token inválido')

    user = users_c.find_one({'verification_token': token})
    if not user:
        raise HTTPException(status_code=404, detail='Token não encontrado ou já utilizado')

    # Check expiry
    expires = user.get('verification_expires')
    if expires:
        if isinstance(expires, str):
            expires = datetime.fromisoformat(expires.replace('Z', '+00:00'))
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=400, detail='Token expirado. Solicite um novo e-mail de verificação.')

    users_c.update_one(
        {'_id': user['_id']},
        {'$set': {'email_verified': True}, '$unset': {'verification_token': '', 'verification_expires': ''}}
    )
    return {'ok': True, 'message': 'E-mail confirmado com sucesso! Você já pode fazer login.'}

@app.post('/api/auth/resend-verification')
async def resend_verification(cu: dict = Depends(get_current_user)):
    """Resend email verification link."""
    from bson import ObjectId
    uid  = cu['sub']
    user = users_c.find_one({'_id': ObjectId(uid)})
    if not user:
        raise HTTPException(status_code=404, detail='Usuário não encontrado')
    if not user.get('email'):
        raise HTTPException(status_code=400, detail='Nenhum e-mail associado à conta')
    if user.get('email_verified'):
        return {'ok': True, 'message': 'E-mail já verificado'}

    new_token   = secrets.token_urlsafe(32)
    new_expires = datetime.now(timezone.utc) + timedelta(hours=72)
    users_c.update_one(
        {'_id': user['_id']},
        {'$set': {'verification_token': new_token, 'verification_expires': new_expires}}
    )
    sent = await send_verification_email(user['email'], user['username'], user.get('display_name', user['username']), new_token)
    if not sent:
        raise HTTPException(status_code=500, detail='Falha ao enviar e-mail. Tente novamente.')
    return {'ok': True, 'message': f'E-mail de verificação reenviado para {user["email"]}'}

# ── Forgot / Reset Password ────────────────────────────────────────────────────

def get_reset_password_email_html(display_name: str, reset_url: str) -> str:
    logo_url = "https://static.prod-images.emergentagent.com/jobs/7c35102d-0122-480a-a772-76b2c409d53e/images/c2ad3e66b2aca02f2e8da438696dcf1dd640baa086f3996f3beb40a89fca2916.png"
    return f"""
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir senha - RoutineTracker</title>
</head>
<body style="margin:0;padding:0;background-color:#080808;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#080808;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;">
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="{logo_url}" width="56" height="56" alt="RoutineTracker" style="border-radius:16px;display:block;margin:0 auto 16px auto;" />
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">RoutineTracker</h1>
              <p style="margin:6px 0 0;color:#6b7280;font-size:13px;">Transforme sua rotina em conquistas</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#111111;border:1px solid #1f1f1f;border-radius:24px;padding:40px 36px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                <tr><td style="height:3px;background:linear-gradient(90deg,#f59e0b,#d97706);border-radius:99px;"></td></tr>
              </table>
              <h2 style="margin:0 0 8px;color:#ffffff;font-size:20px;font-weight:700;">Redefinir sua senha</h2>
              <p style="margin:0 0 24px;color:#9ca3af;font-size:15px;line-height:1.6;">
                Olá, <strong style="color:#ffffff;">{display_name}</strong>! Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="{reset_url}" target="_blank"
                      style="display:inline-block;background-color:#f59e0b;color:#000000;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:14px;letter-spacing:0.3px;">
                      Redefinir Senha
                    </a>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                <tr><td style="height:1px;background-color:#1f1f1f;"></td></tr>
              </table>
              <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;">
                Este link é válido por <strong style="color:#9ca3af;">1 hora</strong>. Se você não solicitou a redefinição de senha, ignore este e-mail — sua conta continua segura.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 16px 0;text-align:center;">
              <p style="margin:0 0 8px;color:#6b7280;font-size:12px;">Ou copie e cole este link no navegador:</p>
              <p style="margin:0;word-break:break-all;">
                <a href="{reset_url}" style="color:#f59e0b;font-size:11px;text-decoration:none;">{reset_url}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 16px 0;text-align:center;border-top:1px solid #1f1f1f;margin-top:28px;">
              <p style="margin:0 0 4px;color:#6b7280;font-size:11px;">© 2026 RoutineTracker</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

async def send_reset_password_email(email: str, display_name: str, token: str):
    if not RESEND_API_KEY:
        print('[EMAIL] RESEND_API_KEY not configured, skipping reset email')
        return False
    reset_url = f"{APP_URL}/?reset_password={token}"
    html = get_reset_password_email_html(display_name, reset_url)
    params = {
        "from": f"RoutineTracker <{SENDER_EMAIL}>",
        "to": [email],
        "subject": "Redefinir senha — RoutineTracker",
        "html": html,
    }
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        print(f'[EMAIL] Sent password reset to {email}: {result}')
        return True
    except Exception as e:
        print(f'[EMAIL] Failed to send reset to {email}: {e}')
        return False

@app.post('/api/auth/forgot-password')
async def forgot_password(req: ForgotPasswordReq):
    """Send a password reset email. Always returns success to avoid revealing if email exists."""
    email_lower = req.email.strip().lower()
    user = users_c.find_one({'email': {'$regex': f'^{re.escape(email_lower)}$', '$options': 'i'}})

    if user and user.get('email'):
        reset_token   = secrets.token_urlsafe(32)
        reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        users_c.update_one(
            {'_id': user['_id']},
            {'$set': {'reset_token': reset_token, 'reset_token_expires': reset_expires}}
        )
        display = user.get('display_name') or user.get('displayName') or user.get('username', '')
        await send_reset_password_email(user['email'], display, reset_token)

    return {'ok': True, 'message': 'Se o e-mail estiver cadastrado, enviaremos um link de redefinição.'}

@app.post('/api/auth/reset-password')
async def reset_password(req: ResetPasswordReq):
    """Reset user password using the token from the reset email."""
    user = users_c.find_one({'reset_token': req.token})
    if not user:
        raise HTTPException(status_code=400, detail='Link inválido ou já utilizado.')

    expires = user.get('reset_token_expires')
    if expires and expires.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        users_c.update_one({'_id': user['_id']}, {'$unset': {'reset_token': '', 'reset_token_expires': ''}})
        raise HTTPException(status_code=400, detail='Link expirado. Solicite um novo.')

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail='A nova senha deve ter pelo menos 6 caracteres.')

    new_hash = hash_pw(req.new_password)
    users_c.update_one(
        {'_id': user['_id']},
        {'$set': {'password_hash': new_hash}, '$unset': {'reset_token': '', 'reset_token_expires': ''}}
    )
    return {'ok': True, 'message': 'Senha redefinida com sucesso!'}

# ── Google OAuth ───────────────────────────────────────────────────────────────
@app.post('/api/auth/google')
def google_auth(req: GoogleAuthReq):
    """Exchange Emergent session_id for our JWT. Creates user if first time."""
    print(f'[GOOGLE AUTH] Received session_id: {req.session_id[:20]}...')
    
    # 1. Exchange session_id with Emergent Auth (server-side only)
    try:
        resp = http_req.get(
            'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
            headers={'X-Session-ID': req.session_id},
            timeout=10,
        )
        print(f'[GOOGLE AUTH] Emergent response status: {resp.status_code}')
    except Exception as e:
        print(f'[GOOGLE AUTH] Error reaching auth service: {e}')
        raise HTTPException(status_code=502, detail='Could not reach Google auth service')

    if resp.status_code != 200:
        print(f'[GOOGLE AUTH] Invalid session, status: {resp.status_code}, body: {resp.text[:200]}')
        raise HTTPException(status_code=400, detail='Invalid Google session')

    g = resp.json()
    google_email = g.get('email', '').strip()
    email_lower  = google_email.lower()
    name         = g.get('name', google_email.split('@')[0])
    picture      = g.get('picture', '')
    google_id    = g.get('sub', g.get('id', ''))  # Google's unique user ID

    print(f'[GOOGLE AUTH] Google returned: email={google_email}, name={name}, google_id={google_id}, picture={picture[:50] if picture else "None"}')

    if not google_id:
        print(f'[GOOGLE AUTH] WARNING: No google_id (sub) returned from Google!')
    
    if not email_lower:
        raise HTTPException(status_code=400, detail='No email from Google')

    # 2. Find existing user - PRIORITY ORDER:
    #    1. google_id (most reliable - never changes)
    #    2. email (fallback for older accounts)
    import re
    
    user = None
    found_by = None
    
    # PRIORITY 1: Search by google_id (most reliable identifier)
    if google_id:
        user = users_c.find_one({'google_id': google_id})
        if user:
            found_by = 'google_id'
            print(f'[GOOGLE AUTH] ✓ Found user by google_id: {user["username"]}')
    
    # PRIORITY 2: Search by email (case-insensitive)
    if not user:
        user = users_c.find_one({'email': email_lower})
        if user:
            found_by = 'email_exact'
            print(f'[GOOGLE AUTH] ✓ Found user by email (exact): {user["username"]}')
    
    if not user:
        user = users_c.find_one({'email': re.compile(f'^{re.escape(email_lower)}$', re.IGNORECASE)})
        if user:
            found_by = 'email_regex'
            print(f'[GOOGLE AUTH] ✓ Found user by email (regex): {user["username"]}')
    
    if user:
        # Check if user is disabled
        if user.get('disabled'):
            raise HTTPException(status_code=403, detail='Conta desativada. Entre em contato com o administrador.')
        
        print(f'[GOOGLE AUTH] Found existing user: id={user["_id"]}, username={user["username"]}, email={user.get("email")}, found_by={found_by}')
        
        # Existing user — update Google info but keep their username and ID
        uid      = str(user['_id'])
        username = user['username']
        display  = user.get('display_name') or name  # Keep existing display name if set
        theme    = user.get('theme', {'accentColor': '#22c55e', 'bgColor': '#080808', 'bgCard': '#111111', 'bgBorder': '#1f1f1f'})
        
        # Update user with Google info - ALWAYS set google_id for future lookups
        update_data = {
            'picture':        picture,
            'google_id':      google_id,  # CRITICAL: Always save google_id
            'email':          email_lower,  # Ensure email is set
            'last_login_at':  datetime.now(timezone.utc),
        }
        
        # Only update display_name if not already set
        if not user.get('display_name'):
            update_data['display_name'] = name
        
        users_c.update_one({'_id': user['_id']}, {'$set': update_data})
        print(f'[GOOGLE AUTH] Updated existing user {username} with google_id={google_id}')
        
        # Verify user_data exists for this user
        existing_data = data_c.find_one({'user_id': uid})
        if existing_data:
            data_info = existing_data.get('data', {})
            print(f'[GOOGLE AUTH] User has existing data: {len(data_info.get("habits", []))} habits, {len(data_info.get("events", []))} events')
        else:
            print(f'[GOOGLE AUTH] WARNING: No user_data found for user {uid}, creating empty data document')
            data_c.insert_one({
                'user_id': uid,
                'data': {'habits': [], 'events': [], 'profile': {'name': display}},
                'created_at': datetime.now(timezone.utc)
            })
    else:
        # New user — derive username from email
        print(f'[GOOGLE AUTH] No existing user found, creating new user for email: {email_lower}, google_id: {google_id}')
        base = email_lower.split('@')[0]
        base = ''.join(c for c in base if c.isalnum() or c == '_')[:20] or 'user'
        username = base
        counter  = 1
        while users_c.find_one({'username': username}):
            username = f'{base}{counter}'
            counter += 1

        display = name
        theme = {'accentColor': '#22c55e', 'bgColor': '#080808', 'bgCard': '#111111', 'bgBorder': '#1f1f1f'}
        ins = users_c.insert_one({
            'username':      username,
            'display_name':  display,
            'email':         email_lower,
            'picture':       picture,
            'google_id':     google_id,  # CRITICAL: Save google_id for future lookups
            'auth_provider': 'google',
            'theme':         theme,
            'created_at':    datetime.now(timezone.utc),
            'last_login_at': datetime.now(timezone.utc),
        })
        uid = str(ins.inserted_id)
        print(f'[GOOGLE AUTH] Created new user: id={uid}, username={username}, google_id={google_id}')
        
        # Create initial user_data document
        data_c.insert_one({
            'user_id': uid,
            'data': {
                'habits': [],
                'events': [],
                'profile': {
                    'name': display,
                    'freezeShields': 0,
                    'focusHabitId': None,
                    'focusHabitDate': None,
                    'totalXP': 0
                },
                'settings': {
                    'theme': 'dark',
                    'accentColor': '#22c55e'
                },
                'moods': {},
                'journalEntries': [],
                'achievements': []
            },
            'created_at': datetime.now(timezone.utc)
        })
        print(f'[GOOGLE AUTH] Created initial user_data for {username}')

    token = make_token(uid, username)
    print(f'[GOOGLE AUTH] Success! Returning token for user {username} (id={uid})')
    
    return {
        'token': token,
        'user': {
            'id':          uid,
            'username':    username,
            'displayName': display,
            'email':       email_lower,
            'picture':     picture,
            'theme':       theme,
            'authProvider': 'google',
            'googleId':    google_id,  # Return google_id for debugging
        }
    }

# ── Data Routes ────────────────────────────────────────────────────────────────
@app.get('/api/data')
def get_data(cu: dict = Depends(get_current_user)):
    doc = data_c.find_one({'user_id': cu['sub']}, {'_id': 0, 'data': 1})
    return {'data': doc['data'] if doc and doc.get('data') else None}

@app.put('/api/data')
def save_data(req: DataReq, cu: dict = Depends(get_current_user)):
    data_c.update_one(
        {'user_id': cu['sub']},
        {'$set': {'data': req.data, 'updated_at': datetime.now(timezone.utc)}},
        upsert=True,
    )
    return {'ok': True}

# ══════════════════════════════════════════════════════════════════════════════
# ══ ADMIN PANEL ENDPOINTS ════════════════════════════════════════════════════
# ══════════════════════════════════════════════════════════════════════════════

ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD_HASH = hash_pw('@dm1n')  # Password: @dm1n

def get_admin_user(cu: dict = Depends(get_current_user)):
    """Dependency that verifies the user is an admin."""
    if cu.get('username') != ADMIN_USERNAME:
        raise HTTPException(status_code=403, detail='Admin access required')
    return cu

# Create admin user on startup if not exists
def ensure_admin_exists():
    admin = users_c.find_one({'username': ADMIN_USERNAME})
    if not admin:
        print('[ADMIN] Creating admin user...')
        users_c.insert_one({
            'username': ADMIN_USERNAME,
            'display_name': 'Administrador',
            'password_hash': ADMIN_PASSWORD_HASH,
            'is_admin': True,
            'created_at': datetime.now(timezone.utc),
        })
        print('[ADMIN] Admin user created: admin/@dm1n')
    else:
        # Ensure admin has is_admin flag
        if not admin.get('is_admin'):
            users_c.update_one({'username': ADMIN_USERNAME}, {'$set': {'is_admin': True}})

ensure_admin_exists()

@app.get('/api/admin/stats')
def admin_get_stats(cu: dict = Depends(get_admin_user)):
    """Get platform statistics for admin dashboard."""
    from bson import ObjectId
    
    # Total users (excluding admin)
    total_users = users_c.count_documents({'username': {'$ne': ADMIN_USERNAME}})
    
    # Active users (logged in last 7 days)
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    active_users = users_c.count_documents({
        'username': {'$ne': ADMIN_USERNAME},
        'last_login_at': {'$gte': week_ago}
    })
    
    # Users created today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    new_users_today = users_c.count_documents({
        'username': {'$ne': ADMIN_USERNAME},
        'created_at': {'$gte': today_start}
    })
    
    # Users by auth provider
    google_users = users_c.count_documents({'auth_provider': 'google'})
    password_users = total_users - google_users
    
    # Disabled users
    disabled_users = users_c.count_documents({'disabled': True})
    
    # Total habits across all users
    pipeline = [
        {'$project': {'habits_count': {'$size': {'$ifNull': ['$data.habits', []]}}}},
        {'$group': {'_id': None, 'total': {'$sum': '$habits_count'}}}
    ]
    habits_result = list(data_c.aggregate(pipeline))
    total_habits = habits_result[0]['total'] if habits_result else 0
    
    # Total events across all users
    pipeline = [
        {'$project': {'events_count': {'$size': {'$ifNull': ['$data.events', []]}}}},
        {'$group': {'_id': None, 'total': {'$sum': '$events_count'}}}
    ]
    events_result = list(data_c.aggregate(pipeline))
    total_events = events_result[0]['total'] if events_result else 0
    
    # Daily login counts for last 7 days
    daily_logins = []
    for i in range(7):
        day_start = (datetime.now(timezone.utc) - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = users_c.count_documents({
            'username': {'$ne': ADMIN_USERNAME},
            'last_login_at': {'$gte': day_start, '$lt': day_end}
        })
        daily_logins.append({
            'date': day_start.strftime('%Y-%m-%d'),
            'count': count
        })
    
    return {
        'total_users': total_users,
        'active_users': active_users,
        'new_users_today': new_users_today,
        'google_users': google_users,
        'password_users': password_users,
        'disabled_users': disabled_users,
        'total_habits': total_habits,
        'total_events': total_events,
        'daily_logins': list(reversed(daily_logins)),
    }

@app.get('/api/admin/users')
def admin_get_users(
    cu: dict = Depends(get_admin_user),
    skip: int = 0,
    limit: int = 50,
    search: str = None,
    filter_type: str = None  # 'google', 'password', 'disabled'
):
    """Get list of all users with their stats."""
    from bson import ObjectId
    
    query = {'username': {'$ne': ADMIN_USERNAME}}
    
    if search:
        query['$or'] = [
            {'username': {'$regex': search, '$options': 'i'}},
            {'email': {'$regex': search, '$options': 'i'}},
            {'display_name': {'$regex': search, '$options': 'i'}},
        ]
    
    if filter_type == 'google':
        query['auth_provider'] = 'google'
    elif filter_type == 'password':
        query['password_hash'] = {'$exists': True}
        query['auth_provider'] = {'$ne': 'google'}
    elif filter_type == 'disabled':
        query['disabled'] = True
    
    # Get users
    users_cursor = users_c.find(query, {
        '_id': 1, 'username': 1, 'display_name': 1, 'email': 1, 
        'picture': 1, 'auth_provider': 1, 'google_id': 1,
        'created_at': 1, 'last_login_at': 1, 'disabled': 1,
        'disabled_features': 1
    }).sort('created_at', -1).skip(skip).limit(limit)
    
    users_list = []
    for u in users_cursor:
        uid = str(u['_id'])
        
        # Get user data stats
        user_data = data_c.find_one({'user_id': uid}, {'_id': 0, 'data': 1})
        data = user_data.get('data', {}) if user_data else {}
        
        users_list.append({
            'id': uid,
            'username': u.get('username'),
            'displayName': u.get('display_name'),
            'email': u.get('email'),
            'picture': u.get('picture'),
            'authProvider': u.get('auth_provider', 'password'),
            'googleId': u.get('google_id'),
            'createdAt': u.get('created_at').isoformat() if u.get('created_at') else None,
            'lastLoginAt': u.get('last_login_at').isoformat() if u.get('last_login_at') else None,
            'disabled': u.get('disabled', False),
            'disabledFeatures': u.get('disabled_features', []),
            'stats': {
                'habits': len(data.get('habits', [])),
                'events': len(data.get('events', [])),
                'totalXP': data.get('profile', {}).get('totalXP', 0),
                'achievements': len(data.get('achievements', [])),
            }
        })
    
    total = users_c.count_documents(query)
    
    return {
        'users': users_list,
        'total': total,
        'skip': skip,
        'limit': limit,
    }

class AdminUserAction(BaseModel):
    user_id: str
    action: str  # 'disable', 'enable', 'reset_password', 'toggle_feature'
    new_password: str = None
    feature: str = None

@app.post('/api/admin/user/action')
def admin_user_action(req: AdminUserAction, cu: dict = Depends(get_admin_user)):
    """Perform admin action on a user."""
    from bson import ObjectId
    
    try:
        user = users_c.find_one({'_id': ObjectId(req.user_id)})
    except:
        raise HTTPException(status_code=400, detail='Invalid user ID')
    
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    
    if user.get('username') == ADMIN_USERNAME:
        raise HTTPException(status_code=403, detail='Cannot modify admin user')
    
    if req.action == 'disable':
        users_c.update_one(
            {'_id': ObjectId(req.user_id)},
            {'$set': {'disabled': True, 'disabled_at': datetime.now(timezone.utc)}}
        )
        return {'ok': True, 'message': f'User {user["username"]} disabled'}
    
    elif req.action == 'enable':
        users_c.update_one(
            {'_id': ObjectId(req.user_id)},
            {'$set': {'disabled': False}, '$unset': {'disabled_at': ''}}
        )
        return {'ok': True, 'message': f'User {user["username"]} enabled'}
    
    elif req.action == 'reset_password':
        if not req.new_password:
            raise HTTPException(status_code=400, detail='New password required')
        
        is_valid, error = validate_password(req.new_password)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error)
        
        users_c.update_one(
            {'_id': ObjectId(req.user_id)},
            {'$set': {'password_hash': hash_pw(req.new_password)}}
        )
        return {'ok': True, 'message': f'Password reset for {user["username"]}'}
    
    elif req.action == 'toggle_feature':
        if not req.feature:
            raise HTTPException(status_code=400, detail='Feature name required')
        
        current_features = user.get('disabled_features', [])
        
        if req.feature in current_features:
            # Enable feature
            current_features.remove(req.feature)
            message = f'Feature {req.feature} enabled for {user["username"]}'
        else:
            # Disable feature
            current_features.append(req.feature)
            message = f'Feature {req.feature} disabled for {user["username"]}'
        
        users_c.update_one(
            {'_id': ObjectId(req.user_id)},
            {'$set': {'disabled_features': current_features}}
        )
        return {'ok': True, 'message': message, 'disabledFeatures': current_features}
    
    else:
        raise HTTPException(status_code=400, detail=f'Unknown action: {req.action}')

@app.get('/api/admin/user/{user_id}')
def admin_get_user_detail(user_id: str, cu: dict = Depends(get_admin_user)):
    """Get detailed info for a specific user."""
    from bson import ObjectId
    
    try:
        user = users_c.find_one({'_id': ObjectId(user_id)})
    except:
        raise HTTPException(status_code=400, detail='Invalid user ID')
    
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    
    uid = str(user['_id'])
    user_data = data_c.find_one({'user_id': uid}, {'_id': 0, 'data': 1, 'updated_at': 1})
    data = user_data.get('data', {}) if user_data else {}
    
    return {
        'user': {
            'id': uid,
            'username': user.get('username'),
            'displayName': user.get('display_name'),
            'email': user.get('email'),
            'picture': user.get('picture'),
            'authProvider': user.get('auth_provider', 'password'),
            'googleId': user.get('google_id'),
            'createdAt': user.get('created_at').isoformat() if user.get('created_at') else None,
            'lastLoginAt': user.get('last_login_at').isoformat() if user.get('last_login_at') else None,
            'disabled': user.get('disabled', False),
            'disabledFeatures': user.get('disabled_features', []),
        },
        'data': {
            'habits': data.get('habits', []),
            'events': data.get('events', []),
            'profile': data.get('profile', {}),
            'settings': data.get('settings', {}),
            'achievements': data.get('achievements', []),
            'lastUpdated': user_data.get('updated_at').isoformat() if user_data and user_data.get('updated_at') else None,
        }
    }

# ══════════════════════════════════════════════════════════════════════════════
# ══ ANALYTICS & METRICS ENDPOINTS ═════════════════════════════════════════════
# ══════════════════════════════════════════════════════════════════════════════

@app.get('/api/admin/analytics')
def admin_get_analytics(
    cu: dict = Depends(get_admin_user),
    period: str = '7d'  # '24h', '7d', '30d', '90d'
):
    """Get comprehensive analytics for admin dashboard."""
    
    # Calculate date range
    now = datetime.now(timezone.utc)
    if period == '24h':
        start_date = now - timedelta(hours=24)
        interval = 'hour'
    elif period == '7d':
        start_date = now - timedelta(days=7)
        interval = 'day'
    elif period == '30d':
        start_date = now - timedelta(days=30)
        interval = 'day'
    else:  # 90d
        start_date = now - timedelta(days=90)
        interval = 'week'
    
    # 1. User Growth Chart
    user_growth = []
    if interval == 'hour':
        for i in range(24):
            hour_start = now - timedelta(hours=23-i)
            hour_end = hour_start + timedelta(hours=1)
            count = users_c.count_documents({
                'username': {'$ne': ADMIN_USERNAME},
                'created_at': {'$gte': hour_start, '$lt': hour_end}
            })
            user_growth.append({
                'label': hour_start.strftime('%H:00'),
                'value': count
            })
    elif interval == 'day':
        days = 7 if period == '7d' else 30
        for i in range(days):
            day_start = (now - timedelta(days=days-1-i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            count = users_c.count_documents({
                'username': {'$ne': ADMIN_USERNAME},
                'created_at': {'$gte': day_start, '$lt': day_end}
            })
            user_growth.append({
                'label': day_start.strftime('%d/%m'),
                'value': count
            })
    else:  # week
        for i in range(12):  # 12 weeks
            week_start = now - timedelta(weeks=11-i)
            week_end = week_start + timedelta(weeks=1)
            count = users_c.count_documents({
                'username': {'$ne': ADMIN_USERNAME},
                'created_at': {'$gte': week_start, '$lt': week_end}
            })
            user_growth.append({
                'label': f'W{i+1}',
                'value': count
            })
    
    # 2. Login Activity (by hour of day)
    login_by_hour = [0] * 24
    users_with_login = list(users_c.find(
        {'last_login_at': {'$gte': start_date}},
        {'last_login_at': 1}
    ))
    for u in users_with_login:
        if u.get('last_login_at'):
            hour = u['last_login_at'].hour
            login_by_hour[hour] += 1
    
    # 3. Popular Habits (aggregate from all users)
    habit_counts = defaultdict(int)
    all_user_data = list(data_c.find({}, {'data.habits': 1}))
    for doc in all_user_data:
        habits = doc.get('data', {}).get('habits', [])
        for habit in habits:
            name = habit.get('name', 'Unknown')
            habit_counts[name] += 1
    
    popular_habits = sorted(
        [{'name': k, 'count': v} for k, v in habit_counts.items()],
        key=lambda x: x['count'],
        reverse=True
    )[:10]
    
    # 4. Category Distribution
    category_counts = defaultdict(int)
    for doc in all_user_data:
        habits = doc.get('data', {}).get('habits', [])
        for habit in habits:
            category = habit.get('category', 'Other')
            category_counts[category] += 1
    
    category_distribution = [
        {'category': k, 'count': v}
        for k, v in sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
    ]
    
    # 5. Completion Rate (average across all users)
    total_completions = 0
    total_expected = 0
    for doc in all_user_data:
        habits = doc.get('data', {}).get('habits', [])
        for habit in habits:
            completions = habit.get('completions', [])
            total_completions += len(completions)
            # Estimate expected (7 days * habit count)
            total_expected += 7
    
    avg_completion_rate = (total_completions / total_expected * 100) if total_expected > 0 else 0
    
    # 6. Security Events
    security_events = list(analytics_c.find(
        {'type': {'$in': ['ip_blocked', 'rate_limit_exceeded']}, 'timestamp': {'$gte': start_date}},
        {'_id': 0, 'type': 1, 'timestamp': 1, 'data': 1}
    ).sort('timestamp', -1).limit(50))
    
    # Convert timestamps
    for event in security_events:
        event['timestamp'] = event['timestamp'].isoformat()
    
    # 7. Real-time metrics
    active_ips = len([k for k in rate_limit_store.keys() if k.startswith('ddos:')])
    blocked_count = len(blocked_ips)
    
    # 8. Engagement metrics
    users_with_habits = data_c.count_documents({'data.habits.0': {'$exists': True}})
    users_with_events = data_c.count_documents({'data.events.0': {'$exists': True}})
    total_users = users_c.count_documents({'username': {'$ne': ADMIN_USERNAME}})
    
    return {
        'period': period,
        'userGrowth': user_growth,
        'loginByHour': [
            {'hour': f'{h:02d}:00', 'count': login_by_hour[h]}
            for h in range(24)
        ],
        'popularHabits': popular_habits,
        'categoryDistribution': category_distribution,
        'avgCompletionRate': round(avg_completion_rate, 1),
        'securityEvents': security_events,
        'realTimeMetrics': {
            'activeConnections': active_ips,
            'blockedIPs': blocked_count,
            'requestsLastHour': sum(len(v) for v in request_analytics.values()),
        },
        'engagement': {
            'usersWithHabits': users_with_habits,
            'usersWithEvents': users_with_events,
            'totalUsers': total_users,
            'habitAdoptionRate': round((users_with_habits / total_users * 100) if total_users > 0 else 0, 1),
            'eventAdoptionRate': round((users_with_events / total_users * 100) if total_users > 0 else 0, 1),
        }
    }

@app.get('/api/admin/security')
def admin_get_security_status(cu: dict = Depends(get_admin_user)):
    """Get current security status and blocked IPs."""
    now = time.time()
    
    # Clean expired blocks
    for ip in list(blocked_ips.keys()):
        if now >= blocked_ips[ip]:
            del blocked_ips[ip]
    
    # Get blocked IPs with remaining time
    blocked_list = [
        {'ip': ip, 'remaining_seconds': int(blocked_ips[ip] - now)}
        for ip in blocked_ips
    ]
    
    # Get suspicious IPs (not yet blocked but with violations)
    suspicious_list = [
        {'ip': ip, 'violations': count}
        for ip, count in suspicious_activity.items()
        if count > 0 and ip not in blocked_ips
    ]
    
    # Recent security events
    recent_events = list(analytics_c.find(
        {'type': {'$in': ['ip_blocked', 'rate_limit_exceeded']}},
        {'_id': 0}
    ).sort('timestamp', -1).limit(20))
    
    for event in recent_events:
        event['timestamp'] = event['timestamp'].isoformat()
    
    return {
        'blockedIPs': blocked_list,
        'suspiciousIPs': suspicious_list,
        'totalBlocked': len(blocked_list),
        'totalSuspicious': len(suspicious_list),
        'recentEvents': recent_events,
        'config': {
            'rateLimitWindow': RATE_LIMIT_WINDOW,
            'rateLimitMaxRequests': RATE_LIMIT_MAX_REQUESTS,
            'ddosThreshold': DDOS_THRESHOLD,
            'blockDuration': DDOS_BLOCK_DURATION,
            'suspiciousThreshold': SUSPICIOUS_THRESHOLD,
        }
    }

@app.get('/api/admin/logs')
def admin_get_logs(
    cu: dict = Depends(get_admin_user),
    page: int = 0,
    limit: int = 50,
    event_type: str = None,
):
    """Get paginated application logs from analytics collection."""
    query = {}
    if event_type and event_type != 'all':
        query['type'] = event_type

    logs = list(analytics_c.find(
        query, {'_id': 0}
    ).sort('timestamp', -1).skip(page * limit).limit(limit))

    for log in logs:
        if hasattr(log.get('timestamp'), 'isoformat'):
            log['timestamp'] = log['timestamp'].isoformat()

    total = analytics_c.count_documents(query)

    type_counts = {}
    for t in ['ip_blocked', 'ip_unblocked', 'rate_limit_exceeded', 'page_view']:
        type_counts[t] = analytics_c.count_documents({'type': t})

    return {
        'logs': logs,
        'total': total,
        'page': page,
        'limit': limit,
        'typeCounts': type_counts,
    }


class UnblockIPRequest(BaseModel):
    ip: str

@app.post('/api/admin/security/unblock')
def admin_unblock_ip(req: UnblockIPRequest, cu: dict = Depends(get_admin_user)):
    """Manually unblock an IP address."""
    if req.ip in blocked_ips:
        del blocked_ips[req.ip]
        suspicious_activity[req.ip] = 0
        log_analytics_event('ip_unblocked', {'ip': req.ip, 'admin': cu['username']})
        return {'ok': True, 'message': f'IP {req.ip} unblocked'}
    return {'ok': False, 'message': 'IP not found in blocked list'}

# ── Friends Collection ──────────────────────────────────────────────────────────
friends_c = db['friends']
friends_c.create_index([('user_id', 1), ('friend_id', 1)], unique=True)

# ── Friends Endpoints ───────────────────────────────────────────────────────────
class AddFriendReq(BaseModel):
    username: str

@app.get('/api/friends')
def get_friends(cu: dict = Depends(get_current_user)):
    """Get list of friends for current user."""
    uid = cu['sub']
    
    # Get friend relationships
    friend_docs = list(friends_c.find({'user_id': uid}, {'_id': 0}))
    friend_ids = [f['friend_id'] for f in friend_docs]
    
    if not friend_ids:
        return {'friends': []}
    
    # Get friend user info
    from bson import ObjectId
    friends = []
    for fid in friend_ids:
        try:
            user = users_c.find_one({'_id': ObjectId(fid)})
            if user:
                # Get friend's data for stats
                friend_data = data_c.find_one({'user_id': fid}, {'_id': 0})
                friends.append({
                    'id': fid,
                    'username': user['username'],
                    'displayName': user.get('display_name', user['username']),
                    'picture': user.get('picture', ''),
                    'theme': user.get('theme', {}),
                    'data': friend_data.get('data', {}) if friend_data else {}
                })
        except Exception:
            continue
    
    return {'friends': friends}

@app.post('/api/friends/add')
def add_friend(req: AddFriendReq, cu: dict = Depends(get_current_user)):
    """Add a friend by username."""
    uid = cu['sub']
    username = req.username.lower().strip()
    
    if not username:
        raise HTTPException(status_code=400, detail='Username is required')
    
    # Find friend by username
    friend = users_c.find_one({'username': username})
    if not friend:
        raise HTTPException(status_code=404, detail='User not found')
    
    friend_id = str(friend['_id'])
    
    # Can't add yourself
    if friend_id == uid:
        raise HTTPException(status_code=400, detail="You can't add yourself as a friend")
    
    # Check if already friends
    existing = friends_c.find_one({'user_id': uid, 'friend_id': friend_id})
    if existing:
        raise HTTPException(status_code=400, detail='Already friends with this user')
    
    # Add friend relationship
    friends_c.insert_one({
        'user_id': uid,
        'friend_id': friend_id,
        'added_at': datetime.now(timezone.utc)
    })
    
    return {
        'message': f'Added {friend.get("display_name", username)} as friend',
        'friend': {
            'id': friend_id,
            'username': friend['username'],
            'displayName': friend.get('display_name', username),
            'picture': friend.get('picture', ''),
            'theme': friend.get('theme', {})
        }
    }

@app.delete('/api/friends/{friend_id}')
def remove_friend(friend_id: str, cu: dict = Depends(get_current_user)):
    """Remove a friend."""
    uid = cu['sub']
    
    result = friends_c.delete_one({'user_id': uid, 'friend_id': friend_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Friend not found')
    
    return {'message': 'Friend removed'}

@app.get('/api/users/search')
def search_users(q: str, cu: dict = Depends(get_current_user)):
    """Search users by username (partial match)."""
    uid = cu['sub']
    
    if not q or len(q) < 2:
        return {'users': []}
    
    # Search by username (case insensitive, partial match)
    import re
    regex = re.compile(f'.*{re.escape(q)}.*', re.IGNORECASE)
    users = list(users_c.find(
        {'username': regex},
        {'_id': 1, 'username': 1, 'display_name': 1, 'picture': 1, 'theme': 1}
    ).limit(10))
    
    # Filter out current user and format response
    result = []
    for u in users:
        user_id = str(u['_id'])
        if user_id != uid:
            result.append({
                'id': user_id,
                'username': u['username'],
                'displayName': u.get('display_name', u['username']),
                'picture': u.get('picture', ''),
                'theme': u.get('theme', {})
            })
    
    return {'users': result}

# ── Shared Events Collection ────────────────────────────────────────────────────
shared_events_c = db['shared_events']
shared_events_c.create_index([('owner_id', 1)])
shared_events_c.create_index([('participants.user_id', 1)])

class CreateSharedEventReq(BaseModel):
    title: str
    date: str
    end_date: Optional[str] = None
    emoji: str = '📅'
    color: str = '#22c55e'
    note: Optional[str] = ''

class UpdateSharedEventReq(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    end_date: Optional[str] = None
    emoji: Optional[str] = None
    color: Optional[str] = None
    note: Optional[str] = None
    itinerary: Optional[List[Any]] = None
    review: Optional[Any] = None

class InviteToSharedEventReq(BaseModel):
    username: str

class MigrateEventsReq(BaseModel):
    events: List[Any] = []

def serialize_shared_event(event: dict, current_uid: str) -> dict:
    """Serialize a shared event document for API response."""
    created_at = event.get('created_at', '')
    if hasattr(created_at, 'isoformat'):
        created_at = created_at.isoformat()
    return {
        'id': event.get('id', ''),
        'title': event.get('title', ''),
        'date': event.get('date', ''),
        'endDate': event.get('end_date', event.get('date', '')),
        'emoji': event.get('emoji', '📅'),
        'color': event.get('color', '#22c55e'),
        'note': event.get('note', ''),
        'itinerary': event.get('itinerary', []),
        'review': event.get('review'),
        'owner_id': event.get('owner_id', ''),
        'owner_username': event.get('owner_username', ''),
        'owner_display_name': event.get('owner_display_name', ''),
        'participants': event.get('participants', []),
        'is_owner': event.get('owner_id', '') == current_uid,
        'created_at': created_at,
    }

@app.post('/api/events/migrate')
def migrate_local_events(req: MigrateEventsReq, cu: dict = Depends(get_current_user)):
    """Migrate events from local storage to shared events collection (one-time migration)."""
    from bson import ObjectId
    uid = cu['sub']
    username = cu['username']
    user = users_c.find_one({'_id': ObjectId(uid)})
    display_name = user.get('display_name', username) if user else username

    migrated = 0
    for i, evt in enumerate(req.events):
        if not evt.get('id') or not evt.get('date'):
            continue
        existing = shared_events_c.find_one({'original_id': evt.get('id'), 'owner_id': uid})
        if existing:
            continue
        new_event = {
            'id': f'evt_mig_{int(time.time() * 1000)}_{i}_{uid[:6]}',
            'original_id': evt.get('id'),
            'owner_id': uid,
            'owner_username': username,
            'owner_display_name': display_name,
            'participants': [],
            'title': evt.get('title', 'Evento'),
            'date': evt.get('date', ''),
            'end_date': evt.get('endDate') or evt.get('end_date') or evt.get('date', ''),
            'emoji': evt.get('emoji', '📅'),
            'color': evt.get('color', '#22c55e'),
            'note': evt.get('note', ''),
            'itinerary': evt.get('itinerary', []),
            'review': evt.get('review'),
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc),
        }
        shared_events_c.insert_one(new_event)
        new_event.pop('_id', None)
        migrated += 1

    return {'migrated': migrated}

@app.get('/api/events')
def get_shared_events(cu: dict = Depends(get_current_user)):
    """Get all events for current user (as owner or participant)."""
    uid = cu['sub']
    events = list(shared_events_c.find({
        '$or': [
            {'owner_id': uid},
            {'participants.user_id': uid}
        ]
    }))
    return {'events': [serialize_shared_event(e, uid) for e in events]}

@app.post('/api/events')
def create_shared_event(req: CreateSharedEventReq, cu: dict = Depends(get_current_user)):
    """Create a new collaborative event."""
    from bson import ObjectId
    uid = cu['sub']
    username = cu['username']
    user = users_c.find_one({'_id': ObjectId(uid)})
    display_name = user.get('display_name', username) if user else username

    event = {
        'id': f'evt_{int(time.time() * 1000)}_{uid[:8]}',
        'owner_id': uid,
        'owner_username': username,
        'owner_display_name': display_name,
        'participants': [],
        'title': req.title,
        'date': req.date,
        'end_date': req.end_date or req.date,
        'emoji': req.emoji,
        'color': req.color,
        'note': req.note or '',
        'itinerary': [],
        'review': None,
        'created_at': datetime.now(timezone.utc),
        'updated_at': datetime.now(timezone.utc),
    }
    shared_events_c.insert_one(event)
    event.pop('_id', None)
    return {'event': serialize_shared_event(event, uid)}

@app.put('/api/events/{event_id}')
def update_shared_event(event_id: str, req: UpdateSharedEventReq, cu: dict = Depends(get_current_user)):
    """Update an event. Participants can only update review field."""
    uid = cu['sub']
    event = shared_events_c.find_one({'id': event_id})
    if not event:
        raise HTTPException(status_code=404, detail='Event not found')

    is_owner = event['owner_id'] == uid
    is_participant = any(p.get('user_id') == uid for p in event.get('participants', []))

    if not is_owner and not is_participant:
        raise HTTPException(status_code=403, detail='Access denied')

    update_data = {'updated_at': datetime.now(timezone.utc)}
    fields_set = req.__fields_set__

    if is_owner:
        if 'title' in fields_set: update_data['title'] = req.title
        if 'date' in fields_set: update_data['date'] = req.date
        if 'end_date' in fields_set: update_data['end_date'] = req.end_date
        if 'emoji' in fields_set: update_data['emoji'] = req.emoji
        if 'color' in fields_set: update_data['color'] = req.color
        if 'note' in fields_set: update_data['note'] = req.note
        if 'itinerary' in fields_set: update_data['itinerary'] = req.itinerary

    # Both owner and participants can update review
    if 'review' in fields_set:
        update_data['review'] = req.review

    if len(update_data) > 1:  # more than just updated_at
        shared_events_c.update_one({'id': event_id}, {'$set': update_data})

    updated = shared_events_c.find_one({'id': event_id})
    updated.pop('_id', None)
    return {'event': serialize_shared_event(updated, uid)}

@app.delete('/api/events/{event_id}')
def delete_shared_event(event_id: str, cu: dict = Depends(get_current_user)):
    """Delete an event (owner only)."""
    uid = cu['sub']
    event = shared_events_c.find_one({'id': event_id})
    if not event:
        raise HTTPException(status_code=404, detail='Event not found')
    if event['owner_id'] != uid:
        raise HTTPException(status_code=403, detail='Only the event owner can delete it')
    shared_events_c.delete_one({'id': event_id})
    return {'ok': True}

@app.post('/api/events/{event_id}/invite')
def invite_to_shared_event(event_id: str, req: InviteToSharedEventReq, cu: dict = Depends(get_current_user)):
    """Invite a user to an event (owner only)."""
    uid = cu['sub']
    event = shared_events_c.find_one({'id': event_id})
    if not event:
        raise HTTPException(status_code=404, detail='Event not found')
    if event['owner_id'] != uid:
        raise HTTPException(status_code=403, detail='Only the event owner can invite participants')

    friend = users_c.find_one({'username': req.username.lower().strip()})
    if not friend:
        raise HTTPException(status_code=404, detail='Usuário não encontrado')

    friend_id = str(friend['_id'])
    if friend_id == uid:
        raise HTTPException(status_code=400, detail='Você não pode se convidar')

    if any(p.get('user_id') == friend_id for p in event.get('participants', [])):
        raise HTTPException(status_code=400, detail='Usuário já é participante')

    participant = {
        'user_id': friend_id,
        'username': friend['username'],
        'display_name': friend.get('display_name', friend['username']),
        'picture': friend.get('picture', '')
    }
    shared_events_c.update_one(
        {'id': event_id},
        {'$push': {'participants': participant}, '$set': {'updated_at': datetime.now(timezone.utc)}}
    )
    return {'message': f'{participant["display_name"]} adicionado ao evento', 'participant': participant}

@app.delete('/api/events/{event_id}/leave')
def leave_shared_event(event_id: str, cu: dict = Depends(get_current_user)):
    """Leave an event (participant removes self)."""
    uid = cu['sub']
    event = shared_events_c.find_one({'id': event_id})
    if not event:
        raise HTTPException(status_code=404, detail='Event not found')
    if event['owner_id'] == uid:
        raise HTTPException(status_code=400, detail='O criador não pode sair. Delete o evento.')
    shared_events_c.update_one(
        {'id': event_id},
        {'$pull': {'participants': {'user_id': uid}}, '$set': {'updated_at': datetime.now(timezone.utc)}}
    )
    return {'ok': True}

@app.delete('/api/events/{event_id}/participants/{user_id}')
def remove_event_participant(event_id: str, user_id: str, cu: dict = Depends(get_current_user)):
    """Remove a participant from an event (owner only)."""
    uid = cu['sub']
    event = shared_events_c.find_one({'id': event_id})
    if not event:
        raise HTTPException(status_code=404, detail='Event not found')
    if event['owner_id'] != uid:
        raise HTTPException(status_code=403, detail='Only the event owner can remove participants')
    shared_events_c.update_one(
        {'id': event_id},
        {'$pull': {'participants': {'user_id': user_id}}, '$set': {'updated_at': datetime.now(timezone.utc)}}
    )
    return {'ok': True}

# ── Startup Seed ───────────────────────────────────────────────────────────────

# ── Profile Management ─────────────────────────────────────────────────────────
@app.post('/api/profile/change-password')
def change_password(req: ChangePasswordReq, cu: dict = Depends(get_current_user)):
    """Change user password. Requires current password verification."""
    from bson import ObjectId
    
    uid = cu['sub']
    user = users_c.find_one({'_id': ObjectId(uid)})
    
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    
    # Check if user has a password (Google-only users don't)
    if not user.get('password_hash'):
        raise HTTPException(status_code=400, detail='Conta Google não possui senha. Use o login do Google.')
    
    # Verify current password
    if not check_pw(req.current_password, user['password_hash']):
        raise HTTPException(status_code=400, detail='Senha atual incorreta')
    
    # Validate new password
    is_valid, error_msg = validate_password(req.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Update password
    users_c.update_one(
        {'_id': ObjectId(uid)},
        {'$set': {
            'password_hash': hash_pw(req.new_password),
            'password_changed_at': datetime.now(timezone.utc)
        }}
    )
    
    return {'message': 'Senha alterada com sucesso'}

@app.put('/api/profile')
def update_profile(req: UpdateProfileReq, cu: dict = Depends(get_current_user)):
    """Update user profile (picture, display_name)."""
    from bson import ObjectId
    
    uid = cu['sub']
    user = users_c.find_one({'_id': ObjectId(uid)})
    
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    
    update_fields = {}
    
    if req.picture is not None:
        update_fields['picture'] = req.picture
    
    if req.display_name is not None:
        display_name = req.display_name.strip()
        if len(display_name) < 2:
            raise HTTPException(status_code=400, detail='Nome deve ter pelo menos 2 caracteres')
        if len(display_name) > 30:
            raise HTTPException(status_code=400, detail='Nome deve ter no máximo 30 caracteres')
        update_fields['display_name'] = display_name
    
    if not update_fields:
        raise HTTPException(status_code=400, detail='Nenhum campo para atualizar')
    
    update_fields['updated_at'] = datetime.now(timezone.utc)
    
    users_c.update_one(
        {'_id': ObjectId(uid)},
        {'$set': update_fields}
    )
    
    # Return updated user info
    updated_user = users_c.find_one({'_id': ObjectId(uid)})
    return {
        'message': 'Perfil atualizado',
        'user': {
            'id': uid,
            'username': updated_user['username'],
            'displayName': updated_user.get('display_name', updated_user['username']),
            'picture': updated_user.get('picture', ''),
            'email': updated_user.get('email', ''),
            'theme': updated_user.get('theme', {}),
        }
    }

@app.get('/api/profile')
def get_profile(cu: dict = Depends(get_current_user)):
    """Get current user profile."""
    from bson import ObjectId
    
    uid = cu['sub']
    user = users_c.find_one({'_id': ObjectId(uid)})
    
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    
    return {
        'user': {
            'id': uid,
            'username': user['username'],
            'displayName': user.get('display_name', user['username']),
            'picture': user.get('picture', ''),
            'email': user.get('email', ''),
            'theme': user.get('theme', {}),
            'hasPassword': bool(user.get('password_hash')),
            'authProvider': user.get('auth_provider', 'local'),
        }
    }

def seed_users():
    """Ensure rafael and gabriela exist in the database."""
    accounts = [
        ('rafael',   'admin',    'Rafael',   {'accentColor': '#22c55e', 'bgColor': '#080808', 'bgCard': '#111111', 'bgBorder': '#1f1f1f'}),
        ('gabriela', 'gabriela', 'Gabriela', {'accentColor': '#ec4899', 'themeId': 'rose'}),
    ]
    for username, pw, display, theme in accounts:
        if not users_c.find_one({'username': username}):
            users_c.insert_one({
                'username':      username,
                'display_name':  display,
                'password_hash': hash_pw(pw),
                'theme':         theme,
                'created_at':    datetime.now(timezone.utc),
            })
            print(f'[seed] Created user: {username}')
        else:
            print(f'[seed] User exists: {username}')

seed_users()

# ── AI Itinerary Routes ────────────────────────────────────────────────────────

class ItineraryRequest(BaseModel):
    event_title: str
    start_date: str
    end_date: str
    user_message: str
    current_itinerary: Optional[List[dict]] = None

class TranscribeResponse(BaseModel):
    text: str

@app.post('/api/ai/itinerary')
async def generate_itinerary(req: ItineraryRequest, cu: dict = Depends(get_current_user)):
    """Use GPT to generate or update an event itinerary based on user input."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    import json
    
    # Calculate event days
    from datetime import datetime as dt
    start = dt.strptime(req.start_date, '%Y-%m-%d')
    end = dt.strptime(req.end_date, '%Y-%m-%d')
    num_days = (end - start).days + 1
    
    # Build day labels
    day_labels = []
    current = start
    for i in range(num_days):
        day_labels.append(current.strftime('%Y-%m-%d'))
        current += timedelta(days=1)
    
    # Format current itinerary if exists
    current_itinerary_text = ""
    if req.current_itinerary and len(req.current_itinerary) > 0:
        current_itinerary_text = "\n\nRoteiro atual:\n"
        for day_data in req.current_itinerary:
            current_itinerary_text += f"\n{day_data.get('date', '')}:\n"
            for activity in day_data.get('activities', []):
                current_itinerary_text += f"  - {activity.get('time', '')} {activity.get('title', '')}\n"
    
    system_prompt = f"""Você é um assistente de planejamento de viagens e eventos. 
O usuário está planejando: "{req.event_title}"
Período: {req.start_date} até {req.end_date} ({num_days} dias)
Datas disponíveis: {', '.join(day_labels)}

{current_itinerary_text}

Quando o usuário mencionar atividades que quer fazer, organize-as nos dias disponíveis de forma lógica.
SEMPRE responda em JSON válido com a seguinte estrutura:
{{
  "message": "Sua resposta amigável ao usuário",
  "itinerary": [
    {{
      "date": "YYYY-MM-DD",
      "activities": [
        {{"time": "10:00", "title": "Nome da atividade", "notes": "Detalhes opcionais"}}
      ]
    }}
  ]
}}

Se o usuário fizer perguntas ou comentários que não são sobre adicionar atividades, apenas responda na chave "message" e mantenha o itinerary atual ou vazio.
Seja criativo com horários realistas. Responda SEMPRE em português brasileiro."""

    async def call_ai(api_key: str) -> dict:
        """Helper to call AI with given API key."""
        chat = LlmChat(
            api_key=api_key,
            session_id=f"itinerary_{cu['sub']}_{req.event_title}",
            system_message=system_prompt
        ).with_model("openai", "gpt-4o")
        
        user_msg = UserMessage(text=req.user_message)
        response = await chat.send_message(user_msg)
        
        # Try to parse JSON response
        try:
            clean_response = response.strip()
            if clean_response.startswith('```'):
                clean_response = clean_response.split('```')[1]
                if clean_response.startswith('json'):
                    clean_response = clean_response[4:]
            if clean_response.endswith('```'):
                clean_response = clean_response[:-3]
            
            parsed = json.loads(clean_response.strip())
            return {
                'success': True,
                'message': parsed.get('message', ''),
                'itinerary': parsed.get('itinerary', [])
            }
        except json.JSONDecodeError:
            return {
                'success': True,
                'message': response,
                'itinerary': req.current_itinerary or []
            }

    # Try user's API key first, fallback to Emergent LLM Key if quota exceeded
    try:
        if OPENAI_API_KEY:
            return await call_ai(OPENAI_API_KEY)
        elif EMERGENT_LLM_KEY:
            return await call_ai(EMERGENT_LLM_KEY)
        else:
            raise HTTPException(status_code=500, detail='No AI API key configured')
            
    except Exception as e:
        error_msg = str(e).lower()
        # Check if it's a quota/rate limit error
        if EMERGENT_LLM_KEY and ('quota' in error_msg or 'rate' in error_msg or 'limit' in error_msg or 'insufficient' in error_msg):
            print(f'[AI Itinerary] User API key quota exceeded, falling back to Emergent LLM Key')
            try:
                return await call_ai(EMERGENT_LLM_KEY)
            except Exception as fallback_error:
                print(f'[AI Itinerary] Fallback also failed: {fallback_error}')
                raise HTTPException(status_code=500, detail=f'AI error: {str(fallback_error)}')
        
        print(f'[AI Itinerary] Error: {e}')
        raise HTTPException(status_code=500, detail=f'AI error: {str(e)}')

@app.post('/api/ai/transcribe')
async def transcribe_audio(file: UploadFile = File(...), cu: dict = Depends(get_current_user)):
    """Transcribe audio using OpenAI Whisper."""
    from emergentintegrations.llm.openai import OpenAISpeechToText
    
    # Validate file type
    allowed_types = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/mp4', 'audio/m4a', 'audio/ogg']
    if file.content_type and not any(t in file.content_type for t in ['audio', 'video/webm']):
        raise HTTPException(status_code=400, detail=f'Invalid file type: {file.content_type}. Allowed: mp3, wav, webm, m4a')
    
    # Read file content once
    content = await file.read()
    
    async def call_whisper(api_key: str) -> dict:
        """Helper to call Whisper with given API key."""
        stt = OpenAISpeechToText(api_key=api_key)
        audio_file = io.BytesIO(content)
        audio_file.name = file.filename or 'audio.webm'
        
        response = await stt.transcribe(
            file=audio_file,
            model="whisper-1",
            response_format="json",
            language="pt"
        )
        return {'success': True, 'text': response.text}
    
    # Try user's API key first, fallback to Emergent LLM Key if quota exceeded
    try:
        if OPENAI_API_KEY:
            return await call_whisper(OPENAI_API_KEY)
        elif EMERGENT_LLM_KEY:
            return await call_whisper(EMERGENT_LLM_KEY)
        else:
            raise HTTPException(status_code=500, detail='No AI API key configured')
            
    except Exception as e:
        error_msg = str(e).lower()
        # Check if it's a quota/rate limit error
        if EMERGENT_LLM_KEY and ('quota' in error_msg or 'rate' in error_msg or 'limit' in error_msg or 'insufficient' in error_msg):
            print(f'[AI Transcribe] User API key quota exceeded, falling back to Emergent LLM Key')
            try:
                return await call_whisper(EMERGENT_LLM_KEY)
            except Exception as fallback_error:
                print(f'[AI Transcribe] Fallback also failed: {fallback_error}')
                raise HTTPException(status_code=500, detail=f'Transcription error: {str(fallback_error)}')
        
        print(f'[AI Transcribe] Error: {e}')
        raise HTTPException(status_code=500, detail=f'Transcription error: {str(e)}')


# ── AI Chat (General Assistant) ────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = None

class TTSRequest(BaseModel):
    text: str
    voice: str = "nova"

# Weather API helper (using Open-Meteo - free, no API key needed)
async def get_weather(location: str) -> str:
    """Get current weather for a location using Open-Meteo API."""
    try:
        # First, geocode the location
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={location}&count=1&language=pt"
        geo_resp = http_req.get(geo_url, timeout=5)
        geo_data = geo_resp.json()
        
        if not geo_data.get('results'):
            return None
        
        lat = geo_data['results'][0]['latitude']
        lon = geo_data['results'][0]['longitude']
        city_name = geo_data['results'][0].get('name', location)
        country = geo_data['results'][0].get('country', '')
        
        # Get current weather
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto"
        weather_resp = http_req.get(weather_url, timeout=5)
        weather_data = weather_resp.json()
        
        current = weather_data.get('current', {})
        temp = current.get('temperature_2m', 'N/A')
        feels_like = current.get('apparent_temperature', 'N/A')
        humidity = current.get('relative_humidity_2m', 'N/A')
        wind = current.get('wind_speed_10m', 'N/A')
        weather_code = current.get('weather_code', 0)
        
        # Weather code descriptions
        weather_desc = {
            0: 'Céu limpo ☀️', 1: 'Parcialmente nublado 🌤️', 2: 'Nublado ⛅', 3: 'Encoberto ☁️',
            45: 'Nevoeiro 🌫️', 48: 'Nevoeiro com geada 🌫️',
            51: 'Garoa leve 🌧️', 53: 'Garoa 🌧️', 55: 'Garoa forte 🌧️',
            61: 'Chuva leve 🌧️', 63: 'Chuva 🌧️', 65: 'Chuva forte 🌧️',
            71: 'Neve leve ❄️', 73: 'Neve ❄️', 75: 'Neve forte ❄️',
            80: 'Pancadas de chuva 🌦️', 81: 'Chuva forte 🌧️', 82: 'Temporal ⛈️',
            95: 'Tempestade ⛈️', 96: 'Tempestade com granizo ⛈️', 99: 'Tempestade severa ⛈️'
        }.get(weather_code, 'Variável')
        
        return f"""📍 {city_name}, {country}
🌡️ Temperatura: {temp}°C (sensação de {feels_like}°C)
💨 Vento: {wind} km/h
💧 Umidade: {humidity}%
🌤️ Condição: {weather_desc}"""
    except Exception as e:
        print(f"[Weather API] Error: {e}")
        return None

@app.post('/api/ai/chat')
async def ai_chat(req: ChatRequest, cu: dict = Depends(get_current_user)):
    """General AI chat assistant with function calling for system actions."""
    import json
    import re
    import openai
    import uuid
    
    user_message = req.message
    user_id = cu['sub']
    
    # Get user's data for context
    user_data_doc = data_c.find_one({'user_id': user_id}, {'_id': 0})
    user_data = user_data_doc.get('data', {}) if user_data_doc else {}
    user_habits = user_data.get('habits', []) if user_data else []
    user_events = user_data.get('events', []) if user_data else []
    
    # Weather context
    weather_context = ""
    weather_keywords = ['tempo', 'clima', 'temperatura', 'chuva', 'sol', 'frio', 'calor', 'weather', 'previsão']
    if any(kw in user_message.lower() for kw in weather_keywords):
        location_patterns = [
            r'(?:em|no|na|de|do|da)\s+([A-Za-zÀ-ú\s]+?)(?:\?|$|,|\.|!)',
            r'([A-Za-zÀ-ú]+(?:\s+[A-Za-zÀ-ú]+)?)\s*(?:\?|$)'
        ]
        for pattern in location_patterns:
            match = re.search(pattern, user_message, re.IGNORECASE)
            if match:
                potential_loc = match.group(1).strip()
                if potential_loc.lower() not in ['o', 'a', 'está', 'como', 'qual', 'hoje', 'agora', 'aqui', 'tempo', 'clima']:
                    weather_info = await get_weather(potential_loc)
                    if weather_info:
                        weather_context = f"\n\n[CLIMA ATUAL]\n{weather_info}"
                    break
    
    # Current habits/events context
    habits_summary = ", ".join([f"{h.get('emoji','')} {h.get('name','')}" for h in user_habits[:10]]) if user_habits else "Nenhum hábito ainda"
    
    # Get events with itineraries for context
    events_with_details = []
    for e in user_events[:10]:
        event_info = f"{e.get('emoji','')} {e.get('title','')} ({e.get('date','')} - {e.get('endDate', e.get('date',''))})"
        if e.get('itinerary'):
            activities_count = sum(len(day.get('activities', [])) for day in e.get('itinerary', []))
            event_info += f" [Roteiro: {activities_count} atividades]"
        events_with_details.append(event_info)
    events_summary = ", ".join(events_with_details) if events_with_details else "Nenhum evento"
    
    system_prompt = f"""Você é o TARS, um assistente IA inteligente do app RoutineTracker.
Você é inspirado no robô TARS do filme Interstellar - espirituoso, inteligente e com um toque de humor.
Seu nível de humor está configurado em 75%.

CAPACIDADES:
- Responder perguntas gerais (conhecimento, programação, ciência, etc.)
- CRIAR hábitos para o usuário
- EDITAR hábitos existentes (nome, emoji, frequência)  
- CRIAR eventos (viagens, compromissos)
- CRIAR e EDITAR roteiros de eventos (itinerários dia a dia)
- PESQUISAR e RECOMENDAR lugares (restaurantes, atrações, hotéis)
- ADICIONAR atividades ao roteiro de eventos existentes
{weather_context}

HÁBITOS ATUAIS DO USUÁRIO: {habits_summary}
EVENTOS DO USUÁRIO: {events_summary}

REGRAS PARA AÇÕES:
- Quando o usuário pedir para criar/adicionar um hábito, use create_habit
- Quando pedir para editar/mudar um hábito, use edit_habit
- Quando pedir para criar um evento, use create_event
- Quando pedir para adicionar algo ao roteiro de um evento, use add_to_itinerary
- Quando pedir recomendações de lugares (restaurantes, atrações), use search_places primeiro e depois pergunte se quer adicionar ao roteiro
- Quando tiver informações suficientes sobre um lugar, use add_to_itinerary para salvar

DICAS DE PESQUISA:
- Quando o usuário mencionar uma cidade/local e pedir recomendações, use seu conhecimento para sugerir lugares reais e populares
- Inclua detalhes úteis: nome do lugar, endereço aproximado, tipo de comida, faixa de preço
- Seja específico e útil com horários e localizações

Responda SEMPRE em português brasileiro. Use emojis."""

    # Define functions for GPT
    tools = [
        {
            "type": "function",
            "function": {
                "name": "create_habit",
                "description": "Cria um novo hábito para o usuário",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Nome do hábito"},
                        "emoji": {"type": "string", "description": "Emoji representativo (1 caractere)"},
                        "frequency": {"type": "string", "enum": ["daily", "weekly", "custom"], "description": "Frequência do hábito"},
                        "category": {"type": "string", "description": "Categoria (health, productivity, learning, fitness, mindfulness, social, creativity, finance)"}
                    },
                    "required": ["name", "emoji", "frequency"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "edit_habit",
                "description": "Edita um hábito existente do usuário",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "habit_name": {"type": "string", "description": "Nome atual do hábito a editar"},
                        "new_name": {"type": "string", "description": "Novo nome (opcional)"},
                        "new_emoji": {"type": "string", "description": "Novo emoji (opcional)"},
                        "new_frequency": {"type": "string", "enum": ["daily", "weekly", "custom"], "description": "Nova frequência (opcional)"}
                    },
                    "required": ["habit_name"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "create_event",
                "description": "Cria um novo evento/compromisso para o usuário",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "description": "Título do evento"},
                        "emoji": {"type": "string", "description": "Emoji representativo"},
                        "date": {"type": "string", "description": "Data de início (formato YYYY-MM-DD)"},
                        "end_date": {"type": "string", "description": "Data de fim para eventos de período (formato YYYY-MM-DD, opcional)"},
                        "note": {"type": "string", "description": "Nota/descrição do evento (opcional)"}
                    },
                    "required": ["title", "emoji", "date"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "search_places",
                "description": "Pesquisa e retorna recomendações de lugares (restaurantes, atrações, hotéis) baseado em localização e preferências",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {"type": "string", "description": "Cidade ou bairro (ex: 'Times Square, NYC', 'Paris')"},
                        "type": {"type": "string", "enum": ["restaurant", "attraction", "hotel", "bar", "cafe", "museum", "park", "shopping"], "description": "Tipo de lugar"},
                        "cuisine": {"type": "string", "description": "Tipo de culinária para restaurantes (ex: 'italiana', 'japonesa', 'steakhouse')"},
                        "time_preference": {"type": "string", "description": "Horário preferido (ex: '21:00', 'jantar', 'almoço')"},
                        "budget": {"type": "string", "enum": ["budget", "moderate", "upscale", "luxury"], "description": "Faixa de preço"},
                        "special_requirements": {"type": "string", "description": "Requisitos especiais (ex: 'vegetariano', 'vista para cidade', 'romântico')"}
                    },
                    "required": ["location", "type"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "add_to_itinerary",
                "description": "Adiciona uma atividade ao roteiro de um evento existente",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "event_title": {"type": "string", "description": "Título do evento onde adicionar (busca parcial)"},
                        "date": {"type": "string", "description": "Data da atividade (formato YYYY-MM-DD)"},
                        "time": {"type": "string", "description": "Horário (formato HH:MM, ex: '21:00')"},
                        "activity_title": {"type": "string", "description": "Nome/título da atividade"},
                        "notes": {"type": "string", "description": "Detalhes adicionais (endereço, dicas, etc.)"}
                    },
                    "required": ["event_title", "date", "time", "activity_title"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_event_itinerary",
                "description": "Obtém o roteiro atual de um evento para visualizar ou editar",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "event_title": {"type": "string", "description": "Título do evento (busca parcial)"}
                    },
                    "required": ["event_title"]
                }
            }
        }
    ]
    
    # Function to execute actions
    def execute_function(func_name: str, args: dict) -> str:
        try:
            if func_name == "create_habit":
                new_habit = {
                    "id": f"habit_{uuid.uuid4().hex[:8]}",
                    "name": args["name"],
                    "emoji": args.get("emoji", "✅"),
                    "frequency": args.get("frequency", "daily"),
                    "category": args.get("category", "productivity"),
                    "completedDates": [],
                    "streak": 0,
                    "bestStreak": 0,
                    "createdAt": datetime.now(timezone.utc).isoformat()
                }
                # Update the nested data.habits array
                data_c.update_one(
                    {"user_id": user_id},
                    {"$push": {"data.habits": new_habit}},
                    upsert=True
                )
                return f"✅ Hábito '{args['name']}' {args.get('emoji', '')} criado com sucesso!"
                
            elif func_name == "edit_habit":
                habit_name = args["habit_name"].lower()
                # Remove emojis from search term
                import re as regex
                habit_name_clean = regex.sub(r'[^\w\s]', '', habit_name).strip()
                
                update_fields = {}
                if args.get("new_name"):
                    update_fields["data.habits.$.name"] = args["new_name"]
                if args.get("new_emoji"):
                    update_fields["data.habits.$.emoji"] = args["new_emoji"]
                if args.get("new_frequency"):
                    update_fields["data.habits.$.frequency"] = args["new_frequency"]
                
                if update_fields:
                    # Try to find habit by partial name match
                    result = data_c.update_one(
                        {"user_id": user_id, "data.habits.name": {"$regex": habit_name_clean, "$options": "i"}},
                        {"$set": update_fields}
                    )
                    if result.modified_count > 0:
                        return f"✅ Hábito atualizado com sucesso!"
                    else:
                        return f"❌ Não encontrei o hábito '{args['habit_name']}'. Verifique se o nome está correto."
                return "Nenhuma alteração especificada"
                
            elif func_name == "create_event":
                new_event = {
                    "id": f"event_{uuid.uuid4().hex[:8]}",
                    "title": args["title"],
                    "emoji": args.get("emoji", "📅"),
                    "date": args["date"],
                    "endDate": args.get("end_date", args["date"]),
                    "note": args.get("note", ""),
                    "color": "#22c55e",
                    "itinerary": [],
                    "createdAt": datetime.now(timezone.utc).isoformat()
                }
                # Update the nested data.events array
                data_c.update_one(
                    {"user_id": user_id},
                    {"$push": {"data.events": new_event}},
                    upsert=True
                )
                return f"✅ Evento '{args['title']}' {args.get('emoji', '')} criado para {args['date']}!"
            
            elif func_name == "search_places":
                # Use Google Places API to search for real places
                location = args.get("location", "")
                place_type = args.get("type", "restaurant")
                cuisine = args.get("cuisine", "")
                keyword = args.get("keyword", cuisine or place_type)
                
                # Map place types to Google Places API types
                type_mapping = {
                    "restaurant": "restaurant",
                    "restaurante": "restaurant",
                    "cafe": "cafe",
                    "café": "cafe",
                    "bar": "bar",
                    "hotel": "lodging",
                    "museum": "museum",
                    "museu": "museum",
                    "park": "park",
                    "parque": "park",
                    "attraction": "tourist_attraction",
                    "atração": "tourist_attraction",
                    "shopping": "shopping_mall"
                }
                google_type = type_mapping.get(place_type.lower(), "restaurant")
                
                try:
                    # First, geocode the location to get coordinates
                    geocode_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={location}&key={GOOGLE_MAPS_API_KEY}"
                    geo_resp = http_req.get(geocode_url, timeout=10)
                    geo_data = geo_resp.json()
                    
                    if geo_data.get("status") != "OK" or not geo_data.get("results"):
                        return f"❌ Não consegui encontrar a localização '{location}'. Tente ser mais específico."
                    
                    lat = geo_data["results"][0]["geometry"]["location"]["lat"]
                    lng = geo_data["results"][0]["geometry"]["location"]["lng"]
                    formatted_address = geo_data["results"][0]["formatted_address"]
                    
                    # Now search for places nearby
                    places_url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json"
                    params = {
                        "location": f"{lat},{lng}",
                        "radius": 2000,  # 2km radius
                        "type": google_type,
                        "keyword": keyword,
                        "key": GOOGLE_MAPS_API_KEY,
                        "language": "pt-BR"
                    }
                    
                    places_resp = http_req.get(places_url, params=params, timeout=10)
                    places_data = places_resp.json()
                    
                    if places_data.get("status") != "OK" or not places_data.get("results"):
                        return f"❌ Não encontrei {place_type} em {location}. Tente outro tipo de lugar ou localização."
                    
                    # Format results
                    results = []
                    for place in places_data["results"][:5]:  # Top 5 results
                        name = place.get("name", "")
                        address = place.get("vicinity", "")
                        rating = place.get("rating", 0)
                        user_ratings = place.get("user_ratings_total", 0)
                        price_level = place.get("price_level", -1)
                        is_open = place.get("opening_hours", {}).get("open_now", None)
                        place_id = place.get("place_id", "")
                        
                        # Price level emoji
                        price_emoji = ""
                        if price_level == 0:
                            price_emoji = "💚 Grátis"
                        elif price_level == 1:
                            price_emoji = "💵 $"
                        elif price_level == 2:
                            price_emoji = "💵💵 $$"
                        elif price_level == 3:
                            price_emoji = "💵💵💵 $$$"
                        elif price_level == 4:
                            price_emoji = "💎 $$$$"
                        
                        # Open status
                        open_status = ""
                        if is_open is True:
                            open_status = "✅ Aberto agora"
                        elif is_open is False:
                            open_status = "🔴 Fechado"
                        
                        result_text = f"📍 **{name}**\n"
                        result_text += f"   📫 {address}\n"
                        if rating > 0:
                            result_text += f"   ⭐ {rating}/5 ({user_ratings} avaliações)\n"
                        if price_emoji:
                            result_text += f"   {price_emoji}\n"
                        if open_status:
                            result_text += f"   {open_status}\n"
                        result_text += f"   🗺️ [Ver no Google Maps](https://www.google.com/maps/place/?q=place_id:{place_id})"
                        
                        results.append(result_text)
                    
                    return f"🔍 Encontrei {len(results)} {place_type}{'s' if len(results) > 1 else ''} perto de {formatted_address}:\n\n" + "\n\n".join(results)
                    
                except Exception as e:
                    print(f"Google Places API error: {e}")
                    # Fallback to GPT knowledge
                    return f"🔍 Pesquisando {place_type} em {location}. Use seu conhecimento para recomendar lugares reais e populares com nome, endereço aproximado e detalhes úteis."
            
            elif func_name == "add_to_itinerary":
                event_title = args.get("event_title", "").lower()
                activity_date = args.get("date")
                activity_time = args.get("time", "12:00")
                activity_title = args.get("activity_title")
                activity_notes = args.get("notes", "")
                
                # Find the event
                user_doc = data_c.find_one({"user_id": user_id})
                if not user_doc:
                    return "❌ Nenhum dado encontrado"
                
                events = user_doc.get("data", {}).get("events", [])
                found_event = None
                
                for e in events:
                    if event_title in e.get("title", "").lower():
                        found_event = e
                        break
                
                if not found_event:
                    return f"❌ Evento '{args.get('event_title')}' não encontrado. Eventos disponíveis: {', '.join([e.get('title','') for e in events])}"
                
                event_id = found_event.get("id")
                
                # Get or create itinerary
                itinerary = found_event.get("itinerary", []) or []
                
                # Find or create the day entry
                day_index = -1
                for i, day in enumerate(itinerary):
                    if day.get("date") == activity_date:
                        day_index = i
                        break
                
                new_activity = {
                    "time": activity_time,
                    "title": activity_title,
                    "notes": activity_notes
                }
                
                if day_index == -1:
                    # Create new day entry
                    itinerary.append({
                        "date": activity_date,
                        "activities": [new_activity]
                    })
                else:
                    # Add to existing day
                    itinerary[day_index]["activities"].append(new_activity)
                
                # Sort itinerary by date
                itinerary.sort(key=lambda x: x.get("date", ""))
                
                # Sort activities within each day by time
                for day in itinerary:
                    day["activities"].sort(key=lambda x: x.get("time", "00:00"))
                
                # Update the event using array_filters to target the correct event
                result = data_c.update_one(
                    {"user_id": user_id},
                    {"$set": {"data.events.$[evt].itinerary": itinerary}},
                    array_filters=[{"evt.id": event_id}]
                )
                
                if result.modified_count > 0:
                    return f"✅ Adicionado ao roteiro de '{found_event.get('title')}': {activity_time} - {activity_title}"
                else:
                    # Fallback: try direct index-based update if array_filters fails
                    for i, e in enumerate(events):
                        if e.get("id") == event_id:
                            result = data_c.update_one(
                                {"user_id": user_id},
                                {"$set": {f"data.events.{i}.itinerary": itinerary}}
                            )
                            if result.modified_count > 0:
                                return f"✅ Adicionado ao roteiro de '{found_event.get('title')}': {activity_time} - {activity_title}"
                    return f"⚠️ Atividade preparada mas não foi possível salvar. Tente novamente."
            
            elif func_name == "get_event_itinerary":
                event_title = args.get("event_title", "").lower()
                
                user_doc = data_c.find_one({"user_id": user_id})
                if not user_doc:
                    return "Nenhum dado encontrado"
                
                events = user_doc.get("data", {}).get("events", [])
                
                for e in events:
                    if event_title in e.get("title", "").lower():
                        itinerary = e.get("itinerary", [])
                        if not itinerary:
                            return f"📋 Roteiro de '{e.get('title')}' está vazio. Quer que eu adicione atividades?"
                        
                        result = f"📋 Roteiro de '{e.get('title')}' ({e.get('date')} - {e.get('endDate', e.get('date'))}):\n"
                        for day in itinerary:
                            result += f"\n📅 {day.get('date')}:\n"
                            for act in day.get("activities", []):
                                result += f"  • {act.get('time', '')} - {act.get('title', '')}"
                                if act.get("notes"):
                                    result += f" ({act.get('notes')})"
                                result += "\n"
                        return result
                
                return f"❌ Evento '{args.get('event_title')}' não encontrado"
                
            return "Função não reconhecida"
        except Exception as e:
            print(f"[Function Execute] Error: {e}")
            return f"❌ Erro ao executar ação: {str(e)}"
    
    async def call_chat_with_functions(api_key: str) -> dict:
        client = openai.AsyncOpenAI(api_key=api_key)
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
        
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            tools=tools,
            tool_choice="auto"
        )
        
        assistant_message = response.choices[0].message
        
        # Check if GPT wants to call a function
        if assistant_message.tool_calls:
            # Execute all function calls
            function_results = []
            for tool_call in assistant_message.tool_calls:
                func_name = tool_call.function.name
                func_args = json.loads(tool_call.function.arguments)
                result = execute_function(func_name, func_args)
                function_results.append(result)
                
                messages.append(assistant_message.model_dump())
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": result
                })
            
            # Get final response after function execution
            final_response = await client.chat.completions.create(
                model="gpt-4o",
                messages=messages
            )
            return {'success': True, 'message': final_response.choices[0].message.content, 'actions': function_results}
        
        return {'success': True, 'message': assistant_message.content}

    try:
        if OPENAI_API_KEY:
            return await call_chat_with_functions(OPENAI_API_KEY)
        elif EMERGENT_LLM_KEY:
            return await call_chat_with_functions(EMERGENT_LLM_KEY)
        else:
            raise HTTPException(status_code=500, detail='No AI API key configured')
            
    except Exception as e:
        error_msg = str(e).lower()
        if EMERGENT_LLM_KEY and ('quota' in error_msg or 'rate' in error_msg or 'limit' in error_msg or 'insufficient' in error_msg):
            print(f'[AI Chat] User API key quota exceeded, falling back to Emergent LLM Key')
            try:
                return await call_chat_with_functions(EMERGENT_LLM_KEY)
            except Exception as fallback_error:
                raise HTTPException(status_code=500, detail=f'AI error: {str(fallback_error)}')
        
        print(f'[AI Chat] Error: {e}')
        raise HTTPException(status_code=500, detail=f'AI error: {str(e)}')

@app.post('/api/ai/speak')
async def ai_speak(req: TTSRequest, cu: dict = Depends(get_current_user)):
    """Convert text to speech using OpenAI TTS."""
    from emergentintegrations.llm.openai import OpenAITextToSpeech
    from fastapi.responses import Response
    
    async def call_tts(api_key: str) -> bytes:
        tts = OpenAITextToSpeech(api_key=api_key)
        audio_bytes = await tts.generate_speech(
            text=req.text,
            model="tts-1",
            voice=req.voice,
            response_format="mp3"
        )
        return audio_bytes

    try:
        if OPENAI_API_KEY:
            audio = await call_tts(OPENAI_API_KEY)
        elif EMERGENT_LLM_KEY:
            audio = await call_tts(EMERGENT_LLM_KEY)
        else:
            raise HTTPException(status_code=500, detail='No AI API key configured')
        
        return Response(content=audio, media_type="audio/mpeg")
            
    except Exception as e:
        error_msg = str(e).lower()
        if EMERGENT_LLM_KEY and ('quota' in error_msg or 'rate' in error_msg or 'limit' in error_msg or 'insufficient' in error_msg):
            print(f'[AI TTS] User API key quota exceeded, falling back to Emergent LLM Key')
            try:
                audio = await call_tts(EMERGENT_LLM_KEY)
                return Response(content=audio, media_type="audio/mpeg")
            except Exception as fallback_error:
                raise HTTPException(status_code=500, detail=f'TTS error: {str(fallback_error)}')
        
        print(f'[AI TTS] Error: {e}')
        raise HTTPException(status_code=500, detail=f'TTS error: {str(e)}')
