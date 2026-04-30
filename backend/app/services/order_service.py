from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.order import Order, OrderStatus
from app.models.user import User, UserRole
from app.schemas.order import OrderAssign, OrderCreate, OrderStatusUpdate

# ── Pricing ────────────────────────────────────────────────────
# Base price per km between cities (simplified flat rates)
CITY_RATES: dict[tuple, float] = {
    ("casablanca", "rabat"):      80.0,
    ("casablanca", "fès"):       150.0,
    ("casablanca", "marrakech"): 120.0,
    ("casablanca", "tanger"):    180.0,
    ("rabat",      "fès"):       100.0,
    ("rabat",      "marrakech"): 160.0,
    ("rabat",      "tanger"):    120.0,
    ("fès",        "marrakech"): 200.0,
    ("fès",        "tanger"):    150.0,
    ("marrakech",  "tanger"):    280.0,
}
DEFAULT_RATE = 100.0


def calculate_base_price(origin: str, destination: str) -> float:
    key  = (origin.lower().strip(), destination.lower().strip())
    rkey = (destination.lower().strip(), origin.lower().strip())
    if key[0] == key[1]:
        return 50.0
    return CITY_RATES.get(key, CITY_RATES.get(rkey, DEFAULT_RATE))


# ── Client ─────────────────────────────────────────────────────
def create_order(db: Session, data: OrderCreate, client: User) -> Order:
    order = Order(
        **data.model_dump(),
        client_id=client.id,
        status=OrderStatus.pending,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def get_client_orders(db: Session, client_id: int) -> List[Order]:
    return (
        db.query(Order)
        .filter(Order.client_id == client_id)
        .order_by(Order.created_at.desc())
        .all()
    )


def cancel_own_order(db: Session, order_id: int, client: User) -> Order:
    order = _get_or_raise(db, order_id)
    if order.client_id != client.id:
        raise PermissionError("Vous ne pouvez annuler que vos propres commandes")
    if order.status != OrderStatus.pending:
        raise ValueError("Seules les commandes en attente peuvent être annulées")
    order.status = OrderStatus.cancelled
    db.commit()
    db.refresh(order)
    return order


# ── Manager ────────────────────────────────────────────────────
def get_all_orders(
    db: Session,
    status: Optional[OrderStatus] = None,
    city:   Optional[str] = None,
) -> List[Order]:
    q = db.query(Order)
    if status:
        q = q.filter(Order.status == status)
    if city:
        q = q.filter(Order.destination_city.ilike(f"%{city}%"))
    return q.order_by(Order.created_at.desc()).all()


def assign_order(db: Session, order_id: int, data: OrderAssign) -> Order:
    order = _get_or_raise(db, order_id)
    if order.status != OrderStatus.pending:
        raise ValueError("Seules les commandes en attente peuvent être assignées")

    livreur = db.query(User).filter(User.id == data.livreur_id).first()
    if not livreur or livreur.role != UserRole.livreur:
        raise ValueError("Livreur introuvable ou rôle incorrect")

    suggested = calculate_base_price(order.origin_city, order.destination_city)
    base  = data.base_price if data.base_price is not None else suggested
    adj   = data.price_adjustment or 0.0
    total = round(base + adj, 2)

    order.livreur_id      = livreur.id
    order.status          = OrderStatus.assigned
    order.assigned_at     = datetime.utcnow()
    order.base_price      = base
    order.price_adjustment = adj
    order.total_price     = total
    db.commit()
    db.refresh(order)
    return order


def get_price_suggestion(origin: str, destination: str) -> dict:
    base = calculate_base_price(origin, destination)
    return {"base_price": base, "origin": origin, "destination": destination}


def manager_cancel_order(db: Session, order_id: int) -> Order:
    order = _get_or_raise(db, order_id)
    if order.status in (OrderStatus.delivered, OrderStatus.cancelled):
        raise ValueError("Cette commande ne peut plus être annulée")
    order.status = OrderStatus.cancelled
    db.commit()
    db.refresh(order)
    return order


# ── Livreur ────────────────────────────────────────────────────
def get_livreur_orders(db: Session, livreur_id: int) -> List[Order]:
    return (
        db.query(Order)
        .filter(Order.livreur_id == livreur_id)
        .order_by(Order.created_at.desc())
        .all()
    )


_LIVREUR_TRANSITIONS = {
    OrderStatus.assigned:   [OrderStatus.picked_up,  OrderStatus.cancelled],
    OrderStatus.picked_up:  [OrderStatus.in_transit, OrderStatus.cancelled],
    OrderStatus.in_transit: [OrderStatus.delivered,  OrderStatus.cancelled],
}


def update_delivery_status(
    db: Session, order_id: int, data: OrderStatusUpdate, livreur: User
) -> Order:
    order = _get_or_raise(db, order_id)
    if order.livreur_id != livreur.id:
        raise PermissionError("Cette commande ne vous est pas assignée")

    allowed = _LIVREUR_TRANSITIONS.get(order.status, [])
    if data.status not in allowed:
        raise ValueError(
            f"Transition invalide : {order.status} → {data.status}. "
            f"Autorisées : {[s.value for s in allowed]}"
        )
    order.status = data.status
    if data.status == OrderStatus.delivered:
        order.delivered_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return order


# ── Invoice ────────────────────────────────────────────────────
def get_order_for_invoice(db: Session, order_id: int, user: User) -> Order:
    order = _get_or_raise(db, order_id)
    if user.role.value == "client" and order.client_id != user.id:
        raise PermissionError("Accès refusé")
    return order


# ── Shared ─────────────────────────────────────────────────────
def get_order_by_id(db: Session, order_id: int) -> Order:
    return _get_or_raise(db, order_id)


def _get_or_raise(db: Session, order_id: int) -> Order:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise ValueError("Commande introuvable")
    return order
