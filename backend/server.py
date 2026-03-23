from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from pymongo import MongoClient
import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timezone, timedelta
from typing import Any, Optional
import os
import requests as http_req
from dotenv import load_dotenv

load_dotenv()

# ── Config ─────────────────────────────────────────────────────────────────────
MONGO_URL  = os.environ.get('MONGO_URL')
DB_NAME    = os.environ.get('DB_NAME')
JWT_SECRET = os.environ.get('JWT_SECRET', 'routinequest_secret_2026')
JWT_ALG    = 'HS256'
JWT_DAYS   = 90

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(title='RoutineTracker API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
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

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_pw(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode('utf-8'), hashed.encode('utf-8'))

def make_token(uid: str, username: str) -> str:
    payload = {
        'sub': uid,
        'username': username,
        'exp': datetime.now(timezone.utc) + timedelta(days=JWT_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    try:
        return jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
    except JWTError:
        raise HTTPException(status_code=401, detail='Invalid or expired token')

# ── Pydantic Models ─────────────────────────────────────────────────────────────
class AuthReq(BaseModel):
    username: str
    password: str

class GoogleAuthReq(BaseModel):
    session_id: str

class DataReq(BaseModel):
    data: Any

# ── Auth Routes ────────────────────────────────────────────────────────────────
@app.get('/api/health')
def health():
    return {'status': 'ok', 'service': 'RoutineTracker API'}

@app.post('/api/auth/login')
def login(req: AuthReq):
    username = req.username.lower().strip()
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
def register(req: AuthReq):
    username = req.username.lower().strip()
    display  = req.username.strip()
    password = req.password.strip()
    
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
    # 1. Exchange session_id with Emergent Auth (server-side only)
    try:
        resp = http_req.get(
            'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
            headers={'X-Session-ID': req.session_id},
            timeout=10,
        )
    except Exception:
        raise HTTPException(status_code=502, detail='Could not reach Google auth service')

    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail='Invalid Google session')

    g = resp.json()
    email   = g.get('email', '').lower().strip()
    name    = g.get('name', email.split('@')[0])
    picture = g.get('picture', '')

    if not email:
        raise HTTPException(status_code=400, detail='No email from Google')

    # 2. Find or create user by email
    user = users_c.find_one({'email': email})

    if user:
        # Existing user — update Google info
        uid      = str(user['_id'])
        username = user['username']
        users_c.update_one(
            {'_id': user['_id']},
            {'$set': {
                'display_name':   name,
                'picture':        picture,
                'auth_provider':  'google',
                'last_google_at': datetime.now(timezone.utc),
            }}
        )
        theme = user.get('theme', {'accentColor': '#22c55e'})
    else:
        # New user — derive username from email
        base = email.split('@')[0].lower()
        base = ''.join(c for c in base if c.isalnum() or c == '_')[:20] or 'user'
        username = base
        counter  = 1
        while users_c.find_one({'username': username}):
            username = f'{base}{counter}'
            counter += 1

        theme = {'accentColor': '#22c55e', 'bgColor': '#080808', 'bgCard': '#111111', 'bgBorder': '#1f1f1f'}
        ins = users_c.insert_one({
            'username':      username,
            'display_name':  name,
            'email':         email,
            'picture':       picture,
            'auth_provider': 'google',
            'theme':         theme,
            'created_at':    datetime.now(timezone.utc),
        })
        uid = str(ins.inserted_id)

    token = make_token(uid, username)
    return {
        'token': token,
        'user': {
            'id':          uid,
            'username':    username,
            'displayName': name,
            'email':       email,
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
