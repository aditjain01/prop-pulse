from pydantic import BaseModel
from typing import Optional
from datetime import date
from decimal import Decimal


class LoanRepaymentSummary(BaseModel):
    loan_name: Optional[str] = None
    total_principal_paid: Optional[Decimal] = None
    total_interest_paid: Optional[Decimal] = None
    total_other_fees_paid: Optional[Decimal] = None
    total_paid: Optional[Decimal] = None
    remaining_principal_balance: Optional[Decimal] = None
    
    class Config:
        from_attributes = True

class AcquisitionCostSummary(BaseModel):
    user_id: Optional[int] = None  # user_id as a primary key
    purchase_id: Optional[int] = None  # purchase_id as a primary key
    property_name: Optional[str] = None
    total_loan_principal: Optional[Decimal] = None  # Renamed to total_loan_principal
    total_loan_interest: Optional[Decimal] = None    # Renamed to total_loan_interest
    total_loan_others: Optional[Decimal] = None       # Renamed to total_loan_others
    total_loan_payment: Optional[Decimal] = None      # Added for total loan payment
    total_builder_principal: Optional[Decimal] = None  # Added for builder principal
    total_builder_payment: Optional[Decimal] = None    # Added for builder payment
    total_principal_payment: Optional[Decimal] = None   # Added for total principal payment
    total_sale_cost: Optional[Decimal] = None
    remaining_balance: Optional[Decimal] = None
    
    class Config:
        from_attributes = True

class AcquisitionCostDetails(BaseModel):
    user_id: Optional[int] = None
    purchase_id: Optional[int] = None
    payment_date: Optional[date] = None
    principal: Optional[Decimal] = None
    interest: Optional[Decimal] = None
    others: Optional[Decimal] = None
    payment: Optional[Decimal] = None
    source: Optional[str] = None
    mode: Optional[str] = None
    reference: Optional[str] = None
    type: Optional[str] = None
    
    class Config:
        from_attributes = True

class LoanSummary(BaseModel):
    # loan_id: Optional[int] = None
    # user_id: Optional[int] = None
    loan_name: Optional[str] = None
    property_name: Optional[str] = None
    loan_sanctioned_amount: Optional[Decimal] = None
    loan_disbursed_amount: Optional[Decimal] = None
    total_principal_paid: Optional[Decimal] = None
    total_interest_paid: Optional[Decimal] = None
    total_other_fees: Optional[Decimal] = None
    total_penalties: Optional[Decimal] = None
    total_amount_paid: Optional[Decimal] = None
    total_payments: Optional[int] = None
    last_repayment_date: Optional[date] = None
    principal_balance: Optional[Decimal] = None
    
    class Config:
        from_attributes = True
