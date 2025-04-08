from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime, date
from decimal import Decimal


class LoanBase(BaseModel):
    """Base schema for loan details, containing common attributes for all loan-related operations."""
    purchase_id: int
    loan_number: str
    institution: str
    agent: Optional[str] = None
    sanction_date: date
    sanction_amount: Decimal
    processing_fee: Decimal = Decimal("0")
    other_charges: Decimal = Decimal("0")
    loan_sanction_charges: Decimal = Decimal("0")
    interest_rate: Decimal
    tenure_months: int
    is_active: bool = True


class LoanCreate(LoanBase):
    """Schema for creating a new loan, extending the base loan schema with a user ID."""
    user_id: Optional[int] = 1


class LoanOld(LoanBase):
    """Schema for representing an existing loan with additional metadata like creation and update timestamps."""
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LoanUpdate(BaseModel):
    """Schema for updating loan details, allowing partial updates with optional fields."""
    # purchase_id: Optional[int] = None
    loan_number: Optional[str] = None
    institution: Optional[str] = None
    agent: Optional[str] = None
    sanction_date: Optional[date] = None
    sanction_amount: Optional[float] = None
    processing_fee: Optional[float] = None
    other_charges: Optional[float] = None
    loan_sanction_charges: Optional[float] = None
    interest_rate: Optional[float] = None
    tenure_months: Optional[int] = None
    is_active: Optional[bool] = None


# V2 schemas for frontend-aligned endpoints
class LoanPublic(BaseModel):
    """Schema for listing loans with essential information for the frontend."""
    id: int
    loan_number: Optional[str] = None
    institution: Optional[str] = None
    total_disbursed_amount: Decimal = Decimal("0")
    sanction_amount: Optional[Decimal]
    is_active: Optional[bool] = None
    name: str  # Computed from payment source name
    
    model_config = ConfigDict(from_attributes=True)


class Loan(LoanPublic):
    """Schema for detailed view of a single loan, including additional financial details."""
    property_name: str  # From Loan->Purchase->Property relationship
    processing_fee: Decimal = Decimal("0")
    other_charges: Decimal = Decimal("0")
    loan_sanction_charges: Decimal = Decimal("0")
    interest_rate: Optional[Decimal] = None
    tenure_months: Optional[int] = None
