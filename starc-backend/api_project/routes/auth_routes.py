"""

Changes Unlikely to be needed

"""


# Import neccesary libraries.
from flask import Blueprint, request, jsonify
from api_project.models import User
from api_project import db
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import generate_password_hash

# Register route.
auth_bp = Blueprint('auth', __name__)

# Register unique user using name, email and password.
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"message": "Username, email, and password required"}), 400
        
    user_with_same_name = User.query.filter_by(username=username).first()
    user_with_same_email = User.query.filter_by(email=email).first()

    if user_with_same_name:
        return jsonify({"message": "Username already exists"}), 400

    if user_with_same_email:
        return jsonify({"message": "Email already registered"}), 400

    new_user = User(username=username, email=email)
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Registered successfully"}), 201

# Login using either email or password, which checks your password to return an auth token.
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    login_identifier = data.get('login_identifier')
    password = data.get('password')

    user = User.query.filter((User.username == login_identifier) | (User.email == login_identifier)).first()

    if user and user.check_password(password):
        access_token = create_access_token(identity=user.id)
        return jsonify(access_token=access_token), 200

    return jsonify({"message": "Invalid credentials"}), 401