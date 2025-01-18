import pytest
from unittest.mock import patch
from api_project.models import User

def test_register_success(client, test_db):
    response = client.post("/auth/register", json={
        "username": "newuser",
        "email": "new@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    assert response.json() == {"message": "Registered successfully"}
    
    # Verify user was created in DB
    user = test_db.query(User).filter_by(email="new@example.com").first()
    assert user is not None
    assert user.username == "newuser"
    assert user.check_password("password123")

def test_register_duplicate_username(client, test_user):
    response = client.post("/auth/register", json={
        "username": "testuser",  # Same as test_user fixture
        "email": "another@example.com",
        "password": "password123"
    })
    assert response.status_code == 400
    assert "Username already exists" in response.json()["detail"]

def test_register_duplicate_email(client, test_user):
    response = client.post("/auth/register", json={
        "username": "anotheruser",
        "email": "test@example.com",  # Same as test_user fixture
        "password": "password123"
    })
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]

def test_login_success_with_username(client, test_user):
    response = client.post("/auth/login", json={
        "login_identifier": "testuser",
        "password": "testpassword"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_success_with_email(client, test_user):
    response = client.post("/auth/login", json={
        "login_identifier": "test@example.com",
        "password": "testpassword"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_invalid_credentials(client, test_user):
    response = client.post("/auth/login", json={
        "login_identifier": "testuser",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]

@pytest.mark.asyncio
async def test_google_login_success(client):
    mock_token = "mock_google_token"
    mock_user_info = {
        "email": "google@example.com",
        "name": "Google User"
    }
    
    with patch("google.oauth2.id_token.verify_oauth2_token", return_value=mock_user_info):
        response = client.post("/auth/google", json={"token": mock_token})
        assert response.status_code == 200
        assert "access_token" in response.json()

def test_google_login_missing_token(client):
    response = client.post("/auth/google", json={})
    assert response.status_code == 400
    assert "Token is required" in response.json()["detail"]

@pytest.mark.asyncio
async def test_google_login_invalid_token(client):
    with patch("google.oauth2.id_token.verify_oauth2_token", side_effect=ValueError("Invalid token")):
        response = client.post("/auth/google", json={"token": "invalid_token"})
        assert response.status_code == 401
        assert "Invalid token" in response.json()["detail"]

def test_refresh_token_without_token(client):
    response = client.post("/auth/refresh")
    assert response.status_code == 401

def test_refresh_token_with_token(client, test_tokens):
    if not test_tokens.get("refresh_token"):
        pytest.skip("Refresh token not provided by the auth system")
        
    response = client.post(
        "/auth/refresh",
        headers={"Authorization": f"Bearer {test_tokens['refresh_token']}"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json() 