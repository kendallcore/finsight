# Contributing to FinSight

Thank you for your interest in contributing to **FinSight** (Financial Intelligence & Statutory Tax Estimation Engine)! 

FinSight is an open-source, production-grade machine learning system designed for bank statement diagnostics, 16D financial behavioral vector extraction, income regression, tax slab classification under the Indian New Tax Regime (Section 115BAC - FY 2025-26), and unsupervised spending persona clustering.

We welcome contributions from developers, ML engineers, domain experts in Indian tax law, and documentation writers. This document provides guidelines and setup instructions to help you get started.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please report any unacceptable behavior to the repository maintainers.

---

## Getting Started

### 1. Prerequisites

Ensure you have the following installed on your local environment:
- **Python**: Version 3.12 or 3.14 (3.10+ supported)
- **Node.js**: Version 18.x, 20.x, or 22.x
- **npm**: Version 9.x or higher
- **Git**: Latest version
- **Docker & Docker Compose** (Optional, for containerized development)

### 2. Fork & Clone

Fork the repository on GitHub, then clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/finsight.git
cd finsight
```

Set up the upstream repository reference:

```bash
git remote add upstream https://github.com/sanjeevafk/finsight.git
git fetch upstream
```

### 3. Local Environment Setup

#### Option A: Native Local Development (Recommended for active dev)

**Backend Setup (FastAPI & ML Engine):**

```bash
# Create a virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Upgrade pip and install backend dependencies
pip install --upgrade pip
pip install -r backend/requirements.txt pytest httpx
```

**Frontend Setup (Vite + React 19 + TypeScript):**

```bash
# Navigate to frontend directory
cd frontend

# Clean install dependencies
npm ci

# Return to project root
cd ..
```

#### Option B: Docker Compose Development

If you prefer containerized deployment:

```bash
docker compose up --build
```

Access the services at:
- **Web App / Dashboard**: `http://localhost:8000`
- **FastAPI OpenAPI Docs**: `http://localhost:8000/docs`
- **Health Check Endpoint**: `http://localhost:8000/api/health`

---

## Development Workflow

### 1. Branch Naming Conventions

Create a topic branch from the `main` branch before making changes:

```bash
git checkout main
git pull upstream main
git checkout -b <branch-type>/<short-description>
```

Supported branch prefixes:
- `feature/` : New features or UI components (e.g., `feature/gstin-verification`)
- `fix/` : Bug fixes (e.g., `fix/rebate-87a-edge-case`)
- `docs/` : Documentation additions or fixes (e.g., `docs/update-api-contract`)
- `refactor/` : Code quality improvements without feature changes (e.g., `refactor/parser-regex`)
- `test/` : Adding or updating test suites (e.g., `test/add-clustering-tests`)
- `chore/` : Build, CI/CD, or dependency updates (e.g., `chore/update-pydantic`)

### 2. Conventional Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat: add PDF password handling for ICICI Bank statements`
- `fix: adjust Section 87A rebate calculation for marginal income`
- `docs: update Indian Tax System reference for FY 2025-26`
- `test: add unit tests for 16D feature extractor`
- `refactor: optimize PCA spatial coordinate serializer`
- `chore: bump Vite to 6.1.0 in frontend`

---

## Running Verification & Tests

Before submitting a Pull Request, verify that all tests pass cleanly.

### 1. Backend Tests (Pytest)

Run backend API and model calculation unit tests from the repository root:

```bash
PYTHONPATH=backend pytest backend/tests/ -v
```

### 2. ML Pipeline End-to-End Test

Verify feature extraction, model inference, tax calculation, and PCA projection end-to-end:

```bash
PYTHONPATH=scripts python scripts/test_pipeline.py
```

### 3. Frontend Type Check & Build

Validate TypeScript types and build production assets:

```bash
cd frontend
npm run build
cd ..
```

---

## Pull Request Guidelines

When submitting a Pull Request (PR):

1. **Keep PRs Focused**: A single PR should address one bug, feature, or task.
2. **Include Unit Tests**: Include relevant unit tests for bug fixes or new features.
3. **Update Documentation**: Update relevant docs in `docs/` or `README.md` if API contracts or user interfaces change.
4. **Fill Out the PR Template**: Describe what changed, why it changed, and how it was tested.
5. **No Secret Leaks**: Ensure no API keys, credentials, `.env` files, or private customer financial records are committed.

---

## Project Structure Reference

```text
finsight/
├── backend/               # FastAPI Application & REST Routers
│   ├── app/               # Config, Routers, Schemas, Services, Database Models
│   ├── tests/             # Pytest test suite (test_api.py)
│   └── requirements.txt   # Python backend dependencies
├── frontend/              # Vite + React 19 + TypeScript SPA
│   ├── src/               # React components, Plotly/Recharts views, API client
│   └── package.json       # Node.js dependencies & build scripts
├── models/                # Serialized scikit-learn artifacts (.joblib & .json)
├── data/                  # Datasets & master 16D user feature profiles
├── docs/                  # System Architecture, Tax Specs, API Contracts
├── scripts/               # Feature engineering, model training & benchmark scripts
├── .github/               # Issue templates, PR template, CI/CD workflows
├── Dockerfile             # Multi-stage container deployment
├── docker-compose.yml     # Multi-container service definition
└── run.sh                 # Local 1-click startup script
```

---

## Need Help?

If you have questions or encounter issues while contributing:
- Open a GitHub Discussion or Issue under `Questions / Clarifications`.
- Reach out to the maintainers via repository security contacts for security vulnerabilities.
