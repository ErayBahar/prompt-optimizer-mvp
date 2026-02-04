from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import prompt_router, user_router, auth_router

app = FastAPI(title="Prompt Refiner MVP", version="1.0")

# cors settings (to be able to talk with frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "https://prompt-optimizer-mvp-tau.vercel.app",
        "https://prompt-optimizer-mvp.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# include router to the system
app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(prompt_router.router, prefix="/api/v1", tags=["Prompts"])
app.include_router(user_router.router, prefix="/api/v1", tags=["Users"])
app.include_router(auth_router.router, prefix="/api/v1", tags=["Auth"])

@app.get("/")
def read_root():
    return {"status": "System Operational", "architecture": "Modular"}