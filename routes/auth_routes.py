from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, verify_jwt_in_request, get_jwt
from functools import wraps
from config.settings import db
from models.user import User
from google.oauth2 import id_token
from google.auth.transport import requests
import secrets

def role_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            role = claims.get("role")
            if role not in allowed_roles:
                return jsonify({
                    "message": f"Acceso denegado. Se requiere rol: {', '.join(allowed_roles)}"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    role = data.get("role", "User")

    if not username or not email or not password or not role:
        return jsonify({"message": "El nombre de usuario, email, rol y contraseña son obligatorios"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Ese nombre de usuario ya está en uso"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Ese email ya está registrado"}), 400

    user = User(username=username, email=email, password=password, role=role)

    try:
        db.session.add(user)
        db.session.commit()
        return jsonify(user.to_json()), 201
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Ocurrió un error al registrar el usuario"}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"message": "El email y la contraseña son obligatorios"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"message": "Email o contraseña incorrectos"}), 401

    access_token = create_access_token(
        identity=user.id_user,
        additional_claims={"role": user.role, "username": user.username})

    return jsonify({"token": access_token, "user": user.to_json()}), 200

@auth_bp.route("/google", methods=["POST"])
def google_auth():
    """
    Endpoint para manejar el login y registro con Google.
    Recibe el 'token' generado por Google en el frontend.
    """
    data = request.get_json(silent=True) or {}
    token = data.get("token")
    
    # Por defecto, si un usuario se registra con Google, le asignamos el rol "Paciente".
    # Si quisieras que médicos se registren por Google, el frontend debería enviar el rol.
    requested_role = data.get("role", "Paciente")

    if not token:
        return jsonify({"message": "Token de Google no proporcionado"}), 400

    try:
        # Reemplaza esto con tu CLIENT_ID real de Google Cloud Console
        # Lo ideal es traerlo desde un archivo .env: os.environ.get("GOOGLE_CLIENT_ID")
        CLIENT_ID = "TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com" 
        
        # Verifica el token con los servidores de Google
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), CLIENT_ID)

        # Si llegamos aquí, el token es válido. Extraemos los datos:
        email = idinfo.get("email")
        name = idinfo.get("name", "")

        # 1. Buscamos si el usuario ya existe en nuestra base de datos
        user = User.query.filter_by(email=email).first()

        if not user:
            # 2. Si no existe, lo REGISTRAMOS automáticamente (HU 13)
            
            # Generamos un username único basado en su nombre
            base_username = name.replace(" ", "").lower()
            unique_username = base_username
            counter = 1
            while User.query.filter_by(username=unique_username).first():
                unique_username = f"{base_username}{counter}"
                counter += 1

            # Generamos una contraseña aleatoria y segura. 
            # (El usuario nunca la usará porque siempre entrará con Google)
            random_password = secrets.token_urlsafe(16)

            user = User(
                username=unique_username, 
                email=email, 
                password=random_password, 
                role=requested_role)
            db.session.add(user)
            db.session.commit()

        # 3. Iniciamos sesión generando nuestro propio JWT (HU 10)
        access_token = create_access_token(
            identity=user.id_user,
            additional_claims={"role": user.role, "username": user.username})

        return jsonify({
            "message": "Autenticación con Google exitosa",
            "token": access_token, 
            "user": user.to_json()}), 200

    except ValueError:
        # Esto ocurre si el token expiró o su firma es inválida
        return jsonify({"message": "Token de Google inválido o expirado"}), 401

@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"message": "Usuario no encontrado"}), 404
    return jsonify(user.to_json()), 200

@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    return jsonify({"message": "Sesión cerrada correctamente"}), 200