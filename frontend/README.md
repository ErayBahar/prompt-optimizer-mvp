# 🚀 Prompt Optimizer Tool

Web-based tool for optimizing AI prompts with customizable scoring weights.

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open http://localhost:5173
```

**That's it! No Firebase or backend setup required.**

---

## ✨ Features

- 📝 **Prompt Input** - Enter your prompts for optimization
- 🎯 **LLM Selection** - Choose from different language models
- ⚖️ **Score Weights** - Customize 5 scoring criteria (TASK, ROLE, STYLE, OUTPUT, RULES)
- 📊 **Metrics Display** - View token count and latency
- ⭐ **Rating System** - Rate optimized prompts (1-5 stars)
- 📜 **History** - Track your optimization history
- 🔐 **Simple Auth** - Mock login (Backend integration ready)

## 🏃‍♂️ Quick Start

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Run Development Server

```bash
npm run dev
# or
pnpm dev
```

### 3. Open in Browser

```
http://localhost:5173
```

## 🔧 Development Mode

The app runs in **mock mode** by default (no Firebase/Backend required):

- ✅ **Login**: Use any email/password
- ✅ **Optimization**: Mock response after 1.5 seconds
- ✅ **Feedback**: Logged to console
- ✅ **History**: Stored in local state

## 📁 Project Structure

```
/
├── src/
│   ├── app/
│   │   ├── App.tsx                 # Main application
│   │   └── components/
│   │       ├── LoginPage.tsx       # Login screen
│   │       ├── PromptInput.tsx     # Prompt input area
│   │       ├── LLMSelector.tsx     # LLM dropdown
│   │       ├── ScoreSettings.tsx   # Score weight inputs
│   │       ├── OptimizeButton.tsx  # Optimize button
│   │       ├── ResultDisplay.tsx   # Results view
│   │       ├── RatingStars.tsx     # Star rating
│   │       ├── PromptHistory.tsx   # History sidebar
│   │       └── ui/                 # UI components
│   ├── services/
│   │   ├── feedbackService.js      # Mock feedback service
│   │   └── authService.js          # Mock auth service
│   ├── config/
│   │   └── firebase.js             # Mock Firebase config
│   └── styles/
│       ├── index.css               # Main styles
│       ├── tailwind.css            # Tailwind imports
│       └── theme.css               # Theme variables
├── index.html                      # HTML entry point
└── package.json
```

## 🎮 How to Use

### 1. Login
- Enter any email/password
- Click "Sign In"

### 2. Enter Prompt
- Type your prompt in the text area
- Example: "Create a marketing campaign for a tech startup"

### 3. Select LLM (Optional)
- Choose a language model from dropdown
- Options: Model 1, Model 2, Model 3, Model 4

### 4. Set Score Weights (Optional)
- Click "Show" to expand score settings
- Enter weights for 5 categories (must total 10)
  - **TASK**: Task description weight
  - **ROLE**: Role definition weight
  - **STYLE**: Writing style weight
  - **OUTPUT**: Output format weight
  - **RULES**: Rules/guidelines weight

### 5. Optimize
- Click "Optimize Prompt" button
- Wait for mock optimization (~1.5 seconds)

### 6. Review Results
- View original vs optimized prompt
- See token count and latency metrics
- Click "Copy" to copy optimized prompt

### 7. Rate
- Give a star rating (1-5)
- Feedback is logged to console

### 8. History
- View previous optimizations in left sidebar
- Click to reload
- Delete with X button
- Click "+" for new prompt

## 🔌 Backend Integration (Coming Soon)

When backend is ready, replace mock services with API calls:

1. Update `/src/services/api.ts`
2. Connect to backend endpoints:
   - `POST /api/auth/login` - Authentication
   - `POST /api/prompts/optimize` - Optimization
   - `POST /api/feedback` - Save ratings

## 🛠️ Build for Production

```bash
npm run build
# or
pnpm build
```

Build files will be in `dist/` folder.

## 📦 Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling
- **Lucide React** - Icons
- **Sonner** - Toast notifications
- **Radix UI** - UI components

## 🔥 Firebase (Disabled)

Firebase is currently disabled. Mock services are used instead.

To enable Firebase:
1. Update `/src/config/firebase.js` with your credentials
2. See `FIREBASE_SETUP.md` for instructions

## 📝 Notes

- All data is stored in local state (not persistent)
- Mock optimization simulates backend delay
- Designed for backend API integration
- Responsive design for desktop/mobile

## 🆘 Troubleshooting

### Port already in use?

Change port in `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 3000, // Change to your preferred port
  },
});
```

### Firebase errors?

Firebase is disabled by default. Ignore console warnings about Firebase.

---

**Happy optimizing! 🎉**