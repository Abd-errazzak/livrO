from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_role
from app.core.database import get_db
from app.models.order import Order, OrderStatus
from app.models.user import User, UserRole
from app.schemas.user import (
    AdminCreateUserRequest,
    ChangePasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterClientRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserOut,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

_require_admin   = require_role(UserRole.admin)
_require_manager = require_role(UserRole.admin, UserRole.manager)


# ── Public ─────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    try:
        return auth_service.login(db, data)
    except ValueError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/register", response_model=TokenResponse, status_code=201)
def register_client(data: RegisterClientRequest, db: Session = Depends(get_db)):
    try:
        return auth_service.register_client(db, data)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    try:
        return auth_service.refresh_tokens(db, data.refresh_token)
    except ValueError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail=str(e))


# ── Current user ───────────────────────────────────────────────
@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_profile(
    data: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        if data.full_name is not None and data.full_name.strip():
            current_user.full_name = data.full_name.strip()
        if data.phone is not None:
            current_user.phone = data.phone.strip() or None
        db.commit()
        db.refresh(current_user)
        return current_user
    except Exception as e:
        db.rollback()
        import traceback; traceback.print_exc()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/me/change-password", response_model=UserOut)
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        from app.core.security import verify_password, hash_password
        if not verify_password(data.current_password, current_user.hashed_password):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Mot de passe actuel incorrect")
        if len(data.new_password) < 8:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Le nouveau mot de passe doit contenir au moins 8 caractères")
        current_user.hashed_password = hash_password(data.new_password)
        db.commit()
        db.refresh(current_user)
        return current_user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback; traceback.print_exc()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ── Admin: create staff account ────────────────────────────────
@router.post("/create-user", response_model=UserOut, status_code=201)
def admin_create_user(
    data: AdminCreateUserRequest,
    db: Session = Depends(get_db),
    _: User = Depends(_require_admin),
):
    try:
        return auth_service.admin_create_user(db, data)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


# ── Admin/Manager: list users ──────────────────────────────────
@router.get("/list-users", response_model=list[UserOut])
def list_users(
    role: Optional[UserRole] = Query(None),
    db:   Session            = Depends(get_db),
    _:    User               = Depends(_require_manager),
):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    return q.order_by(User.full_name).all()


# ── Admin: toggle user active ──────────────────────────────────
@router.patch("/toggle-user/{user_id}", response_model=UserOut)
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


# ── Admin: platform stats ──────────────────────────────────────
@router.get("/stats")
def platform_stats(
    db: Session = Depends(get_db),
    _:  User    = Depends(_require_admin),
):
    total_orders    = db.query(Order).count()
    delivered       = db.query(Order).filter(Order.status == OrderStatus.delivered).count()
    pending         = db.query(Order).filter(Order.status == OrderStatus.pending).count()
    cancelled       = db.query(Order).filter(Order.status == OrderStatus.cancelled).count()
    in_progress     = db.query(Order).filter(Order.status.in_([
        OrderStatus.assigned, OrderStatus.picked_up, OrderStatus.in_transit
    ])).count()
    total_users     = db.query(User).count()
    active_livreurs = db.query(User).filter(User.role == UserRole.livreur, User.is_active == True).count()
    total_managers  = db.query(User).filter(User.role == UserRole.manager).count()
    total_clients   = db.query(User).filter(User.role == UserRole.client).count()
    success_rate    = round((delivered / total_orders * 100), 1) if total_orders > 0 else 0
    return {
        "orders": {
            "total": total_orders, "delivered": delivered,
            "pending": pending, "in_progress": in_progress,
            "cancelled": cancelled, "success_rate": success_rate,
        },
        "users": {
            "total": total_users, "active_livreurs": active_livreurs,
            "managers": total_managers, "clients": total_clients,
        },
    }


# ── Admin: recent orders ───────────────────────────────────────
@router.get("/recent-orders")
def recent_orders(
    limit: int     = Query(10, le=50),
    db:    Session = Depends(get_db),
    _:     User    = Depends(_require_admin),
):
    orders = db.query(Order).order_by(Order.created_at.desc()).limit(limit).all()
    return [
        {
            "id":               o.id,
            "status":           o.status.value,
            "origin_city":      o.origin_city,
            "destination_city": o.destination_city,
            "sender_name":      o.sender_name,
            "receiver_name":    o.receiver_name,
            "total_price":      o.total_price,
            "client":  {"id": o.client.id,  "full_name": o.client.full_name}  if o.client  else None,
            "livreur": {"id": o.livreur.id, "full_name": o.livreur.full_name} if o.livreur else None,
            "created_at": o.created_at.isoformat(),
        }
        for o in orders
    ]