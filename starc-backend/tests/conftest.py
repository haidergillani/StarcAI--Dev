import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from api_project.database import Base, get_db
from api_project.models import User
from app import app
import os

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture
def test_db():
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestingSessionLocal()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(test_db):
    def _get_test_db():
        try:
            yield test_db
        finally:
            pass
    app.dependency_overrides[get_db] = _get_test_db
    return TestClient(app)

@pytest.fixture
def test_user(test_db):
    user = User(
        username="testuser",
        email="test@example.com",
    )
    user.set_password("testpassword")
    test_db.add(user)
    test_db.commit()
    return user

@pytest.fixture
def test_tokens(test_user, client):
    response = client.post("/auth/login", json={
        "login_identifier": "testuser",
        "password": "testpassword"
    })
    return {
        "access_token": response.json()["access_token"],
        "refresh_token": response.json().get("refresh_token")
    }

@pytest.fixture
def test_user_token(test_tokens):
    return test_tokens["access_token"] 