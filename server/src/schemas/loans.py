from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime, date
from decimal import Decimal


class LoanBase(BaseModel):
    purchase_id: int
    name: str
    institution: str
    agent: Optional[str] = None
    sanction_date: date
    sanction_amount: Decimal
    total_disbursed_amount: Decimal = Decimal("0")
    processing_fee: Decimal = Decimal("0")
    other_charges: Decimal = Decimal("0")
    loan_sanction_charges: Decimal = Decimal("0")
    interest_rate: Decimal
    tenure_months: int
    is_active: bool = True


class LoanCreate(LoanBase):
    user_id: Optional[int] = 1


class Loan(LoanBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LoanUpdate(BaseModel):
    purchase_id: Optional[int] = None
    institution: Optional[str] = None
    agent: Optional[str] = None
    sanction_date: Optional[date] = None
    sanction_amount: Optional[float] = None
    total_disbursed_amount: Optional[float] = None
    processing_fee: Optional[float] = None
    other_charges: Optional[float] = None
    loan_sanction_charges: Optional[float] = None
    interest_rate: Optional[float] = None
    tenure_months: Optional[int] = None
    is_active: Optional[bool] = None
