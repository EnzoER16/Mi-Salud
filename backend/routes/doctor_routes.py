from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.settings import db
from models.doctor import Doctor
from models.patient import Patient
from models.medical_consultation import MedicalConsultation
from routes.auth_routes import role_required
from datetime import datetime, timezone
from routes.medical_record_routes import medical_record_payload
from routes.patient_details_routes import patient_details_payload
from routes.vaccine_routes import vaccines_payload

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

    if len(specialty) < 3 or len(license_number) < 4:
        return jsonify({"message": "La especialidad y la matrícula deben ser válidas"}), 400

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

    # 2. Ficha médica completa (si la tiene): la de siempre + peso, estatura, condiciones crónicas, etc.
    record_data = medical_record_payload(patient)

    # 3. Datos personales, contactos de emergencia y carnet de vacunas, para tener contexto en la consulta
    personal = patient_details_payload(patient)
    full_name = " ".join(p for p in (personal.get("first_name"), personal.get("last_name")) if p) or patient.user.username
    contacts = [c.to_json() for c in sorted(patient.emergency_contacts, key=lambda c: c.created_at or datetime.min)]

    # 4. Devolvemos los datos estructurados para React
    return jsonify({
        "id_patient": patient.id_patient,
        "name": full_name,
        "dni": patient.dni,
        "health_insurance": patient.health_insurance,
        "plan": patient.plan,
        "medical_record": record_data,
        "personal": {
            "age": personal.get("age"),
            "sex": personal.get("sex"),
            "phone": personal.get("phone"),
            "locality": personal.get("locality"),
        },
        "emergency_contacts": contacts,
        "vaccines": vaccines_payload(patient.id_patient),
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