from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.settings import db
from models.patient import Patient
from routes.auth_routes import role_required 

patient_bp = Blueprint("patient", __name__, url_prefix="/api/patient")

@patient_bp.route("/profile", methods=["POST"])
@jwt_required()
@role_required("Paciente")
def create_or_update_profile():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    dni = (data.get("dni") or "").strip()
    health_insurance = (data.get("health_insurance") or "").strip()
    plan = (data.get("plan") or "").strip()
    member_number = (data.get("member_number") or "").strip()
    address = (data.get("address") or "").strip()

    if not dni or not health_insurance or not member_number or not address:
        return jsonify({"message": "Faltan datos obligatorios para completar el perfil"}), 400

    patient = Patient.query.filter_by(id_user=user_id).first()

    if patient:
        patient.dni = dni
        patient.health_insurance = health_insurance
        patient.plan = plan
        patient.member_number = member_number
        patient.address = address
        message = "Perfil de paciente actualizado exitosamente"
    else:
        patient = Patient(
            id_user=user_id, 
            dni=dni, 
            health_insurance=health_insurance, 
            plan=plan, 
            member_number=member_number, 
            address=address)
        db.session.add(patient)
        message = "Perfil de paciente creado exitosamente"

    db.session.commit()
    return jsonify({"message": message, "profile": patient.to_json()}), 200

@patient_bp.route("/profile", methods=["GET"])
@jwt_required()
@role_required("Paciente")
def get_profile():
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(id_user=user_id).first()

    if not patient:
        return jsonify({"message": "Perfil de paciente no encontrado. Por favor, complete sus datos."}), 404

    return jsonify(patient.to_json()), 200