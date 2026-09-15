"""Shared pytest fixtures for the FinSight backend test suite."""

import os
import sys

import pytest
from fastapi.testclient import TestClient

# Tests import the app as `app.*`, which CI only gets right if `backend/` is on the path.
BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    """
    Entering the TestClient context runs the FastAPI lifespan, so database setup and model
    loading happen the same way they do in production rather than by import side effect.
    """
    with TestClient(app) as test_client:
        yield test_client
