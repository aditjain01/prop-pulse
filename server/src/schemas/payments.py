from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime, date
from decimal import Decimal


class PaymentBase(BaseModel):
    # purchase_id: int
    invoice_id: int
    payment_date: date
    amount: Decimal
    source_id: int
    payment_mode: str
    transaction_reference: Optional[str] = None
    receipt_date: Optional[date] = None
    receipt_number: Optional[str] = None
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class Payment(PaymentBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PaymentUpdate(BaseModel):
    payment_date: Optional[date] = None
    amount: Optional[Decimal] = None
    source_id: Optional[int] = None
    payment_mode: Optional[str] = None
    transaction_reference: Optional[str] = None
    receipt_date: Optional[date] = None
    receipt_number: Optional[str] = None
    notes: Optional[str] = None


# class PaymentUpdate(BaseModel):
#     purchase_id: Optional[int] = None
#     payment_date: Optional[date] = None
#     amount: Optional[float] = None
#     source_id: Optional[int] = None
#     payment_mode: Optional[str] = None
#     transaction_reference: Optional[str] = None
#     milestone: Optional[str] = None
#     invoice_date: Optional[date] = None
#     invoice_number: Optional[str] = None
#     invoice_amount: Optional[float] = None
#     receipt_date: Optional[date] = None
#     receipt_number: Optional[str] = None
#     notes: Optional[str] = None
