from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_role
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.order import OrderOut
from app.services import order_service

router = APIRouter(prefix="/invoice", tags=["Invoice"])

_require_client_or_admin = require_role(UserRole.client, UserRole.admin)


@router.get("/{order_id}", response_model=OrderOut)
def get_invoice_data(
    order_id:     int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    if current_user.role not in (UserRole.client, UserRole.admin):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    try:
        return order_service.get_order_for_invoice(db, order_id, current_user)
    except PermissionError as e:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValueError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))
