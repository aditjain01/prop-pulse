from pydantic import BaseModel, ConfigDict, computed_field
from typing import Optional
from datetime import datetime, date
from decimal import Decimal


class PurchaseBase(BaseModel):
    """Base schema for purchase details including property ID, dates, costs, and seller information."""
    property_id: int

    # Area fields moved from Property to Purchase
    carpet_area: Decimal
    exclusive_area: Optional[Decimal] = None
    common_area: Optional[Decimal] = None
    floor_number: Optional[int] = None
    
    # Rate fields moved from Property to Purchase
    purchase_rate: Decimal
    current_rate: Decimal

    purchase_date: date
    registration_date: Optional[date] = None
    possession_date: Optional[date] = None

    base_cost: Decimal  # Derived from purchase_rate * super_area
    other_charges: Optional[Decimal] = None
    ifms: Optional[Decimal] = None
    lease_rent: Optional[Decimal] = None
    amc: Optional[Decimal] = None
    gst: Optional[Decimal] = None

    seller: Optional[str] = None
    remarks: Optional[str] = None


class PurchaseCreate(PurchaseBase):
    """Schema for creating a new purchase, inheriting all base purchase details and adding user ID."""
    user_id: Optional[int] = 1
    pass


class PurchaseOld(PurchaseBase):
    """Schema for representing an existing purchase with additional metadata like ID, user ID, and creation timestamp."""
    id: int
    user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PurchaseUpdate(BaseModel):
    """Schema for updating purchase details, allowing partial updates with optional fields."""
    property_id: Optional[int] = None

    # Area fields moved from Property to Purchase
    carpet_area: Optional[float] = None
    exclusive_area: Optional[float] = None
    common_area: Optional[float] = None
    floor_number: Optional[int] = None
    
    # Rate fields moved from Property to Purchase
    purchase_rate: Optional[float] = None
    current_rate: Optional[float] = None

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
    """Schema for listing purchases with essential information for the frontend."""
    id: int
    property_name: str  # From Purchase -> Property relationship
    purchase_date: date
    super_area: Decimal  # Added to show total area in list view
    total_sale_cost: Decimal  # This is total_sale_cost from the model
    
    model_config = ConfigDict(from_attributes=True)


class Purchase(PurchasePublic):
    """Schema for detailed view of a single purchase, extending public schema with additional details."""
    # Dates
    registration_date: Optional[date] = None
    possession_date: Optional[date] = None
    
    # Area fields moved from Property to Purchase
    carpet_area: Decimal
    exclusive_area: Optional[Decimal] = None
    common_area: Optional[Decimal] = None
    floor_number: Optional[int] = None
    
    # Rate fields moved from Property to Purchase
    purchase_rate: Decimal
    current_rate: Decimal
    
    # Costs
    base_cost: Decimal
    other_charges: Optional[Decimal] = None
    ifms: Optional[Decimal] = None
    lease_rent: Optional[Decimal] = None
    amc: Optional[Decimal] = None
    gst: Optional[Decimal] = None
    property_cost: Decimal  # base_cost + other_charges
    total_cost: Decimal  # property_cost +gst

    remarks: Optional[str] = None
    
    # Additional information
    seller: Optional[str] = None
