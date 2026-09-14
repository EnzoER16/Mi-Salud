from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.settings import db
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

# Asumiendo que tu Blueprint se llama doctor_bp y tiene url_prefix='/api/doctor'
@doctor_bp.route("/patient/<string:dni>", methods=["GET"])
@jwt_required()
@role_required("Doctor")
def get_patient_by_dni(dni):
    # 1. Buscamos al paciente usando el DNI
    patient = Patient.query.filter_by(dni=dni).first()
    
    if not patient:
        return jsonify({"message": "No se encontró ningún paciente con ese DNI."}), 404

    # 2. Preparamos los datos de la ficha médica (si la tiene)
    # Gracias a db.relationship, podemos acceder directamente con patient.medical_record
    record_data = None
    if patient.medical_record:
        record_data = {
            "blood_group": patient.medical_record.blood_group,
            "allergies": patient.medical_record.allergies,
            "antecedents": patient.medical_record.antecedents
        }
    
    # 3. Devolvemos los datos estructurados para React
    return jsonify({
        "id_patient": patient.id_patient,
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

    # Buscamos todas las consultas de este médico (idealmente ordenadas, pero lo hacemos simple)
    consultations = MedicalConsultation.query.filter_by(id_doctor=doctor.id_doctor).all()
    
    history_data = []
    for c in consultations:
        # Buscamos al paciente de esta consulta para mostrar su DNI
        patient = Patient.query.get(c.id_patient)
        
        history_data.append({
            "id_consultation": c.id_consultation,
            # Si tu modelo al final guardó la fecha, la formateamos. Si no, mostramos un texto.
            "date": c.date.strftime("%d/%m/%Y") if hasattr(c, 'date') and c.date else "Fecha no registrada",
            "patient_dni": patient.dni if patient else "Desconocido",
            "diagnosis": c.diagnosis,
            "location": c.location
        })

    return jsonify(history_data), 200