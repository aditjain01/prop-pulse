from pydantic import BaseModel, ConfigDict, computed_field
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal


class InvoiceBase(BaseModel):
    purchase_id: int
    invoice_number: str
    invoice_date: date
    due_date: Optional[date] = None
    amount: Decimal
    status: str = "pending"
    milestone: Optional[str] = None
    description: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    pass


class Invoice(InvoiceBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    paid_amount: Decimal = Decimal("0")
    
    model_config = ConfigDict(from_attributes=True)


class InvoiceUpdate(BaseModel):
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    amount: Optional[Decimal] = None
    status: Optional[str] = None
    milestone: Optional[str] = None
    description: Optional[str] = None
