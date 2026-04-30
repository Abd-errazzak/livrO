from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_role
from app.core.database import get_db
from app.models.order import OrderStatus
from app.models.user import User, UserRole
from app.schemas.order import OrderAssign, OrderOut, OrderSummary
from app.services import order_service

router = APIRouter(prefix="/manager/orders", tags=["Manager — Orders"])

_require_manager = require_role(UserRole.manager, UserRole.admin)


@router.get("", response_model=list[OrderSummary])
def list_orders(
    status: Optional[OrderStatus] = Query(None),
    city:   Optional[str]         = Query(None),
    db:     Session                = Depends(get_db),
    _:      User                   = Depends(_require_manager),
):
    return order_service.get_all_orders(db, status=status, city=city)


@router.get("/price-suggestion", tags=["Manager — Pricing"])
def price_suggestion(
    origin:      str = Query(...),
    destination: str = Query(...),
    _:           User = Depends(_require_manager),
):
    return order_service.get_price_suggestion(origin, destination)


@router.get("/{order_id}", response_model=OrderOut)
def order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    _:  User    = Depends(_require_manager),
):
    try:
        return order_service.get_order_by_id(db, order_id)
    except ValueError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/{order_id}/assign", response_model=OrderOut)
def assign_order(
    order_id: int,
    data: OrderAssign,
    db:   Session = Depends(get_db),
    _:    User    = Depends(_require_manager),
):
    try:
        return order_service.assign_order(db, order_id, data)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/{order_id}/cancel", response_model=OrderOut)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    _:  User    = Depends(_require_manager),
):
    try:
        return order_service.manager_cancel_order(db, order_id)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))
