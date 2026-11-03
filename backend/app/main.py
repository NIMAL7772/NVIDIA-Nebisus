from fastapi import FastAPI
from app.core.config import APP_NAME, APP_VERSION
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI(
    title=APP_NAME,
    description="Backend API for STOCK AI",
    version=APP_VERSION
 
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "message": "STOCK AI Backend is running!",
        "version": APP_VERSION
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}