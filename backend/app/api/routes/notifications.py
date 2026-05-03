from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class NotificationOut(BaseModel):
    id:         int
    title:      str
    message:    str
    is_read:    bool
    order_id:   Optional[int]
    created_at: datetime
    model_config = {"from_attributes": True}


class UnreadCountOut(BaseModel):
    count: int


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    unread_only:  bool    = Query(False),
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    from app.services.notification_service import get_notifications
    return get_notifications(db, current_user.id, unread_only)


@router.get("/unread-count", response_model=UnreadCountOut)
def count_unread(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    from app.services.notification_service import unread_count
    return {"count": unread_count(db, current_user.id)}


@router.patch("/{notif_id}/read", response_model=NotificationOut)
def mark_one_read(
    notif_id:     int,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    from app.services.notification_service import mark_read
    try:
        return mark_read(db, current_user.id, notif_id)
    except ValueError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/read-all")
def mark_all_read(
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    from app.services.notification_service import mark_all_read
    count = mark_all_read(db, current_user.id)
    return {"marked": count}
