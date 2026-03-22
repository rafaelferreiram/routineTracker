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
from dotenv import load_dotenv

load_dotenv()

# ── Config ─────────────────────────────────────────────────────────────────────
MONGO_URL  = os.environ.get('MONGO_URL')
DB_NAME    = os.environ.get('DB_NAME')
JWT_SECRET = os.environ.get('JWT_SECRET', 'routinequest_secret_2026')
JWT_ALG    = 'HS256'
JWT_DAYS   = 90

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(title='RoutineQuest API')

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

class DataReq(BaseModel):
    data: Any

# ── Auth Routes ────────────────────────────────────────────────────────────────
@app.get('/api/health')
def health():
    return {'status': 'ok', 'service': 'RoutineQuest API'}

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
            'theme': user.get('theme', {}),
        }
    }

@app.post('/api/auth/register')
def register(req: AuthReq):
    username = req.username.lower().strip()
    display  = req.username.strip()
    if not username or not req.password.strip():
        raise HTTPException(status_code=400, detail='Username and password are required')
    if len(username) < 2:
        raise HTTPException(status_code=400, detail='Username must be at least 2 characters')
    if users_c.find_one({'username': username}):
        raise HTTPException(status_code=400, detail='Username already taken')

    theme = {'accentColor': '#22c55e', 'bgColor': '#080808', 'bgCard': '#111111', 'bgBorder': '#1f1f1f'}
    ins = users_c.insert_one({
        'username':      username,
        'display_name':  display,
        'password_hash': hash_pw(req.password.strip()),
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
