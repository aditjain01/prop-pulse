from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


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
