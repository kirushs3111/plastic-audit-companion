from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.limiter import limiter
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import (
    GuestSessionResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/guest", response_model=GuestSessionResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def start_guest_session(request: Request, db: Session = Depends(get_db)) -> GuestSessionResponse:
    """
    Creates a fresh guest user and returns a bearer token for it. No
    email/password required - this is what lets someone start an audit
    immediately, per the spec's "Guest Mode" requirement. Rate limited to
    slow down automated mass account creation.
    """
    guest = User(is_guest=True)
    db.add(guest)
    db.commit()
    db.refresh(guest)

    token = create_access_token(guest.id)
    return GuestSessionResponse(access_token=token, user_id=guest.id)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        display_name=payload.display_name,
        is_guest=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Rate limited per-IP to slow down password brute-forcing. This is a
    basic mitigation, not a complete one - it doesn't stop a distributed
    attack across many IPs, and account lockout / CAPTCHA would be the
    next layer for a production auth system."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.hashed_password or not verify_password(
        payload.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password"
        )

    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
