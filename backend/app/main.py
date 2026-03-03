"""
FastAPI application for trading indicators system.
Provides REST API endpoints for fetching market data from Binance.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import klines

app = FastAPI(
    title="Trading Indicators API",
    description="REST API for fetching candlestick data from Binance",
    version="0.1.0"
)

# Configure CORS for frontend (localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(klines.router, prefix="/api", tags=["klines"])


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Trading Indicators API is running"}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
