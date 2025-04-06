from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class PropertyBase(BaseModel):
    """Base schema for property details including name, address, type, and various area measurements."""
    name: str
    address: Optional[str] = None
    property_type: Optional[str] = None

    parking_details: Optional[str] = None
    amenities: List[str] = []

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
    model_config = ConfigDict(from_attributes=True)


class PropertyUpdate(BaseModel):
    """Schema for updating property details, allowing partial updates with optional fields."""
    name: Optional[str] = None
    address: Optional[str] = None
    property_type: Optional[str] = None
    parking_details: Optional[str] = None
    amenities: Optional[List[str]] = None
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
    parking_details: Optional[str] = None
    amenities: List[str] = []
    
    property_type: Optional[str] = None
    rera_id: Optional[str] = None
