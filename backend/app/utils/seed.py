from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User, UserRole


def seed_admin(db: Session) -> None:
    """Creates the first admin account if none exists."""
    exists = db.query(User).filter(User.role == UserRole.admin).first()
    if not exists:
        admin = User(
            full_name="Super Admin",
            email=settings.FIRST_ADMIN_EMAIL,
            hashed_password=hash_password(settings.FIRST_ADMIN_PASSWORD),
            role=UserRole.admin,
        )
        db.add(admin)
        db.commit()
        print(f"[seed] Admin created: {settings.FIRST_ADMIN_EMAIL}")
