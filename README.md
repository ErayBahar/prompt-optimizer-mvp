# 🚀 Prompt Optimizer MVP

> AI-powered prompt analysis and optimization platform with real-time feedback and project management

A full-stack web application that analyzes, scores, and optimizes user prompts for better AI interactions. Built with React (TypeScript), FastAPI (Python), Firebase, and Nebius AI.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![React](https://img.shields.io/badge/react-18.0+-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.0+-3178c6.svg)](https://www.typescriptlang.org/)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [How It Works](#-how-it-works)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Core Functionality
- 🎯 **Intelligent Prompt Analysis** - Breaks down prompts into 6 components (Task, Role, Style, Output, Rules, Context)
- 📊 **Scoring System** - Assigns 0-10 scores for each component with customizable weights
- 🤖 **AI Optimization** - Uses Nebius AI to generate improved prompt versions
- ⚡ **Real-time Metrics** - Token counting, latency tracking, and improvement percentages

### User Experience
- 🎨 **Dark/Light Theme** - Seamless theme switching with persistent preferences
- 📱 **Responsive Design** - Mobile-first approach with tablet and desktop optimization
- 📜 **Prompt History** - Infinite scroll, search, favorites, and project organization
- ⭐ **Rating & Feedback** - Rate optimizations and provide feedback
- 🗂️ **Project Management** - Organize prompts into projects with full CRUD operations

### Authentication & Data
- 🔐 **Firebase Authentication** - Secure login with email/password
- 💾 **Firestore Database** - Real-time data synchronization
- 🔄 **State Management** - Efficient caching and instant UI updates
- 📦 **Export/Import** - Backup and restore your data

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Custom CSS
- **UI Components**: Radix UI (Accordion, Dialog, Drawer, etc.)
- **Icons**: Lucide React
- **Toast Notifications**: Sonner
- **HTTP Client**: Fetch API with custom wrapper

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **AI Integration**: Nebius AI (OpenAI-compatible API)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Admin SDK
- **Token Counting**: tiktoken
- **Server**: Uvicorn (ASGI)

### Infrastructure
- **Hosting**: Render (Backend) / Vercel (Frontend)
- **Version Control**: Git + GitHub
- **Environment**: dotenv for configuration

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │     React App (TypeScript + Vite)                    │   │
│  │  ┌────────────┬──────────────┬──────────────────┐   │   │
│  │  │ Components │  Services    │  State Management│   │   │
│  │  │            │  - Auth      │  - Local Storage │   │   │
│  │  │            │  - API       │  - Context       │   │   │
│  │  │            │  - Firebase  │  - Hooks         │   │   │
│  │  └────────────┴──────────────┴──────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS / REST API
┌──────────────────────┴──────────────────────────────────────┐
│                    FastAPI Backend                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │     Routers (Endpoints)                              │   │
│  │  ┌─────────┬────────────┬──────────────┐            │   │
│  │  │ Prompt  │   User     │     Auth     │            │   │
│  │  │ Router  │   Router   │    Router    │            │   │
│  │  └────┬────┴──────┬─────┴──────┬───────┘            │   │
│  │       │           │            │                     │   │
│  │  ┌────┴───────────┴────────────┴───────┐            │   │
│  │  │         Services Layer              │            │   │
│  │  │  - Nebius AI (Optimization)         │            │   │
│  │  │  - Firebase Admin (DB)              │            │   │
│  │  │  - Token Counter                    │            │   │
│  │  └─────────────┬───────────────────────┘            │   │
│  └────────────────┼──────────────────────────────────┘   │
└───────────────────┼──────────────────────────────────────┘
                    │
        ┌───────────┴────────────┐
        │                        │
┌───────▼─────────┐    ┌─────────▼──────────┐
│  Firebase Auth  │    │  Nebius AI API     │
│  & Firestore    │    │  (Prompt Optimize) │
└─────────────────┘    └────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- Python 3.10+
- Firebase project with Firestore enabled
- Nebius AI API key

### 1. Clone Repository

```bash
git clone https://github.com/ErayBahar/prompt-optimizer-mvp.git
cd prompt-optimizer-mvp
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials:
# - NEBIUS_API_KEY=your_api_key
# - FIREBASE_CREDENTIALS=path/to/serviceAccountKey.json

# Download Firebase credentials from Firebase Console
# Save as backend/services/serviceAccountKey.json

# Start backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will run at: `http://localhost:8000`

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Configure Firebase (create .env file if needed)
# Add your Firebase config (optional for development)

# Start development server
npm run dev
```

Frontend will run at: `http://localhost:5173`

### 4. Access the Application

1. Open `http://localhost:5173` in your browser
2. Sign up or log in with email/password
3. Start optimizing prompts!

**API Documentation**: Visit `http://localhost:8000/docs` for interactive API docs

---

## 📁 Project Structure

```
prompt-optimizer-mvp/
├── backend/                    # Python FastAPI backend
│   ├── main.py                # Entry point
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables (not in git)
│   │
│   ├── core/
│   │   └── config.py          # Configuration settings
│   │
│   ├── routers/
│   │   ├── prompt_router.py   # Prompt optimization endpoints
│   │   ├── user_router.py     # User management endpoints
│   │   └── auth_router.py     # Authentication endpoints
│   │
│   ├── schemas/
│   │   ├── prompt.py          # Prompt data models
│   │   └── user.py            # User data models
│   │
│   └── services/
│       ├── firebase_db.py     # Firestore database service
│       ├── nebius_ai.py       # AI optimization service
│       ├── token_counter.py   # Token counting utility
│       └── serviceAccountKey.json  # Firebase credentials (not in git)
│
├── frontend/                   # React TypeScript frontend
│   ├── index.html             # HTML entry point
│   ├── package.json           # Node dependencies
│   ├── vite.config.ts         # Vite configuration
│   ├── tsconfig.json          # TypeScript configuration
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   │
│   └── src/
│       ├── main.tsx           # React entry point
│       ├── app/
│       │   ├── App.tsx        # Main application component
│       │   └── components/    # React components
│       │       ├── LandingPage.tsx
│       │       ├── LoginPage.tsx
│       │       ├── PromptInput.tsx
│       │       ├── LLMSelector.tsx
│       │       ├── ScoreSettings.tsx
│       │       ├── OptimizeButton.tsx
│       │       ├── ResultDisplay.tsx
│       │       ├── RatingFeedback.tsx
│       │       ├── PromptHistory.tsx
│       │       ├── ProjectList.tsx
│       │       ├── ProjectPromptView.tsx
│       │       ├── HelpButton.tsx
│       │       └── ui/        # Reusable UI components
│       │
│       ├── services/
│       │   ├── apiClient.ts   # HTTP client
│       │   ├── apiService.ts  # API integration
│       │   ├── authService.ts # Firebase auth
│       │   ├── historyService.ts
│       │   ├── projectService.ts
│       │   └── feedbackService.ts
│       │
│       ├── contexts/
│       │   └── ThemeContext.tsx  # Theme management
│       │
│       └── styles/
│           ├── index.css      # Global styles
│           ├── tailwind.css   # Tailwind imports
│           └── theme.css      # Theme variables
│
├── README.md                  # This file
├── package.json               # Root package config
├── render.yaml                # Render deployment config
└── .gitignore                # Git ignore rules
```

---

## 🔄 How It Works

### 1. Prompt Analysis Flow

```
User Input → FastAPI Backend → Nebius AI Analysis → Score Calculation → Store in Firestore
                ↓
Frontend Display ← Structured Data ← 6 Component Breakdown
```

**Components Analyzed**:
- **Task**: What needs to be done (e.g., "Write a blog post")
- **Role**: AI's perspective (e.g., "As a marketing expert")
- **Style**: Tone and manner (e.g., "Professional, engaging")
- **Output**: Expected format (e.g., "1000 words, markdown format")
- **Rules**: Constraints (e.g., "Avoid jargon, use examples")
- **Context**: Background information (e.g., "For tech-savvy audience")

### 2. Scoring System

Each component receives a score (0-10):
- **0-3**: Poor - Missing or unclear
- **4-6**: Fair - Present but needs improvement
- **7-8**: Good - Well-defined
- **9-10**: Excellent - Clear, specific, actionable

**Overall Score** = Weighted average of component scores

### 3. Optimization Process

1. User submits original prompt
2. Backend analyzes and scores components
3. AI generates optimized version
4. System compares improvements
5. User receives both versions with metrics
6. User can rate the optimization

### 4. Data Flow

```
┌──────────┐      ┌──────────┐      ┌───────────┐      ┌──────────┐
│  User    │─────▶│ Frontend │─────▶│  Backend  │─────▶│ Nebius   │
│ Browser  │      │  React   │      │  FastAPI  │      │   AI     │
└──────────┘      └──────────┘      └───────────┘      └──────────┘
     ▲                  │                  │                   │
     │                  ▼                  ▼                   │
     │            ┌──────────┐      ┌───────────┐            │
     └────────────│ Firebase │◀─────│ Firestore │◀───────────┘
                  │   Auth   │      │  Database │
                  └──────────┘      └───────────┘
```

---

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# Nebius AI API
NEBIUS_API_KEY=your_nebius_api_key_here

# Firebase
FIREBASE_CREDENTIALS=backend/services/serviceAccountKey.json

# Server (optional)
PORT=8000
HOST=0.0.0.0
```

### Frontend Environment Variables

Create `frontend/.env`:

```env
# API Endpoint
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Firebase Configuration (optional)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Firestore Database**
4. Enable **Email/Password Authentication**
5. Download service account key:
   - Project Settings → Service Accounts → Generate New Private Key
   - Save as `backend/services/serviceAccountKey.json`

---

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api/v1
```

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/optimize` | Analyze and optimize prompt in one step |
| POST | `/parse` | Analyze prompt without optimization |
| GET | `/history/{user_id}` | Get user's prompt history |
| DELETE | `/prompt/{prompt_id}` | Delete a prompt |
| PUT | `/prompt/{prompt_id}/favorite` | Toggle favorite status |
| POST | `/prompt/{prompt_id}/feedback` | Submit rating/feedback |
| GET | `/projects/{user_id}` | Get user's projects |
| POST | `/projects` | Create new project |
| POST | `/verify-token` | Verify Firebase auth token |

**Full API Documentation**: `http://localhost:8000/docs` (when backend is running)

---

## 🚀 Deployment

### Backend (Render)

1. Push code to GitHub
2. Create new Web Service on [Render](https://render.com)
3. Connect GitHub repository
4. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**: Add all from `.env`
5. Deploy

### Frontend (Vercel/Netlify)

**Vercel**:
```bash
npm install -g vercel
cd frontend
vercel
```

**Netlify**:
```bash
cd frontend
npm run build
# Deploy dist/ folder to Netlify
```

### Environment Variables in Production

Remember to set:
- Backend: `NEBIUS_API_KEY`, `FIREBASE_CREDENTIALS`
- Frontend: `VITE_API_BASE_URL` (production backend URL)

---

## 🧪 Testing

```bash
# Backend tests (when implemented)
cd backend
pytest tests/ -v

# Frontend tests (when implemented)
cd frontend
npm run test
```

---

## 🐛 Troubleshooting

### Common Issues

**Backend won't start**:
- Check Python version: `python --version` (must be 3.10+)
- Verify virtual environment is activated
- Ensure `serviceAccountKey.json` exists

**Frontend connection errors**:
- Confirm backend is running on port 8000
- Check CORS settings in `main.py`
- Verify Firebase configuration

**Authentication errors**:
- Verify Firebase Auth is enabled
- Check token expiration
- Ensure credentials are correct

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Coding Standards

- **Backend**: Follow PEP 8, use type hints
- **Frontend**: Follow ESLint rules, use TypeScript strictly
- **Commits**: Use conventional commits (feat, fix, docs, etc.)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team & Contact

**Entrophi Team**

- 🌐 Website: [entrophi.co](https://entrophi.co)
- 📧 Email: info@entrophi.co
- 💼 LinkedIn: [Entrophi Company](https://www.linkedin.com/company/entrophico/)
- 📷 Instagram: [@entrophi.co](https://www.instagram.com/entrophi.co)

**Working Hours**: Monday-Friday 09:00-18:00, Saturday 10:00-16:00 (GMT+3)

---

## 🙏 Acknowledgments

- [Nebius AI](https://nebius.ai) - AI optimization engine
- [Firebase](https://firebase.google.com) - Authentication & Database
- [Radix UI](https://www.radix-ui.com/) - Accessible UI components
- [Lucide](https://lucide.dev/) - Beautiful icons
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

## 📊 Project Status

- ✅ Core optimization functionality
- ✅ User authentication & authorization
- ✅ Project management system
- ✅ Dark/Light theme support
- ✅ Responsive mobile design
- ✅ Real-time metrics tracking
- 🚧 Unit & integration tests
- 🚧 Performance optimization
- 🚧 Advanced analytics dashboard
- 📋 Rate limiting & quotas
- 📋 Export/import functionality
- 📋 Team collaboration features

---

**Made with ❤️ by Entrophi Team**
