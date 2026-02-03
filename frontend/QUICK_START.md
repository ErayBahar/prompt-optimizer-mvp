# 🚀 Quick Start Guide

Get your Prompt Optimizer Tool running in 3 simple steps!

## ⚡ Installation

### Step 1: Install Dependencies

```bash
npm install
# or if using pnpm
pnpm install
```

### Step 2: Start Development Server

```bash
npm run dev
# or if using pnpm  
pnpm dev
```

### Step 3: Open in Browser

The app will automatically open at:
```
http://localhost:5173
```

---

## ✅ You're Ready!

The app is now running in **MOCK MODE** - no backend or Firebase setup required!

### What This Means:
- ✅ **Login works** - use any email/password
- ✅ **Optimization works** - mock response in ~1.5 seconds
- ✅ **Ratings work** - feedback logged to console
- ✅ **History works** - stored in browser memory

---

## 🎮 Try It Out

1. **Login Page**
   - Enter any email (e.g., `test@example.com`)
   - Enter any password (e.g., `password123`)
   - Click "Sign In"

2. **Main Dashboard**
   - Enter a prompt: `"Create a marketing campaign"`
   - (Optional) Select an LLM model
   - (Optional) Click "Show" to set score weights (must total 10)
   - Click "Optimize Prompt"

3. **View Results**
   - See the optimized prompt
   - Check token count and latency
   - Click "Copy" to copy the optimized prompt
   - Rate with stars (1-5)

4. **History Sidebar**
   - View your optimization history
   - Click any item to reload it
   - Click X to delete
   - Click + for a new prompt

---

## 🔧 Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📁 Project Structure

```
/
├── src/
│   ├── app/
│   │   ├── App.tsx              # Main app component
│   │   └── components/          # React components
│   ├── services/                # Mock services
│   ├── config/                  # Mock Firebase config
│   └── styles/                  # CSS styles
├── index.html                   # HTML entry
├── package.json                 # Dependencies
└── vite.config.ts              # Vite config
```

---

## 🐛 Troubleshooting

### Port Already in Use?

Edit `vite.config.ts` and change the port:

```typescript
export default defineConfig({
  server: { port: 3000 },
  // ... rest of config
});
```

### Dependencies Not Installing?

Try clearing cache:

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### App Not Loading?

1. Check console for errors
2. Make sure you're on `http://localhost:5173`
3. Try hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

---

## 🔌 Backend Integration (Future)

This app is ready for backend integration. When your Python/FastAPI backend is ready:

1. Create an API service file
2. Replace mock functions with real API calls
3. Update endpoints in the service layer

No changes needed to UI components!

---

## 📚 Need More Help?

- 📖 See `README.md` for detailed documentation
- 🔥 `FIREBASE_SETUP.md` (optional - for future use)
- 💬 Check browser console for debug messages

---

**Happy Optimizing! 🎉**
