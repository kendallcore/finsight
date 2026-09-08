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

# 1. Detect or Create Python Virtual Environment
VENV_DIR=""
for candidate in .venv venv env; do
    if [ -d "$candidate" ] && [ -f "$candidate/bin/python" ]; then
        VENV_DIR="$candidate"
        break
    fi
done

if [ -z "$VENV_DIR" ]; then
    VENV_DIR=".venv"
    echo "Creating Python virtual environment in $VENV_DIR..."
    python3 -m venv "$VENV_DIR"
fi

# Ensure requirements (including uvicorn) are installed
if [ ! -f "$VENV_DIR/bin/uvicorn" ]; then
    echo "Installing Python backend dependencies in $VENV_DIR..."
    "$VENV_DIR/bin/pip" install --upgrade pip
    "$VENV_DIR/bin/pip" install -r backend/requirements.txt
fi

# 2. Check Trained Models
if [ ! -f "models/income_regressor.joblib" ]; then
    echo "Training ML models on multi-source Indian datasets..."
    PYTHONPATH=scripts "$VENV_DIR/bin/python" scripts/train_models.py
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

PYTHONPATH=backend:scripts "$VENV_DIR/bin/uvicorn" app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
