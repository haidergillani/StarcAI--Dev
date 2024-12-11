from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from fastapi_jwt_auth import AuthJWT
from fastapi_jwt_auth.exceptions import AuthJWTException, JWTDecodeError
from fastapi.middleware.cors import CORSMiddleware
from api_project.database import engine, Base, get_db
from api_project.routes.auth_routes import auth_router
from api_project.routes.documents import documents_router
from api_project.routes.rewrites import rewrite_router
from api_project.routes.search import search_router
import os
from pydantic import BaseModel

class Settings(BaseModel):
    authjwt_secret_key: str = os.environ.get('JWT_SECRET_KEY', 'default_jwt_secret_key')
    authjwt_access_token_expires: int = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 7000))

@AuthJWT.load_config
def get_config():
    return Settings()

def create_app():
    app = FastAPI()

    print(os.environ.get('JWT_SECRET_KEY', 'default_jwt_secret_key'))

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://starc-frontend-app-4c30515c51d7.herokuapp.com",
            "http://localhost:3000",
            "*"  # During development - remove in production
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=600,
    )

    app.include_router(auth_router, prefix='/auth')
    app.include_router(documents_router, prefix='/docs')
    app.include_router(rewrite_router, prefix='/fix')
    app.include_router(search_router, prefix='/api')

    @app.exception_handler(AuthJWTException)
    def authjwt_exception_handler(request: Request, exc: AuthJWTException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )

    @app.exception_handler(JWTDecodeError)
    def jwt_decode_error_handler(request: Request, exc: JWTDecodeError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": "Token has expired or is invalid"}
        )

    Base.metadata.create_all(bind=engine)

    return app