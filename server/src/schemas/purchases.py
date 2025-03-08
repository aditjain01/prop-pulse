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

    @computed_field
    def property_cost(self) -> Decimal:
        other_charges = self.other_charges or Decimal("0")
        return self.base_cost + other_charges

    @computed_field
    def total_cost(self) -> Decimal:
        ifms = self.ifms or Decimal("0")
        lease_rent = self.lease_rent or Decimal("0")
        amc = self.amc or Decimal("0")
        return self.property_cost + ifms + lease_rent + amc

    @computed_field
    def total_sale_cost(self) -> Decimal:
        gst = self.gst or Decimal("0")
        return self.total_cost + gst


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
    amc: Optional[float] = None
    gst: Optional[float] = None
    stamp_duty: Optional[float] = None
    registration_charges: Optional[float] = None
    legal_charges: Optional[float] = None
    brokerage: Optional[float] = None
    notes: Optional[str] = None
    construction_status_id: Optional[int] = None
