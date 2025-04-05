from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class PropertyBase(BaseModel):
    """Base schema for property details including name, address, type, and various area measurements."""
    name: str
    address: Optional[str] = None
    property_type: Optional[str] = None

    carpet_area: Optional[Decimal] = None
    exclusive_area: Optional[Decimal] = None
    common_area: Optional[Decimal] = None
    floor_number: Optional[int] = None

    parking_details: Optional[str] = None
    amenities: List[str] = []

    initial_rate: Decimal
    current_rate: Decimal
    developer: Optional[str] = None
    rera_id: Optional[str] = None


class PropertyCreate(PropertyBase):
    """Schema for creating a new property, inheriting all base property details."""
    pass


class PropertyOld(PropertyBase):
    """Schema for representing an existing property with additional metadata like ID and timestamps."""
    id: int
    created_at: datetime
    updated_at: datetime
    super_area: Optional[Decimal] = None
    current_price: Optional[Decimal] = None
    model_config = ConfigDict(from_attributes=True)


class PropertyUpdate(BaseModel):
    """Schema for updating property details, allowing partial updates with optional fields."""
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


# V2 schemas for frontend-aligned endpoints
class PropertyPublic(BaseModel):
    """Schema for listing properties with minimal information needed for the frontend."""
    id: int
    name: str
    address: Optional[str] = None
    developer: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class Property(PropertyPublic):
    """Schema for detailed view of a single property, extending public schema with additional details."""
    carpet_area: Optional[Decimal] = None
    exclusive_area: Optional[Decimal] = None
    common_area: Optional[Decimal] = None
    floor_number: Optional[int] = None
    parking_details: Optional[str] = None
    amenities: List[str] = []
    initial_rate: Decimal
    current_rate: Decimal
    
    property_type: Optional[str] = None
    rera_id: Optional[str] = None
