"""
SQLAlchemy ORM Models for FinSight
Stores statement upload histories, predictions, and timestamped benchmarks.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from app.database.db import Base

class StatementUploadRecord(Base):
    __tablename__ = "statement_uploads"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    upload_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    total_transactions = Column(Integer, nullable=False)
    total_credits = Column(Float, nullable=False)
    total_debits = Column(Float, nullable=False)
    predicted_annual_income = Column(Float, nullable=False)
    predicted_tax_slab = Column(String(100), nullable=False)
    assigned_persona = Column(String(100), nullable=False)
    extracted_features_json = Column(JSON, nullable=False)
    prediction_details_json = Column(JSON, nullable=False)
