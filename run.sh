#!/usr/bin/env bash
# FinSight — 1-Click Launch Script
# Starts FastAPI backend (serving both REST API & compiled Vite frontend) on http://localhost:8000

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "============================================================"
echo "  FinSight: Smart Financial Intelligence & Tax System      "
echo "  Indian New Tax Regime (Section 115BAC - FY 2025-26)      "
echo "============================================================"

# 1. Check Python Virtual Environment
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
    .venv/bin/pip install --upgrade pip
    .venv/bin/pip install -r backend/requirements.txt
fi

# 2. Check Trained Models
if [ ! -f "models/income_regressor.joblib" ]; then
    echo "Training ML models on multi-source Indian datasets..."
    PYTHONPATH=scripts .venv/bin/python scripts/train_models.py
fi

# 3. Build Frontend if not built
if [ ! -d "frontend/dist" ]; then
    echo "Building Vite React frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
fi

echo ""
echo "🚀 Starting FinSight Full-Stack Application on http://localhost:8000 ..."
echo "   - Interactive Web Dashboard : http://localhost:8000"
echo "   - Interactive Swagger API   : http://localhost:8000/docs"
echo "   - Health Check Endpoint     : http://localhost:8000/api/health"
echo ""

PYTHONPATH=backend:scripts .venv/bin/uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
