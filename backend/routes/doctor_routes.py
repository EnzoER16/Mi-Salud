from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.settings import db
from models.doctor import Doctor
from routes.auth_routes import role_required

doctor_bp = Blueprint("doctor", __name__, url_prefix="/api/doctor")

@doctor_bp.route("/profile", methods=["POST"])
@jwt_required()
@role_required("Doctor")
def create_or_update_profile():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    specialty = (data.get("specialty") or "").strip()
    license_number = (data.get("license_number") or "").strip()

    if not specialty or not license_number:
        return jsonify({"message": "La especialidad y la matrícula son obligatorias"}), 400

    doctor = Doctor.query.filter_by(id_user=user_id).first()

    if doctor:
        doctor.specialty = specialty
        doctor.license_number = license_number
        message = "Perfil de médico actualizado exitosamente"
    else:
        doctor = Doctor(
            id_user=user_id, 
            specialty=specialty, 
            license_number=license_number)
        db.session.add(doctor)
        message = "Perfil de médico creado exitosamente"

    db.session.commit()
    return jsonify({"message": message, "profile": doctor.to_json()}), 200

@doctor_bp.route("/profile", methods=["GET"])
@jwt_required()
@role_required("Doctor")
def get_profile():
    user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(id_user=user_id).first()

    if not doctor:
        return jsonify({"message": "Perfil de médico no encontrado. Por favor, complete sus datos."}), 404

    return jsonify(doctor.to_json()), 200