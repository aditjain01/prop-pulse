from pydantic import BaseModel, ConfigDict, computed_field
from typing import Optional
from datetime import datetime, date
from decimal import Decimal


class LoanRepaymentBase(BaseModel):
    loan_id: int
    payment_date: date
    principal_amount: Decimal
    interest_amount: Decimal
    other_fees: Optional[Decimal] = Decimal("0")
    penalties: Optional[Decimal] = Decimal("0")
    source_id: int
    payment_mode: str
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None

    # No need for this now tho, since we made this a generated column in the database
    @computed_field
    def total_payment(self) -> Decimal:
        return (
            self.principal_amount
            + self.interest_amount
            + (self.other_fees or Decimal("0"))
            + (self.penalties or Decimal("0"))
        )


class LoanRepaymentCreate(LoanRepaymentBase):
    pass


class LoanRepayment(LoanRepaymentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    # total_payment: Decimal

    model_config = ConfigDict(from_attributes=True)


class LoanRepaymentUpdate(BaseModel):
    loan_id: Optional[int] = None
    payment_date: Optional[date] = None
    principal_amount: Optional[Decimal] = None
    interest_amount: Optional[Decimal] = None
    other_fees: Optional[Decimal] = None
    penalties: Optional[Decimal] = None
    source_id: Optional[int] = None
    payment_mode: Optional[str] = None
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None


# V2 schemas for frontend-aligned endpoints
class LoanRepaymentPublic(BaseModel):
    """Schema for listing loan repayments with essential information for the frontend"""
    id: int
    loan_name: str  # From Repayment -> Loan
    loan_institution: str  # From Repayment -> Loan -> institution
    property_name: str  # From Repayment -> Loan -> Purchase -> Property
    total_payment: Decimal
    source_name: str  # From Repayment -> PaymentSource
    payment_date: date
    payment_mode: str
    
    model_config = ConfigDict(from_attributes=True)


class LoanRepayment(LoanRepaymentPublic):
    """Schema for detailed view of a single loan repayment"""
    principal_amount: Decimal
    interest_amount: Decimal
    other_fees: Decimal
    penalties: Decimal
    purchase_id: int  # From Repayment -> Loan -> Purchase
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None
