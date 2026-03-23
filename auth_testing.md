# Auth Testing Playbook — RoutineQuest Google OAuth

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('routinequest');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API
```bash
API="https://ai-itinerary-8.preview.emergentagent.com"
curl -X GET "$API/api/auth/me" -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Step 3: Browser Testing
- Navigate to app, click "Continue with Google"
- Should redirect to Google login
- After Google auth, returns to app with #session_id=... in URL
- App should automatically sign in and show dashboard

## Checklist
- [ ] Google button visible on login screen
- [ ] Clicking redirects to auth.emergentagent.com
- [ ] After Google auth, #session_id= in URL is processed
- [ ] New Google user is created in DB
- [ ] Existing user matched by email
- [ ] JWT returned same as password login
- [ ] Dashboard loads with user data
