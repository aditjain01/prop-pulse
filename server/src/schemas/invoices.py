from pydantic import BaseModel, ConfigDict, computed_field
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal


class InvoiceBase(BaseModel):
    """Base schema for invoice details including purchase ID, invoice number, dates, amount, and status."""
    purchase_id: int
    invoice_number: str
    invoice_date: date
    due_date: Optional[date] = None
    amount: Decimal
    status: str = "pending"
    milestone: Optional[str] = None
    description: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    """Schema for creating a new invoice, inheriting all base invoice details."""
    pass


class InvoiceOld(InvoiceBase):
    """Schema for representing an existing invoice with additional metadata like ID and timestamps."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    paid_amount: Decimal = Decimal("0")
    
    model_config = ConfigDict(from_attributes=True)


class InvoiceUpdate(BaseModel):
    """Schema for updating invoice details, allowing partial updates with optional fields."""
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    amount: Optional[Decimal] = None
    status: Optional[str] = None
    milestone: Optional[str] = None
    description: Optional[str] = None


# V2 schemas for frontend-aligned endpoints
class InvoicePublic(BaseModel):
    """Schema for listing invoices with property and purchase details."""
    id: int
    purchase_id: int
    property_name: str  # From purchase -> property relationship
    invoice_number: str
    invoice_date: date
    due_date: Optional[date] = None
    amount: Decimal
    status: str = "pending"
    milestone: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    paid_amount: Decimal = Decimal("0")
    
    model_config = ConfigDict(from_attributes=True)


class Invoice(InvoicePublic):
    """Schema for detailed view of a single invoice, extending public schema with additional details."""
    # The detailed view has the same fields as the list view for invoices
