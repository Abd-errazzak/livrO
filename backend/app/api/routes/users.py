from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_role
from app.core.database import get_db
from app.models.order import Order, OrderStatus
from app.models.user import User, UserRole
from app.schemas.user import UserOut

router = APIRouter(prefix="/auth/users", tags=["Users"])

_require_admin   = require_role(UserRole.admin)
_require_manager = require_role(UserRole.admin, UserRole.manager)


# ── List users (admin + manager) ───────────────────────────────
@router.get("", response_model=list[UserOut])
def list_users(
    role: Optional[UserRole] = Query(None),
    db:   Session            = Depends(get_db),
    _:    User               = Depends(_require_manager),
):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    return q.order_by(User.full_name).all()


# ── Toggle active/inactive (admin only) ───────────────────────
@router.patch("/{user_id}/toggle-active", response_model=UserOut)
def toggle_active(
    user_id: int,
    db:      Session = Depends(get_db),
    current: User    = Depends(_require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")
    if user.id == current.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Vous ne pouvez pas désactiver votre propre compte")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user


# ── Platform stats (admin only) ────────────────────────────────
@router.get("/stats", tags=["Admin"])
def platform_stats(
    db: Session = Depends(get_db),
    _:  User    = Depends(_require_admin),
):
    total_orders     = db.query(Order).count()
    delivered        = db.query(Order).filter(Order.status == OrderStatus.delivered).count()
    pending          = db.query(Order).filter(Order.status == OrderStatus.pending).count()
    cancelled        = db.query(Order).filter(Order.status == OrderStatus.cancelled).count()
    in_progress      = db.query(Order).filter(Order.status.in_([
        OrderStatus.assigned, OrderStatus.picked_up, OrderStatus.in_transit
    ])).count()
    total_users      = db.query(User).count()
    active_livreurs  = db.query(User).filter(User.role == UserRole.livreur, User.is_active == True).count()
    total_managers   = db.query(User).filter(User.role == UserRole.manager).count()
    total_clients    = db.query(User).filter(User.role == UserRole.client).count()

    success_rate = round((delivered / total_orders * 100), 1) if total_orders > 0 else 0

    return {
        "orders": {
            "total":       total_orders,
            "delivered":   delivered,
            "pending":     pending,
            "in_progress": in_progress,
            "cancelled":   cancelled,
            "success_rate": success_rate,
        },
        "users": {
            "total":           total_users,
            "active_livreurs": active_livreurs,
            "managers":        total_managers,
            "clients":         total_clients,
        },
    }


# ── Recent orders for admin overview ──────────────────────────
@router.get("/recent-orders", tags=["Admin"])
def recent_orders(
    limit: int     = Query(10, le=50),
    db:    Session = Depends(get_db),
    _:     User    = Depends(_require_admin),
):
    orders = (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .limit(limit)
        .all()
    )
    result = []
    for o in orders:
        result.append({
            "id":               o.id,
            "status":           o.status.value,
            "origin_city":      o.origin_city,
            "destination_city": o.destination_city,
            "sender_name":      o.sender_name,
            "receiver_name":    o.receiver_name,
            "client":           {"id": o.client.id, "full_name": o.client.full_name} if o.client else None,
            "livreur":          {"id": o.livreur.id, "full_name": o.livreur.full_name} if o.livreur else None,
            "created_at":       o.created_at.isoformat(),
        })
    return result
