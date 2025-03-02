
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
    title: str
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
    status_id: Optional[int] = None
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
    metadata: Optional[dict] = None

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
