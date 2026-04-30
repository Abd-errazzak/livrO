from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator

from app.models.order import OrderStatus, PaymentType


class OrderBase(BaseModel):
    sender_name:      str
    sender_phone:     str
    sender_address:   str
    origin_city:      str
    receiver_name:    str
    receiver_phone:   str
    receiver_address: str
    destination_city: str
    package_description: str
    payment_type:        PaymentType = PaymentType.sender


class OrderCreate(OrderBase):
    @field_validator("sender_name", "receiver_name", "origin_city", "destination_city")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Ce champ est obligatoire")
        return v


class OrderAssign(BaseModel):
    livreur_id:       int
    base_price:       Optional[float] = None   # if None, auto-calculated from city pair
    price_adjustment: float = 0.0

    @field_validator("base_price")
    @classmethod
    def positive(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("Le prix de base doit être positif")
        return v


class OrderStatusUpdate(BaseModel):
    status: OrderStatus

    @field_validator("status")
    @classmethod
    def valid_livreur_transition(cls, v: OrderStatus) -> OrderStatus:
        allowed = {
            OrderStatus.picked_up,
            OrderStatus.in_transit,
            OrderStatus.delivered,
            OrderStatus.cancelled,
        }
        if v not in allowed:
            raise ValueError("Transition non autorisée")
        return v


class UserMini(BaseModel):
    id:        int
    full_name: str
    phone:     Optional[str]
    model_config = {"from_attributes": True}


class PricingOut(BaseModel):
    base_price:       Optional[float]
    price_adjustment: Optional[float]
    total_price:      Optional[float]
    model_config = {"from_attributes": True}


class OrderOut(OrderBase):
    id:               int
    status:           OrderStatus
    client_id:        int
    livreur_id:       Optional[int]
    client:           Optional[UserMini]
    livreur:          Optional[UserMini]
    base_price:       Optional[float]
    price_adjustment: Optional[float]
    total_price:      Optional[float]
    created_at:       datetime
    updated_at:       datetime
    assigned_at:      Optional[datetime]
    delivered_at:     Optional[datetime]
    model_config = {"from_attributes": True}


class OrderSummary(BaseModel):
    id:               int
    sender_name:      str
    receiver_name:    str
    origin_city:      str
    destination_city: str
    status:           OrderStatus
    payment_type:     PaymentType
    total_price:      Optional[float]
    created_at:       datetime
    livreur:          Optional[UserMini]
    model_config = {"from_attributes": True}
