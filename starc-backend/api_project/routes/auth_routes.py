from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from fastapi_jwt_auth import AuthJWT
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from api_project.models import User
from api_project.database import get_db
from api_project.schemas import UserCreate, UserLogin, TokenResponse
import os
from google.oauth2 import id_token
from google.auth.transport import requests

auth_router = APIRouter()

# Load environment variables
config = Config(".env")
oauth = OAuth(config)

@auth_router.post('/google', response_model=TokenResponse)
async def google_login(request: Request, db: Session = Depends(get_db), Authorize: AuthJWT = Depends()):
    try:
        # Get the request body
        try:
            body = await request.json()
        except Exception as e:
            raise HTTPException(status_code=400, detail="Invalid request body")

        # Get token from either 'token' or 'credential' field
        token = body.get('token') or body.get('credential')
        if not token:
            raise HTTPException(status_code=400, detail="Token is required")

        try:
            # Verify the token with Google
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                os.getenv('GOOGLE_CLIENT_ID')
            )
            
            # Get user email and name from the verified token
            user_email = idinfo['email']
            user_name = idinfo.get('name', user_email.split('@')[0])

            # Find or create user
            user = db.query(User).filter_by(email=user_email).first()
            if not user:
                user = User(
                    username=user_name, 
                    email=user_email,
                    password="OAUTH_USER",
                    is_oauth_user=True
                )
                db.add(user)
                db.commit()

            # Create access token
            access_token = Authorize.create_access_token(subject=user.id)
            return {"access_token": access_token}
            
        except ValueError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
            
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

# Register unique user using name, email, and password.
@auth_router.post('/register', response_model=dict)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter_by(username=user.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(User).filter_by(email=user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(username=user.username, email=user.email)
    new_user.set_password(user.password)
    db.add(new_user)
    db.commit()

    return {"message": "Registered successfully"}

# Login using either email or password, which checks your password to return an auth token.
@auth_router.post('/login', response_model=TokenResponse)
def login(user: UserLogin, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(
        (User.username == user.login_identifier) | 
        (User.email == user.login_identifier)
    ).first()
    
    if not db_user or not db_user.check_password(user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = Authorize.create_access_token(subject=db_user.id)
    return {"access_token": access_token}

@auth_router.post('/refresh', response_model=TokenResponse)
def refresh_token(Authorize: AuthJWT = Depends()):
    Authorize.jwt_refresh_token_required()
    current_user = Authorize.get_jwt_subject()
    new_access_token = Authorize.create_access_token(subject=current_user)
    return {"access_token": new_access_token}