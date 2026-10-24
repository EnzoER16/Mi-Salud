from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.settings import db
from models.user import User
from models.doctor import Doctor
from models.patient import Patient
from models.medical_consultation import MedicalConsultation
from routes.auth_routes import role_required
from datetime import datetime, timezone

doctor_bp = Blueprint("doctor", __name__, url_prefix="/api/doctor")

@doctor_bp.route("/profile", methods=["POST"])
@jwt_required()
@role_required("Doctor")
def create_or_update_profile():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    username = (data.get("username") or "").strip()
    specialty = (data.get("specialty") or "").strip()
    license_number = (data.get("license_number") or "").strip()

    if not username or not specialty or not license_number:
        return jsonify({"message": "El nombre, la especialidad y la matrícula son obligatorios"}), 400

    if len(specialty) < 3 or len(license_number) < 4:
        return jsonify({"message": "La especialidad y la matrícula deben ser válidas"}), 400

    user = db.session.get(User, user_id)
    if user:
        user.username = username

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
    
    response_data = doctor.to_json()
    response_data["username"] = user.username
    return jsonify({"message": message, "profile": response_data}), 200

@doctor_bp.route("/profile", methods=["GET"])
@jwt_required()
@role_required("Doctor")
def get_profile():
    user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(id_user=user_id).first()

    if not doctor:
        return jsonify({"message": "Perfil de médico no encontrado. Por favor, complete sus datos."}), 404

    response_data = doctor.to_json()
    response_data["username"] = doctor.user.username
    return jsonify(response_data), 200

@doctor_bp.route("/patient/<string:dni>", methods=["GET"])
@jwt_required()
@role_required("Doctor")
def get_patient_by_dni(dni):
    patient = Patient.query.filter_by(dni=dni).first()
    
    if not patient:
        return jsonify({"message": "No se encontró ningún paciente con ese DNI."}), 404

    record_data = None
    if patient.medical_record:
        record_data = {
            "blood_group": patient.medical_record.blood_group,
            "allergies": patient.medical_record.allergies,
            "antecedents": patient.medical_record.antecedents
        }
    
    return jsonify({
        "id_patient": patient.id_patient,
        "name": patient.user.username,
        "dni": patient.dni,
        "health_insurance": patient.health_insurance,
        "plan": patient.plan,
        "medical_record": record_data
    }), 200

@doctor_bp.route("/history", methods=["GET"])
@jwt_required()
@role_required("Doctor")
def get_doctor_history():
    user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(id_user=user_id).first()
    
    if not doctor:
        return jsonify({"message": "Perfil de médico no encontrado."}), 403

    consultations = MedicalConsultation.query.filter_by(id_doctor=doctor.id_doctor).all()
    
    history_data = []
    for c in consultations:
        patient = Patient.query.get(c.id_patient)
        history_data.append({
            "id_consultation": c.id_consultation,
            "date": c.date.strftime("%d/%m/%Y") if hasattr(c, 'date') and c.date else "Fecha no registrada",
            "patient_dni": patient.dni if patient else "Desconocido",
            "diagnosis": c.diagnosis,
            "location": c.location
        })

    return jsonify(history_data), 200