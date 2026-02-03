# 🛠️ Setup Instructions

## ⚡ Fresh Installation

Follow these steps to get the app running **without any errors**:

### Step 1: Clean Install (Recommended)

If you're seeing Firebase errors, do a fresh install:

```bash
# Remove old dependencies
rm -rf node_modules
rm -f package-lock.json
rm -f pnpm-lock.yaml

# Install fresh dependencies
npm install
# or
pnpm install
```

### Step 2: Start Development Server

```bash
npm run dev
# or
pnpm dev
```

### Step 3: Verify It's Working

Open your browser to:
```
http://localhost:5173
```

**Expected Console Output:**
```
✅ Running in MOCK MODE (Firebase disabled)
🚀 App loaded: [timestamp]
```

**NO Firebase errors should appear!**

---

## ✅ What You Should See

### Console (No Errors):
- ✅ `Running in MOCK MODE`
- ✅ `App loaded`
- ❌ **NO** "Firebase is not configured" errors
- ❌ **NO** red error messages

### Browser:
- ✅ Clean login page
- ✅ No error popups
- ✅ Smooth transitions

---

## 🐛 Still Seeing Errors?

### Error: "Firebase is not configured"

**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard reload the page (Ctrl+Shift+R)
3. Close all browser tabs
4. Restart dev server
5. Open fresh browser tab

### Error: "Module not found"

**Solution:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Error: Port already in use

**Solution:**
```bash
# Kill process on port 5173
# On Windows:
netstat -ano | findstr :5173
taskkill /PID [PID_NUMBER] /F

# On Mac/Linux:
lsof -ti:5173 | xargs kill -9

# Or change port in vite.config.ts
```

---

## 📦 Package Verification

After installation, verify these packages are **NOT** installed:

```bash
# Check package.json - should NOT contain:
❌ firebase
❌ next-themes (removed for simplicity)

# Should contain:
✅ react
✅ vite  
✅ lucide-react
✅ sonner
✅ tailwindcss
```

---

## 🔍 File Checklist

Ensure these files exist and are correct:

```
✅ /index.html                    # HTML entry point
✅ /src/main.tsx                  # React entry point
✅ /src/app/App.tsx              # Main app
✅ /src/config/firebase.js       # Mock Firebase (no imports)
✅ /src/services/feedbackService.js  # Mock service
✅ /package.json                 # No firebase dependency
```

---

## 🎯 Quick Test

After setup, test these features:

1. **Login**
   - Use any email: `test@example.com`
   - Use any password: `password123`
   - Should login instantly

2. **Optimize**
   - Enter: "Write a story about AI"
   - Click "Optimize Prompt"
   - Should show result after ~1.5 seconds

3. **Rate**
   - Click stars to rate
   - Check console: should log feedback
   - Should show success toast

4. **History**
   - Previous optimizations appear in sidebar
   - Click item to reload
   - Click X to delete

---

## 🎉 Success Indicators

You'll know it's working when:

- ✅ No Firebase error messages
- ✅ Login works with any credentials
- ✅ Optimization shows mock results
- ✅ Console shows "MOCK MODE" message
- ✅ No red errors in console
- ✅ Toast notifications appear
- ✅ History sidebar works

---

## 📞 Need Help?

If you're still having issues:

1. Check `/README.md` for detailed docs
2. Check `/QUICK_START.md` for quick guide
3. Check browser console for specific errors
4. Try the troubleshooting steps above

---

## 🔄 Reset to Clean State

If all else fails, complete reset:

```bash
# 1. Remove everything
rm -rf node_modules dist .vite package-lock.json pnpm-lock.yaml

# 2. Reinstall
npm install

# 3. Start fresh
npm run dev

# 4. Hard refresh browser
Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

---

**Happy developing! 🚀**
