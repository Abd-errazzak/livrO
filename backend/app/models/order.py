import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class OrderStatus(str, enum.Enum):
    pending    = "pending"
    assigned   = "assigned"
    picked_up  = "picked_up"
    in_transit = "in_transit"
    delivered  = "delivered"
    cancelled  = "cancelled"


class PaymentType(str, enum.Enum):
    sender   = "sender"
    receiver = "receiver"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    # ── Sender ─────────────────────────────────────────────────
    sender_name    = Column(String(100), nullable=False)
    sender_phone   = Column(String(20),  nullable=False)
    sender_address = Column(String(255), nullable=False)
    origin_city    = Column(String(100), nullable=False)

    # ── Receiver ───────────────────────────────────────────────
    receiver_name    = Column(String(100), nullable=False)
    receiver_phone   = Column(String(20),  nullable=False)
    receiver_address = Column(String(255), nullable=False)
    destination_city = Column(String(100), nullable=False)

    # ── Package ────────────────────────────────────────────────
    package_description = Column(Text, nullable=False)
    payment_type        = Column(Enum(PaymentType), nullable=False, default=PaymentType.sender)

    # ── Pricing (v1.0.1) ───────────────────────────────────────
    base_price        = Column(Float, nullable=True)   # auto-calculated by manager
    price_adjustment  = Column(Float, nullable=True, default=0.0)  # manual +/-
    total_price       = Column(Float, nullable=True)   # base + adjustment

    # ── Status ─────────────────────────────────────────────────
    status = Column(Enum(OrderStatus), nullable=False, default=OrderStatus.pending)

    # ── Relations ──────────────────────────────────────────────
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    client    = relationship("User", foreign_keys=[client_id], backref="orders")

    livreur_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    livreur    = relationship("User", foreign_keys=[livreur_id], backref="deliveries")

    # ── Timestamps ─────────────────────────────────────────────
    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    assigned_at  = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
