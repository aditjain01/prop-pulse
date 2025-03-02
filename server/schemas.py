
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, date
from decimal import Decimal

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    password: str
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

class PropertyBase(BaseModel):
    title: str
    address: str
    property_type: str
    developer: Optional[str] = None
    carpet_area: Optional[Decimal] = None
    exclusive_area: Optional[Decimal] = None
    common_area: Optional[Decimal] = None
    super_area: Optional[Decimal] = None
    floor_number: Optional[int] = None
    parking_details: Optional[str] = None
    amenities: List[str] = []
    initial_rate: Decimal
    current_rate: Decimal
    rera_id: Optional[str] = None
    construction_status_id: Optional[int] = None

class PropertyCreate(PropertyBase):
    pass

class Property(PropertyBase):
    id: int
    created_at: datetime
    updated_at: datetime
    construction_status: Optional[ConstructionStatus] = None
    model_config = ConfigDict(from_attributes=True)

class PurchaseBase(BaseModel):
    property_id: int
    purchase_date: date
    registration_date: Optional[date] = None
    possession_date: Optional[date] = None
    base_cost: Decimal
    other_charges: Decimal = Decimal('0')
    ifms: Decimal = Decimal('0')
    lease_rent: Decimal = Decimal('0')
    amc: Decimal = Decimal('0')
    gst: Decimal = Decimal('0')
    seller: Optional[str] = None
    remarks: Optional[str] = None

class PurchaseCreate(PurchaseBase):
    pass

class Purchase(PurchaseBase):
    id: int
    user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
    
    @property
    def property_cost(self) -> Decimal:
        return self.base_cost + self.other_charges
        
    @property
    def total_cost(self) -> Decimal:
        return self.property_cost + self.ifms + self.lease_rent + self.amc
        
    @property
    def total_sale_cost(self) -> Decimal:
        return self.total_cost + self.gst

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
    payment_date: date
    amount: Decimal
    source: str
    payment_mode: str
    transaction_reference: Optional[str] = None
    milestone: str

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: int
    user_id: int
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
