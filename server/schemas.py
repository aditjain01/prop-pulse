from pydantic import BaseModel, ConfigDict, computed_field
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ConstructionStatusBase(BaseModel):
    name: str

class ConstructionStatus(ConstructionStatusBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class PropertyBase(BaseModel):
    name: str
    address: str
    property_type: str
    carpet_area: Optional[Decimal] = None
    exclusive_area: Optional[Decimal] = None
    common_area: Optional[Decimal] = None
    floor_number: Optional[int] = None
    parking_details: Optional[str] = None
    amenities: List[str] = []
    initial_rate: Decimal
    current_rate: Decimal
    # status_id: Optional[int] = None
    developer: Optional[str] = None
    rera_id: Optional[str] = None
    
    @computed_field
    def super_area(self) -> Optional[Decimal]:
        if self.carpet_area is not None and self.exclusive_area is not None and self.common_area is not None:
            return self.carpet_area + self.exclusive_area + self.common_area
        return None

class PropertyCreate(PropertyBase):
    pass

class Property(PropertyBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PurchaseBase(BaseModel):
    property_id: int
    purchase_date: date
    registration_date: Optional[date] = None
    possession_date: Optional[date] = None
    base_cost: Decimal
    other_charges: Optional[Decimal] = None
    ifms: Optional[Decimal] = None
    lease_rent: Optional[Decimal] = None
    amc: Optional[Decimal] = None
    gst: Optional[Decimal] = None
    seller: Optional[str] = None
    remarks: Optional[str] = None
    
    @computed_field
    def property_cost(self) -> Decimal:
        other_charges = self.other_charges or Decimal('0')
        return self.base_cost + other_charges
    
    @computed_field
    def total_cost(self) -> Decimal:
        ifms = self.ifms or Decimal('0')
        lease_rent = self.lease_rent or Decimal('0')
        amc = self.amc or Decimal('0')
        return self.property_cost + ifms + lease_rent + amc
    
    @computed_field
    def total_sale_cost(self) -> Decimal:
        gst = self.gst or Decimal('0')
        return self.total_cost + gst

class PurchaseCreate(PurchaseBase):
    user_id: Optional[int] = 1
    pass

class Purchase(PurchaseBase):
    id: int
    user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class LoanBase(BaseModel):
    purchase_id: int
    name: str
    institution: str
    agent: Optional[str] = None
    sanction_date: date
    sanction_amount: Decimal
    total_disbursed_amount: Decimal = Decimal('0')
    processing_fee: Decimal = Decimal('0')
    other_charges: Decimal = Decimal('0')
    loan_sanction_charges: Decimal = Decimal('0')
    interest_rate: Decimal
    tenure_months: int
    is_active: bool = True

class LoanCreate(LoanBase):
    user_id: Optional[int]  = 1

class Loan(LoanBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class PaymentBase(BaseModel):
    purchase_id: int
    payment_date: date
    amount: Decimal
    source_id: int
    payment_mode: str
    transaction_reference: Optional[str] = None
    milestone: Optional[str] = None
    # Invoice details
    invoice_date: Optional[date] = None
    invoice_number: Optional[str] = None
    invoice_amount: Optional[Decimal] = None
    # Receipt details
    receipt_date: Optional[date] = None
    receipt_number: Optional[str] = None
    receipt_amount: Optional[Decimal] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentUpdate(PaymentBase):
    payment_date: Optional[date] = None
    amount: Optional[Decimal] = None
    source_id: Optional[int] = None
    payment_mode: Optional[str] = None

class Payment(PaymentBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class DocumentBase(BaseModel):
    entity_type: str
    entity_id: int
    file_path: str
    document_vector: Optional[str] = None
    metadata: Optional[dict] = None

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PaymentSourceBase(BaseModel):
    name: str
    source_type: str
    description: Optional[str] = None
    is_active: bool = True
    
    # Optional fields based on source_type
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    branch: Optional[str] = None
    
    loan_id: Optional[int] = None
    lender: Optional[str] = None
    
    card_number: Optional[str] = None
    card_expiry: Optional[str] = None
    
    wallet_provider: Optional[str] = None
    wallet_identifier: Optional[str] = None

class PaymentSourceCreate(PaymentSourceBase):
    pass

class PaymentSource(PaymentSourceBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class LoanRepaymentBase(BaseModel):
    loan_id: int
    payment_date: date
    principal_amount: Decimal
    interest_amount: Decimal
    other_fees: Optional[Decimal] = Decimal('0')
    penalties: Optional[Decimal] = Decimal('0')
    source_id: int
    payment_mode: str
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None
    
    # No need for this now tho, since we made this a generated column in the database
    @computed_field
    def total_payment(self) -> Decimal:
        return self.principal_amount + self.interest_amount + (self.other_fees or Decimal('0')) + (self.penalties or Decimal('0'))

class LoanRepaymentCreate(LoanRepaymentBase):
    pass

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
    
class LoanRepayment(LoanRepaymentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    # total_payment: Decimal
    
    model_config = ConfigDict(from_attributes=True)

# Add consistent Update schemas for all entities
class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    property_type: Optional[str] = None
    carpet_area: Optional[float] = None
    exclusive_area: Optional[float] = None
    common_area: Optional[float] = None
    floor_number: Optional[int] = None
    parking_details: Optional[str] = None
    amenities: Optional[List[str]] = None
    initial_rate: Optional[float] = None
    current_rate: Optional[float] = None
    developer: Optional[str] = None
    rera_id: Optional[str] = None

class PurchaseUpdate(BaseModel):
    property_id: Optional[int] = None
    purchase_date: Optional[date] = None
    registration_date: Optional[date] = None
    possession_date: Optional[date] = None
    base_cost: Optional[float] = None
    other_charges: Optional[float] = None
    ifms: Optional[float] = None
    lease_rent: Optional[float] = None
    amc: Optional[float] = None
    gst: Optional[float] = None
    stamp_duty: Optional[float] = None
    registration_charges: Optional[float] = None
    legal_charges: Optional[float] = None
    brokerage: Optional[float] = None
    notes: Optional[str] = None
    construction_status_id: Optional[int] = None

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

class PaymentSourceUpdate(BaseModel):
    name: Optional[str] = None
    source_type: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    branch: Optional[str] = None
    loan_id: Optional[int] = None
    lender: Optional[str] = None
    card_number: Optional[str] = None
    card_expiry: Optional[str] = None
    wallet_provider: Optional[str] = None
    wallet_identifier: Optional[str] = None

class PaymentUpdate(BaseModel):
    purchase_id: Optional[int] = None
    payment_date: Optional[date] = None
    amount: Optional[float] = None
    source_id: Optional[int] = None
    payment_mode: Optional[str] = None
    transaction_reference: Optional[str] = None
    milestone: Optional[str] = None
    invoice_date: Optional[date] = None
    invoice_number: Optional[str] = None
    invoice_amount: Optional[float] = None
    receipt_date: Optional[date] = None
    receipt_number: Optional[str] = None
    notes: Optional[str] = None

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

#<===========================Dashboard Schemas===========================>
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
