from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps

from config.settings import db
from models.doctor import Doctor
from models.doctor_details import DoctorDetails, empty_doctor_details_json
from routes.auth_routes import role_required
import validators as v

# Comparte el prefijo /api/doctor con doctor_routes (acá solo vive /details)
doctor_details_bp = Blueprint("doctor_details", __name__, url_prefix="/api/doctor")

DETAILS_SPEC = {
    "first_name": v.text("El nombre", 60),
    "last_name": v.text("El apellido", 60),
    "birth_date": v.day("La fecha de nacimiento"),
    "phone": v.phone("El teléfono"),
    "locality": v.text("La localidad", 80),
    "workplace": v.text("El lugar de atención", 120),
    "office_address": v.text("La dirección del consultorio", 150),
    "attention_hours": v.text("Los horarios de atención", 150),
    "accepted_insurances": v.text("Las obras sociales", 255),
    "bio": v.text("La presentación", 500),
}


def doctor_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        doctor = Doctor.query.filter_by(id_user=get_jwt_identity()).first()
        if not doctor:
            return jsonify({"message": "Perfil de médico no encontrado. Completá tus datos profesionales primero."}), 404
        g.doctor = doctor
        return fn(*args, **kwargs)
    return wrapper


def doctor_details_payload(doctor):
    details = doctor.details.to_json() if doctor.details else empty_doctor_details_json()
    details["email"] = doctor.user.email if doctor.user else None
    return details


@doctor_details_bp.route("/details", methods=["GET"])
@jwt_required()
@role_required("Doctor")
@doctor_required
def get_details():
    return jsonify(doctor_details_payload(g.doctor)), 200


@doctor_details_bp.route("/details", methods=["PUT"])
@jwt_required()
@role_required("Doctor")
@doctor_required
def save_details():
    data = request.get_json(silent=True) or {}
    try:
        cleaned = v.parse_fields(data, DETAILS_SPEC)
    except v.ValidationError as err:
        return jsonify({"message": str(err)}), 400

    details = g.doctor.details
    if not details:
        details = DoctorDetails(id_doctor=g.doctor.id_doctor)
        db.session.add(details)
    for key, value in cleaned.items():
        setattr(details, key, value)

    db.session.commit()
    return jsonify({"message": "Datos guardados.", "details": doctor_details_payload(g.doctor)}), 200
