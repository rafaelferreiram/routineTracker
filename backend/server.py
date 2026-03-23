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

load_dotenv()

# ── Config ─────────────────────────────────────────────────────────────────────
MONGO_URL  = os.environ.get('MONGO_URL')
DB_NAME    = os.environ.get('DB_NAME')
JWT_SECRET = os.environ.get('JWT_SECRET', 'change_this_in_production_' + os.urandom(16).hex())
JWT_ALG    = 'HS256'
JWT_DAYS   = 90
# Use user's OpenAI key or fallback to Emergent LLM Key
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', 'sk-emergent-46676Cb71D8D39eA36')
# Google Maps API Key
GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY', 'AIzaSyDLQT29DB2Lt7yxkCTzEG5LCYk4V8zOB14')

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

# Simple in-memory rate limiter
rate_limit_store = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 30  # max requests per window for auth endpoints

def check_rate_limit(ip: str, endpoint: str = 'default', max_requests: int = RATE_LIMIT_MAX_REQUESTS):
    """Simple rate limiting by IP address."""
    key = f"{ip}:{endpoint}"
    now = time.time()
    
    # Clean old entries
    rate_limit_store[key] = [t for t in rate_limit_store[key] if now - t < RATE_LIMIT_WINDOW]
    
    if len(rate_limit_store[key]) >= max_requests:
        raise HTTPException(status_code=429, detail='Too many requests. Please try again later.')
    
    rate_limit_store[key].append(now)

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

@app.post('/api/auth/login')
def login(req: AuthReq, request: Request):
    # Rate limit login attempts
    client_ip = request.client.host if request.client else 'unknown'
    check_rate_limit(client_ip, 'login', max_requests=10)  # 10 attempts per minute
    
    username = sanitize_string(req.username.lower(), 50)
    user = users_c.find_one({'username': username})
    if not user:
        raise HTTPException(status_code=400, detail='User not found')
    if not check_pw(req.password, user['password_hash']):
        raise HTTPException(status_code=400, detail='Wrong password')
    token = make_token(str(user['_id']), user['username'])
    return {
        'token': token,
        'user': {
            'id': str(user['_id']),
            'username': user['username'],
            'displayName': user['display_name'],
            'email': user.get('email', ''),
            'picture': user.get('picture', ''),
            'theme': user.get('theme', {}),
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
    
    if not user.get('password_hash'):
        raise HTTPException(status_code=400, detail='Esta conta não tem senha. Use o login com Google.')
    
    if not check_pw(req.password, user['password_hash']):
        raise HTTPException(status_code=400, detail='Senha incorreta')
    
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

@app.post('/api/auth/register')
def register(req: AuthReq, request: Request):
    # Rate limit registration attempts
    client_ip = request.client.host if request.client else 'unknown'
    check_rate_limit(client_ip, 'register', max_requests=5)  # 5 attempts per minute
    
    username = sanitize_string(req.username.lower(), 20)
    display  = sanitize_string(req.username, 20)
    password = req.password  # Don't sanitize password, just validate
    
    if not username or not password:
        raise HTTPException(status_code=400, detail='Username and password are required')
    if len(username) < 2:
        raise HTTPException(status_code=400, detail='Username must be at least 2 characters')
    if len(username) > 20:
        raise HTTPException(status_code=400, detail='Username must be at most 20 characters')
    if not username.isalnum():
        raise HTTPException(status_code=400, detail='Username must contain only letters and numbers')
    
    # Validate password strength
    is_valid, error_msg = validate_password(password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    if users_c.find_one({'username': username}):
        raise HTTPException(status_code=400, detail='Username already taken')

    theme = {'accentColor': '#22c55e', 'bgColor': '#080808', 'bgCard': '#111111', 'bgBorder': '#1f1f1f'}
    ins = users_c.insert_one({
        'username':      username,
        'display_name':  display,
        'password_hash': hash_pw(password),
        'theme':         theme,
        'created_at':    datetime.now(timezone.utc),
    })
    uid   = str(ins.inserted_id)
    token = make_token(uid, username)
    return {
        'token': token,
        'user': {
            'id': uid,
            'username': username,
            'displayName': display,
            'theme': theme,
        }
    }

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
    google_id    = g.get('sub', g.get('id', ''))

    print(f'[GOOGLE AUTH] Google returned: email={google_email}, name={name}, google_id={google_id}, picture={picture[:50] if picture else "None"}')

    if not email_lower:
        raise HTTPException(status_code=400, detail='No email from Google')

    # 2. Find existing user by email (case-insensitive search) - Multiple strategies
    import re
    
    user = None
    
    # Strategy 1: Exact lowercase match
    user = users_c.find_one({'email': email_lower})
    print(f'[GOOGLE AUTH] Search 1 (exact lowercase): {user is not None}')
    
    # Strategy 2: Exact original case match
    if not user:
        user = users_c.find_one({'email': google_email})
        print(f'[GOOGLE AUTH] Search 2 (exact original): {user is not None}')
    
    # Strategy 3: Case-insensitive regex
    if not user:
        user = users_c.find_one({'email': re.compile(f'^{re.escape(email_lower)}$', re.IGNORECASE)})
        print(f'[GOOGLE AUTH] Search 3 (regex): {user is not None}')
    
    # Strategy 4: Search by google_id if we've seen this user before
    if not user and google_id:
        user = users_c.find_one({'google_id': google_id})
        print(f'[GOOGLE AUTH] Search 4 (google_id): {user is not None}')
    
    if user:
        print(f'[GOOGLE AUTH] Found existing user: id={user["_id"]}, username={user["username"]}, email={user.get("email")}')
        
        # Existing user — update Google info but keep their username and ID
        uid      = str(user['_id'])
        username = user['username']
        display  = name  # Use Google's display name
        theme    = user.get('theme', {'accentColor': '#22c55e', 'bgColor': '#080808', 'bgCard': '#111111', 'bgBorder': '#1f1f1f'})
        
        # Update user with Google info and picture
        users_c.update_one(
            {'_id': user['_id']},
            {'$set': {
                'picture':        picture,
                'google_id':      google_id,
                'display_name':   display,
                'email':          email_lower,  # Ensure email is set
                'last_google_at': datetime.now(timezone.utc),
            }}
        )
        print(f'[GOOGLE AUTH] Updated existing user {username} with id {uid}, picture updated')
        
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
        print(f'[GOOGLE AUTH] No existing user found, creating new user for email: {email_lower}')
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
            'google_id':     google_id,
            'auth_provider': 'google',
            'theme':         theme,
            'created_at':    datetime.now(timezone.utc),
        })
        uid = str(ins.inserted_id)
        print(f'[GOOGLE AUTH] Created new user: id={uid}, username={username}')
        
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
