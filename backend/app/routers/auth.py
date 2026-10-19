from datetime import timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.models.user import User
from app.schemas.auth import LoginRequest, Token, RefreshRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])
security = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    username = payload.get("sub")
    user = db.query(User).filter(User.username == username, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {allowed_roles} roles. Your role is '{current_user.role}'."
            )
        return current_user
    return role_checker

# CRITICAL FIX: Added both "/login" and "/login/" to handle Vercel's routing behavior
@router.post("/login", response_model=Token, include_in_schema=False)
@router.post("/login/", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Staff Login (Store Admin or Support Agent)."""
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token = create_access_token({"sub": user.username, "role": user.role})
    refresh_token = create_refresh_token({"sub": user.username, "role": user.role})

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role,
        username=user.username,
        full_name=user.full_name
    )

# CRITICAL FIX: Added both "/refresh" and "/refresh/"
@router.post("/refresh", response_model=Token, include_in_schema=False)
@router.post("/refresh/", response_model=Token)
def refresh_token(req: RefreshRequest, db: Session = Depends(get_db)):
    """Refresh JWT access token using valid refresh token."""
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    username = payload.get("sub")
    user = db.query(User).filter(User.username == username, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer active")

    new_access = create_access_token({"sub": user.username, "role": user.role})
    new_refresh = create_refresh_token({"sub": user.username, "role": user.role})

    return Token(
        access_token=new_access,
        refresh_token=new_refresh,
        role=user.role,
        username=user.username,
        full_name=user.full_name
    )

# CRITICAL FIX: Added both "/me" and "/me/"
@router.get("/me", response_model=UserResponse, include_in_schema=False)
@router.get("/me/", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Get authenticated user profile."""
    return current_user