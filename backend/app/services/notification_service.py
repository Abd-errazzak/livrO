import traceback
from datetime import datetime
from sqlalchemy.orm import Session


STATUS_MESSAGES = {
    "assigned":   ("Commande assignée",   "Votre commande #{id} a été assignée à un livreur."),
    "picked_up":  ("Colis récupéré",      "Votre colis #{id} a été récupéré par le livreur."),
    "in_transit": ("En route",             "Votre colis #{id} est en route vers sa destination."),
    "delivered":  ("Colis livré ! 🎉",    "Votre commande #{id} a été livrée avec succès."),
    "cancelled":  ("Commande annulée",     "Votre commande #{id} a été annulée."),
}


def create_order_notification(db: Session, order, new_status) -> None:
    """
    Creates a notification for the client when an order status changes.
    Uses string status value to avoid circular imports with OrderStatus enum.
    """
    try:
        # Get status value as string regardless of whether it's enum or string
        status_val = new_status.value if hasattr(new_status, "value") else str(new_status)

        if status_val not in STATUS_MESSAGES:
            return

        title, msg_tpl = STATUS_MESSAGES[status_val]
        message = msg_tpl.format(id=order.id)

        # Import here to avoid circular imports
        from app.models.notification import Notification

        notif = Notification(
            user_id=order.client_id,
            title=title,
            message=message,
            order_id=order.id,
            created_at=datetime.utcnow(),
        )
        db.add(notif)
        print(f"[NOTIF] Created notification for user {order.client_id}: {title}")

    except Exception as e:
        print(f"[NOTIF ERROR] Failed to create notification: {e}")
        traceback.print_exc()
        # Don't re-raise — notification failure should never block the main operation


def get_notifications(db: Session, user_id: int, unread_only: bool = False):
    from app.models.notification import Notification
    q = db.query(Notification).filter(Notification.user_id == user_id)
    if unread_only:
        q = q.filter(Notification.is_read == False)
    return q.order_by(Notification.created_at.desc()).limit(50).all()


def mark_read(db: Session, user_id: int, notif_id: int):
    from app.models.notification import Notification
    n = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == user_id,
    ).first()
    if not n:
        raise ValueError("Notification introuvable")
    n.is_read = True
    db.commit()
    db.refresh(n)
    return n


def mark_all_read(db: Session, user_id: int) -> int:
    from app.models.notification import Notification
    count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return count


def unread_count(db: Session, user_id: int) -> int:
    from app.models.notification import Notification
    return db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False,
    ).count()
