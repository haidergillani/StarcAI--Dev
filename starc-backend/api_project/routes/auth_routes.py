from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from fastapi_jwt_auth import AuthJWT
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from starlette.responses import RedirectResponse
from api_project.models import User
from api_project.database import get_db
from api_project.schemas import UserCreate, UserLogin, TokenResponse
import os

auth_router = APIRouter()

# Load environment variables
config = Config(".env")
oauth = OAuth(config)

oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    authorize_params=None,
    access_token_url='https://accounts.google.com/o/oauth2/token',
    access_token_params=None,
    refresh_token_url=None,
    redirect_uri=os.getenv('GOOGLE_REDIRECT_URI'),
    client_kwargs={'scope': 'openid profile email'},
)

@auth_router.post('/google', response_model=TokenResponse)
async def google_login(request: Request, db: Session = Depends(get_db), Authorize: AuthJWT = Depends()):
    token = request.json().get('token')
    user_info = await oauth.google.parse_id_token(request, token)
    user_email = user_info['email']

    user = db.query(User).filter_by(email=user_email).first()
    if not user:
        user = User(username=user_info['name'], email=user_email)
        db.add(user)
        db.commit()

    access_token = Authorize.create_access_token(subject=user.id)
    return {"access_token": access_token}

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
    db_user = db.query(User).filter((User.username == user.login_identifier) | (User.email == user.login_identifier)).first()
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