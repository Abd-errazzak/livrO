from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User, UserRole
from app.schemas.user import (
    AdminCreateUserRequest,
    LoginRequest,
    RegisterClientRequest,
    TokenResponse,
    UserOut,
)


def _build_token_response(user: User) -> TokenResponse:
    payload = {"sub": str(user.id), "role": user.role.value}
    return TokenResponse(
        access_token=create_access_token(payload),
        refresh_token=create_refresh_token(payload),
        user=UserOut.model_validate(user),
    )


def login(db: Session, data: LoginRequest) -> TokenResponse:
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise ValueError("Email ou mot de passe incorrect")
    if not user.is_active:
        raise ValueError("Compte désactivé. Contactez l'administrateur")
    return _build_token_response(user)


def register_client(db: Session, data: RegisterClientRequest) -> TokenResponse:
    if db.query(User).filter(User.email == data.email).first():
        raise ValueError("Cette adresse email est déjà utilisée")
    user = User(
        full_name=data.full_name,
        email=data.email,
        hashed_password=hash_password(data.password),
        phone=data.phone,
        role=UserRole.client,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _build_token_response(user)


def admin_create_user(db: Session, data: AdminCreateUserRequest) -> UserOut:
    """Admin creates a manager or livreur account (no token returned)."""
    if db.query(User).filter(User.email == data.email).first():
        raise ValueError("Cette adresse email est déjà utilisée")
    user = User(
        full_name=data.full_name,
        email=data.email,
        hashed_password=hash_password(data.password),
        phone=data.phone,
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


def refresh_tokens(db: Session, refresh_token: str) -> TokenResponse:
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise ValueError("Token de rafraîchissement invalide")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user or not user.is_active:
        raise ValueError("Utilisateur introuvable ou désactivé")
    return _build_token_response(user)
