from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
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

load_dotenv()

# ── Config ─────────────────────────────────────────────────────────────────────
MONGO_URL  = os.environ.get('MONGO_URL')
DB_NAME    = os.environ.get('DB_NAME')
JWT_SECRET = os.environ.get('JWT_SECRET', 'routinequest_secret_2026')
JWT_ALG    = 'HS256'
JWT_DAYS   = 90
# Use user's OpenAI key or fallback to Emergent LLM Key
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', 'sk-emergent-46676Cb71D8D39eA36')

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

@app.post('/api/auth/login-email')
def login_email(req: EmailLoginReq):
    """Login using email instead of username."""
    import re
    email = req.email.lower().strip()
    
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

    print(f'[GOOGLE AUTH] Google returned: email={google_email}, name={name}, google_id={google_id}')

    if not email_lower:
        raise HTTPException(status_code=400, detail='No email from Google')

    # 2. Find existing user by email (case-insensitive search)
    import re
    
    # Try multiple search strategies
    user = users_c.find_one({'email': email_lower})
    print(f'[GOOGLE AUTH] Search 1 (exact lowercase): {user is not None}')
    
    if not user:
        user = users_c.find_one({'email': google_email})
        print(f'[GOOGLE AUTH] Search 2 (exact original): {user is not None}')
    
    if not user:
        # Try case-insensitive regex
        user = users_c.find_one({'email': re.compile(f'^{re.escape(email_lower)}$', re.IGNORECASE)})
        print(f'[GOOGLE AUTH] Search 3 (regex): {user is not None}')
    
    if user:
        print(f'[GOOGLE AUTH] Found existing user: id={user["_id"]}, username={user["username"]}, email={user.get("email")}')
        
        # Existing user — update Google info but keep their username and ID
        uid      = str(user['_id'])
        username = user['username']
        display  = user.get('display_name', name)
        theme    = user.get('theme', {'accentColor': '#22c55e', 'bgColor': '#080808', 'bgCard': '#111111', 'bgBorder': '#1f1f1f'})
        
        # Update Google-specific fields
        users_c.update_one(
            {'_id': user['_id']},
            {'$set': {
                'picture':        picture,
                'google_id':      google_id,
                'last_google_at': datetime.now(timezone.utc),
            }}
        )
        print(f'[GOOGLE AUTH] Updated existing user {username} with id {uid}')
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
    user_habits = user_data_doc.get('habits', []) if user_data_doc else []
    user_events = user_data_doc.get('events', []) if user_data_doc else []
    
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
    events_summary = ", ".join([f"{e.get('emoji','')} {e.get('title','')}" for e in user_events[:5]]) if user_events else "Nenhum evento"
    
    system_prompt = f"""Você é o Roti, um assistente IA inteligente do app RoutineTracker.

CAPACIDADES:
- Responder perguntas gerais (conhecimento, programação, ciência, etc.)
- CRIAR hábitos para o usuário
- EDITAR hábitos existentes (nome, emoji, frequência)  
- CRIAR eventos
{weather_context}

HÁBITOS ATUAIS DO USUÁRIO: {habits_summary}
EVENTOS DO USUÁRIO: {events_summary}

REGRAS PARA AÇÕES:
- Quando o usuário pedir para criar/adicionar um hábito, use a função create_habit
- Quando pedir para editar/mudar um hábito, use edit_habit
- Quando pedir para criar um evento, use create_event
- Confirme a ação realizada de forma amigável

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
                    "createdAt": datetime.now(timezone.utc).isoformat()
                }
                # Update the nested data.events array
                data_c.update_one(
                    {"user_id": user_id},
                    {"$push": {"data.events": new_event}},
                    upsert=True
                )
                return f"✅ Evento '{args['title']}' {args.get('emoji', '')} criado para {args['date']}!"
                
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
