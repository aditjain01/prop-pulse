from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict
from datetime import datetime
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
    description: Optional[str] = None


class ConstructionStatusCreate(ConstructionStatusBase):
    pass


class ConstructionStatus(ConstructionStatusBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PaymentSourceBase(BaseModel):
    name: str
    source_type: str  # BANK_ACCOUNT, UPI, CASH, etc.
    account_details: Optional[Dict[str, Any]] = None
    is_active: bool = True


class PaymentSourceCreate(PaymentSourceBase):
    pass


class PaymentSource(PaymentSourceBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PropertyBase(BaseModel):
    title: str
    address: str
    property_type: str
    carpet_area: Optional[Decimal] = None
    super_area: Optional[Decimal] = None
    builder_area: Optional[Decimal] = None
    floor_number: Optional[int] = None
    parking_details: Optional[str] = None
    amenities: List[str] = []
    initial_rate: Decimal
    current_price: Decimal
    status: str = "available"


class PropertyCreate(PropertyBase):
    pass


class Property(PropertyBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class PurchaseBase(BaseModel):
    property_id: int
    purchase_date: date
    registration_date: Optional[date] = None
    possession_date: Optional[date] = None
    final_purchase_price: Decimal
    cost_breakdown: Dict[str, Any]
    seller_info: Optional[str] = None
    remarks: Optional[str] = None


class PurchaseCreate(PurchaseBase):
    pass


class Purchase(PurchaseBase):
    id: int
    user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LoanBase(BaseModel):
    purchase_id: int
    bank_name: str
    disbursement_date: date
    interest_rate: Decimal
    loan_amount: Decimal
    emi_amount: Decimal
    tenure_months: int
    prepayment_charges: Optional[Decimal] = None


class LoanCreate(LoanBase):
    pass


class Loan(LoanBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PaymentBase(BaseModel):
    purchase_id: int
    payment_source_id: int
    payment_date: date
    amount: Decimal
    payment_mode: str  # cash/check/online
    transaction_reference: Optional[str] = None
    milestone: str


class PaymentCreate(PaymentBase):
    pass


class Payment(PaymentBase):
    id: int
    user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LoanPaymentBase(BaseModel):
    loan_id: int
    payment_source_id: int
    payment_date: date
    amount: Decimal
    transaction_reference: Optional[str] = None
    is_emi: bool = True


class LoanPaymentCreate(LoanPaymentBase):
    pass


class LoanPayment(LoanPaymentBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class DocumentBase(BaseModel):
    entity_type: str
    entity_id: int
    file_path: str
    document_vector: Optional[str] = None
    doc_metadata: Optional[Dict[str, Any]] = None


class DocumentCreate(DocumentBase):
    pass


class Document(DocumentBase):
    id: int
    created_at: datetime
    property_id: Optional[int] = None
    purchase_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str
    user: User


class TokenData(BaseModel):
    username: Optional[str] = None
