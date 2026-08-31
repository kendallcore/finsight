"""
FinSight FastAPI Main Application
Entry point for the REST API server.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database.db import init_db
from app.services.ml_service import ml_service
from app.routers import inference, evaluation, samples


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Initializing FinSight Backend Services...")
    init_db()
    ml_service.load_models()
    print("✓ Backend successfully started and ready for traffic.")
    yield
    # Shutdown
    print("Shutting down FinSight Backend...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Machine Learning-powered Financial Intelligence & Indian Tax Estimation System (Section 115BAC - FY 2025-26).",
    lifespan=lifespan
)

# CORS Middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(inference.router)
app.include_router(evaluation.router)
app.include_router(samples.router)


@app.get("/api/health", status_code=status.HTTP_200_OK, tags=["Health"])
async def health_check():
    """Returns service health, loaded models, and tax regime version."""
    models_loaded = bool(ml_service.regressor and ml_service.classifier and ml_service.scaler)
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "tax_regime_year": settings.TAX_REGIME_YEAR,
        "models_loaded": models_loaded,
        "features_dimension": 16,
        "tax_slab_classes": 7
    }


from pathlib import Path
from fastapi.staticfiles import StaticFiles

# Mount Static Files from compiled Vite frontend if available
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")
else:
    @app.get("/", include_in_schema=False)
    async def root():
        return JSONResponse(
            content={
                "message": "Welcome to FinSight Financial Intelligence & Tax Estimation API",
                "docs": "/docs",
                "health": "/api/health"
            }
        )

