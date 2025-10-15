# 🔐 Test Accounts for Talent Forge

## After Clearing Browser Storage

Use these accounts to test login:

### 👨‍💻 Freelancer Account
- **Email:** `freelancer1@example.com`
- **Password:** `password123`
- **Role:** Freelancer

### 👔 Client Account  
- **Email:** `client1@example.com`
- **Password:** `password123`
- **Role:** Client

### 🛡️ Admin Account
- **Email:** `admin@talentforge.com`
- **Password:** `AdminPass123!`
- **Role:** Admin

---

## Login Steps

1. **Clear browser storage first!**
   - Open: `http://localhost:8080/force-clear.html`
   - OR paste in console (F12): `localStorage.clear(); sessionStorage.clear(); location.reload();`

2. **Go to login page:**
   ```
   http://localhost:8080/auth
   ```

3. **Enter credentials** from above

4. **Click "Log ind"**

5. **Expected result:**
   - ✅ Login succeeds
   - ✅ Redirects to dashboard
   - ✅ No errors in console

---

## If Login Fails

### Check Backend is Running:
```bash
curl http://localhost:5001/health
# Should return: {"status":"ok"}
```

### Check Login Endpoint:
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"freelancer1@example.com","password":"password123"}' | jq
```

Should return:
```json
{
  "user": { ... },
  "accessToken": "...",
  "refreshToken": "...",
  "message": "Login successful"
}
```

### Check Frontend Port:
```bash
curl -I http://localhost:8080
# Should return: HTTP/1.1 200 OK
```

---

## Troubleshooting

### Still seeing Supabase URLs?
- **Clear storage again!** Old tokens persist
- Try **Incognito/Private window**
- Check browser console for errors

### "Invalid credentials" error?
- Backend might not have seeded data
- Run: `cd backend && npm run prisma:seed`

### CORS errors?
- Backend should allow `http://localhost:8080`
- Check `backend/src/server.ts` CORS config
- Restart backend: `cd backend && npm run dev`

---

## Success Criteria

✅ Login page loads without Supabase errors  
✅ Login succeeds with test account  
✅ Console shows: `POST http://localhost:5001/api/auth/login`  
✅ No `supabase.co` URLs in Network tab  
✅ Redirects to appropriate dashboard  

---

**Just clear storage first, then login will work!** 🚀
