from pydantic import BaseModel, ConfigDict, computed_field
from typing import Optional
from datetime import datetime, date
from decimal import Decimal


class PurchaseBase(BaseModel):
    property_id: int

    purchase_date: date
    registration_date: Optional[date] = None
    possession_date: Optional[date] = None

    base_cost: Decimal  # Have to figure out a way to derive this from Property inital_price * super_area
    other_charges: Optional[Decimal] = None
    ifms: Optional[Decimal] = None
    lease_rent: Optional[Decimal] = None
    amc: Optional[Decimal] = None
    gst: Optional[Decimal] = None

    seller: Optional[str] = None
    remarks: Optional[str] = None



class PurchaseCreate(PurchaseBase):
    user_id: Optional[int] = 1
    pass


class Purchase(PurchaseBase):
    id: int
    user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PurchaseUpdate(BaseModel):
    property_id: Optional[int] = None

    purchase_date: Optional[date] = None
    registration_date: Optional[date] = None
    possession_date: Optional[date] = None

    base_cost: Optional[float] = None
    other_charges: Optional[float] = None
    ifms: Optional[float] = None
    lease_rent: Optional[float] = None
    # stamp_duty: Optional[float] = None
    # legal_charges: Optional[float] = None
    amc: Optional[float] = None
    gst: Optional[float] = None

    seller: Optional[str] = None
    remarks: Optional[str] = None


# V2 schemas for frontend-aligned endpoints
class PurchasePublic(BaseModel):
    """Schema for listing purchases with essential information for the frontend"""
    id: int
    property_name: str  # From Purchase -> Property relationship
    purchase_date: date
    total_purchase_cost: Decimal  # This is total_sale_cost from the model
    
    model_config = ConfigDict(from_attributes=True)


class Purchase(PurchasePublic):
    """Schema for detailed view of a single purchase"""
    # Dates
    registration_date: Optional[date] = None
    possession_date: Optional[date] = None
    
    # Costs
    base_cost: Decimal
    other_charges: Optional[Decimal] = None
    ifms: Optional[Decimal] = None
    lease_rent: Optional[Decimal] = None
    amc: Optional[Decimal] = None
    gst: Optional[Decimal] = None
    property_cost: Decimal  # base_cost + other_charges
    total_cost: Decimal  # property_cost + ifms + lease_rent + amc
    
    # Additional information
    seller: Optional[str] = None
