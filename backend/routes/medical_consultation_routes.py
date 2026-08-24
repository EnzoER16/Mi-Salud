from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from config.settings import db
from models.patient import Patient
from models.doctor import Doctor
from models.medical_consultation import MedicalConsultation
from routes.auth_routes import role_required

consultation_bp = Blueprint("medical_consultation", __name__, url_prefix="/api/consultation")

@consultation_bp.route("/<patient_id>", methods=["POST"])
@jwt_required()
@role_required("Doctor")
def create_consultation(patient_id):
    user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(id_user=user_id).first()
    
    if not doctor:
        return jsonify({"message": "Perfil de médico no encontrado."}), 404

    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"message": "Paciente no encontrado en el sistema."}), 404

    data = request.get_json(silent=True) or {}
    location = (data.get("location") or "").strip()
    diagnosis = (data.get("diagnosis") or "").strip()

    if not location or not diagnosis:
        return jsonify({"message": "El lugar y el diagnóstico son obligatorios."}), 400

    new_consultation = MedicalConsultation(
        id_patient=patient.id_patient,
        id_doctor=doctor.id_doctor,
        location=location,
        diagnosis=diagnosis)

    db.session.add(new_consultation)
    db.session.commit()

    return jsonify({"message": "Consulta médica registrada exitosamente", "consultation": new_consultation.to_json()}), 201

@consultation_bp.route("/history/<patient_id>", methods=["GET"])
@jwt_required()
def get_consultation_history(patient_id):
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")

    if role == "Paciente":
        patient_profile = Patient.query.filter_by(id_user=user_id).first()
        if not patient_profile or patient_profile.id_patient != patient_id:
            return jsonify({"message": "Acceso denegado. Solo puedes ver tu propio historial."}), 403

    elif role == "Doctor":
        doctor_profile = Doctor.query.filter_by(id_user=user_id).first()
        if not doctor_profile:
            return jsonify({"message": "Perfil de médico incompleto."}), 403

    consultations = MedicalConsultation.query.filter_by(id_patient=patient_id).order_by(MedicalConsultation.date.desc()).all()

    return jsonify([c.to_json() for c in consultations]), 200