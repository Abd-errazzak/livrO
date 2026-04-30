import traceback

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.dependencies import require_role
from app.core.database import get_db
from app.models.order import Order
from app.models.user import User, UserRole
from app.schemas.order import OrderCreate, OrderOut, OrderSummary
from app.services import order_service

router = APIRouter(prefix="/client/orders", tags=["Client — Orders"])

_require_client = require_role(UserRole.client)


def _load_order(db: Session, order_id: int) -> Order:
    return (
        db.query(Order)
        .options(joinedload(Order.client), joinedload(Order.livreur))
        .filter(Order.id == order_id)
        .first()
    )


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_client),
):
    try:
        print(f"\n[DEBUG] create_order called by user id={current_user.id} role={current_user.role}")
        print(f"[DEBUG] payload: {data.model_dump()}")
        order = order_service.create_order(db, data, current_user)
        print(f"[DEBUG] order created id={order.id}")
        return _load_order(db, order.id)
    except Exception as e:
        print(f"[ERROR] create_order failed: {e}")
        traceback.print_exc()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=list[OrderSummary])
def my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_client),
):
    return order_service.get_client_orders(db, current_user.id)


@router.get("/{order_id}", response_model=OrderOut)
def order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_client),
):
    order = _load_order(db, order_id)
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Commande introuvable")
    if order.client_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return order


@router.patch("/{order_id}/cancel", response_model=OrderOut)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_client),
):
    try:
        order = order_service.cancel_own_order(db, order_id, current_user)
        return _load_order(db, order.id)
    except PermissionError as e:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))
