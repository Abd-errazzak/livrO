from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_role
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.order import OrderOut, OrderStatusUpdate, OrderSummary
from app.services import order_service

router = APIRouter(prefix="/livreur/orders", tags=["Livreur — Orders"])

_require_livreur = require_role(UserRole.livreur)


@router.get("", response_model=list[OrderSummary])
def my_deliveries(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(_require_livreur),
):
    return order_service.get_livreur_orders(db, current_user.id)


@router.get("/{order_id}", response_model=OrderOut)
def delivery_detail(
    order_id:     int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(_require_livreur),
):
    try:
        order = order_service.get_order_by_id(db, order_id)
        if order.livreur_id != current_user.id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Cette commande ne vous est pas assignée")
        return order
    except ValueError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/{order_id}/status", response_model=OrderOut)
def update_status(
    order_id:     int,
    data:         OrderStatusUpdate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(_require_livreur),
):
    try:
        return order_service.update_delivery_status(db, order_id, data, current_user)
    except PermissionError as e:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))
