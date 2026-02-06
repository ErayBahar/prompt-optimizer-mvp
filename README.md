# 🚀 Prompt Refiner MVP

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-10.14-FFCA28?logo=firebase&logoColor=black)

**An AI-powered middleware that optimizes user prompts for better LLM performance**

[Features](#-features) • [Demo](#-demo) • [Quick Start](#-quick-start) • [Installation](#-installation) • [API Reference](#-api-reference) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

Prompt Refiner MVP is a full-stack web application that analyzes and optimizes AI prompts using advanced language models. It breaks down prompts into key components, scores them, and provides improved versions for better AI interactions.

### Why Prompt Refiner?

- 🎯 **Better Results**: Get more accurate and relevant responses from AI models
- ⏱️ **Save Time**: Instantly optimize prompts instead of manual trial-and-error
- 📊 **Measurable Quality**: Understand prompt quality through component-based scoring
- 🔄 **Learn & Improve**: Track optimization history to learn what makes a great prompt

---

## ✨ Features

### Core Functionality
- **📝 Prompt Analysis** - Breaks prompts into 6 components: Task, Role, Style, Output, Rules, Context
- **⚡ AI Optimization** - Uses Nebius AI to generate optimized prompt versions
- **📊 Quality Scoring** - Scores each component on a 0-10 scale
- **🎚️ Custom Weights** - Adjust importance of each scoring criterion

### User Experience
- **🔐 Authentication** - Secure login with Firebase Auth
- **📜 History Tracking** - View and manage your optimization history
- **⭐ Rating System** - Rate optimized prompts (1-5 stars)
- **❤️ Favorites** - Save your best optimizations
- **📁 Project Organization** - Organize prompts into projects
- **🌓 Theme Support** - Light and dark mode

### Technical Features
- **📈 Token Counting** - Track prompt and completion tokens
- **⏱️ Latency Metrics** - Monitor optimization speed
- **🔌 REST API** - Full API for programmatic access
- **☁️ Cloud Ready** - Deploy to Render, Vercel, or any cloud platform

---

## 🖼️ Demo

### Main Interface
The application features a clean, intuitive interface for prompt optimization:

1. **Enter your prompt** in the input area
2. **Select an LLM** from the dropdown
3. **Adjust score weights** for different criteria
4. **Click Optimize** to get an improved version
5. **Rate and save** your favorite optimizations

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Login Page │  │ Prompt View │  │    History Sidebar      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API
┌────────────────────────────▼────────────────────────────────────┐
│                       Backend (FastAPI)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Auth Router │  │Prompt Router│  │     User Router         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└──────────┬─────────────────┬────────────────────────────────────┘
           │                 │
    ┌──────▼──────┐   ┌──────▼──────┐
    │  Firebase   │   │  Nebius AI  │
    │  Firestore  │   │     API     │
    └─────────────┘   └─────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Firebase project (with Firestore enabled)
- Nebius AI API key

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/canreves/prompt-refiner-mvp.git
cd prompt-refiner-mvp

# Start Frontend (runs in mock mode without backend)
cd frontend && npm install && npm run dev
```

Open http://localhost:5173 - **that's it!** The frontend works in mock mode without any backend setup.

---

## 📦 Installation

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload
```

### Environment Variables

#### Backend (.env)
```env
# Nebius AI API Key
NEBIUS_API_KEY=your_nebius_api_key

# Firebase credentials path
FIREBASE_CREDENTIALS=services/serviceAccountKey.json
```

#### Frontend (.env)
```env
# Backend API URL
VITE_API_URL=http://localhost:8000
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable **Firestore Database**
4. Go to Project Settings → Service Accounts
5. Click "Generate new private key"
6. Save as `backend/services/serviceAccountKey.json`

> ⚠️ **Important**: Never commit `serviceAccountKey.json` to git!

---

## 📁 Project Structure

```
prompt-refiner-mvp/
├── 📂 backend/                   # Python FastAPI Backend
│   ├── main.py                   # Application entry point
│   ├── requirements.txt          # Python dependencies
│   ├── 📂 core/
│   │   └── config.py             # App configuration
│   ├── 📂 routers/
│   │   ├── auth_router.py        # Authentication endpoints
│   │   ├── prompt_router.py      # Prompt optimization endpoints
│   │   └── user_router.py        # User management endpoints
│   ├── 📂 schemas/
│   │   ├── prompt.py             # Prompt data models
│   │   └── user.py               # User data models
│   └── 📂 services/
│       ├── firebase_db.py        # Firestore integration
│       ├── nebius_ai.py          # AI service integration
│       ├── sanitize.py           # Input sanitization
│       └── token_counter.py      # Token counting utility
│
├── 📂 frontend/                  # React TypeScript Frontend
│   ├── index.html                # HTML entry
│   ├── package.json              # Node dependencies
│   ├── vite.config.ts            # Vite configuration
│   ├── tsconfig.json             # TypeScript config
│   └── 📂 src/
│       ├── main.tsx              # React entry point
│       └── 📂 app/
│           ├── App.tsx           # Main application
│           ├── 📂 components/    # React components
│           ├── 📂 services/      # API services
│           ├── 📂 contexts/      # React contexts
│           └── 📂 styles/        # CSS styles
│
├── render.yaml                   # Render deployment config
└── README.md                     # This file
```

---

## 🔌 API Reference

### Base URL
```
http://localhost:8000/api/v1
```

### Endpoints

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login |
| POST | `/auth/register` | User registration |
| POST | `/auth/logout` | User logout |

#### Prompts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/optimize` | Optimize a prompt |
| GET | `/history` | Get optimization history |
| DELETE | `/history/{id}` | Delete history item |

#### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/user/profile` | Get user profile |
| PUT | `/user/profile` | Update user profile |
| GET | `/user/favorites` | Get favorite prompts |

### Example Request

```bash
curl -X POST "http://localhost:8000/api/v1/optimize" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "prompt": "Write a blog post about AI",
    "model": "gpt-4",
    "weights": {
      "task": 1.0,
      "role": 0.8,
      "style": 0.6,
      "output": 0.9,
      "rules": 0.7
    }
  }'
```

---

## ☁️ Deployment

### Render (Recommended)

The project includes a `render.yaml` for easy deployment:

1. Push your code to GitHub
2. Connect your repo to [Render](https://render.com)
3. Create a new **Blueprint** and select your repo
4. Add environment variables:
   - `NEBIUS_API_KEY`
   - `FIREBASE_SERVICE_ACCOUNT_JSON`
   - `VITE_API_URL`
5. Deploy!

### Manual Deployment

#### Backend
```bash
cd backend
gunicorn -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
```

#### Frontend
```bash
cd frontend
npm run build
# Serve the 'dist' folder with any static file server
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Tailwind CSS 4 | Styling |
| Radix UI | Accessible Components |
| Firebase SDK | Authentication |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI | Web Framework |
| Pydantic | Data Validation |
| Firebase Admin | Auth & Database |
| OpenAI SDK | AI Integration |
| Tiktoken | Token Counting |
| Uvicorn/Gunicorn | ASGI Server |

---

## 🧪 Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Formatting

```bash
# Backend
cd backend
black .
isort .

# Frontend
cd frontend
npm run lint
```

---

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
