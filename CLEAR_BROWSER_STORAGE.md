# 🔧 Clear Browser Storage

## Quick Fix for Auth Errors

The frontend may have old Supabase tokens stored. Clear them to fix authentication:

### Method 1: Use Browser Console (Recommended)

1. **Open your browser** at http://localhost:8080 (or wherever the frontend is running)
2. **Press F12** to open Developer Tools
3. **Click Console tab**
4. **Paste this command and press Enter:**

```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Method 2: Use Application Tab

1. **Press F12** to open Developer Tools
2. **Click Application tab** (or Storage in Firefox)
3. **Expand Local Storage** in the sidebar
4. **Right-click on your site** (localhost:8080)
5. **Select "Clear"**
6. **Refresh the page** (F5)

### Method 3: Use Private/Incognito Window

Open the site in a private/incognito window - no old tokens will exist.

---

After clearing, the auth errors should be gone! ✅

