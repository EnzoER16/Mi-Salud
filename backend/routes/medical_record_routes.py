from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.settings import db
from models.patient import Patient
from models.medical_record import MedicalRecord
from models.patient_health import PatientHealth, empty_patient_health_json
from routes.auth_routes import role_required
import validators as v

record_bp = Blueprint("medical_record", __name__, url_prefix="/api/medical-record")

BLOOD_GROUPS = ("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Desconocido")

# Campos que viven en `medical_records` (los de siempre)
RECORD_SPEC = {
    "blood_group": v.choice("El grupo sanguíneo", BLOOD_GROUPS),
    "allergies": v.text("Las alergias", 2000),
    "antecedents": v.text("Los antecedentes", 2000),
}

# Campos nuevos, que viven en `patient_health`
HEALTH_SPEC = {
    "weight_kg": v.number("El peso", 1, 500),
    "height_cm": v.number("La estatura", 30, 260, integer=True),
    "conditions": v.string_list("Las condiciones crónicas"),
    "intolerances": v.text("Las intolerancias", 2000),
    "surgeries": v.text("Las cirugías e internaciones", 2000),
    "family_history": v.text("Los antecedentes familiares", 2000),
    "current_medication": v.text("La medicación habitual", 2000),
    "wears_glasses": v.boolean("Usa anteojos"),
    "last_checkup": v.day("La fecha del último control"),
    "last_dental_checkup": v.day("La fecha del último control dental"),
    "primary_doctor_name": v.text("El médico de cabecera", 100),
    "primary_doctor_phone": v.phone("El teléfono del médico de cabecera"),
    "care_center": v.text("El hospital o centro de atención", 120),
}


def medical_record_payload(patient):
    """Ficha médica completa (la de siempre + los datos nuevos). La usa la ficha del paciente y la vista del médico.
    Devuelve None si el paciente todavía no creó su ficha."""
    record = patient.medical_record
    if not record:
        return None
    payload = record.to_json()
    payload.update(patient.health.to_json() if patient.health else empty_patient_health_json())
    return payload


@record_bp.route("/", methods=["POST"])
@jwt_required()
@role_required("Paciente")
def create_or_update_record():
    user_id = get_jwt_identity()

    patient = Patient.query.filter_by(id_user=user_id).first()
    if not patient:
        return jsonify({"message": "Perfil de paciente no encontrado. Complete su perfil básico primero."}), 404

    data = request.get_json(silent=True) or {}
    try:
        record_values = v.parse_fields(data, RECORD_SPEC)
        health_values = v.parse_fields(data, HEALTH_SPEC)
    except v.ValidationError as err:
        return jsonify({"message": str(err)}), 400

    # Solo se actualizan las claves que llegaron: así guardar la ficha vieja no borra los datos nuevos (ni al revés)
    record = patient.medical_record
    if record:
        message = "Ficha médica actualizada correctamente"
    else:
        record = MedicalRecord(id_patient=patient.id_patient)
        db.session.add(record)
        message = "Ficha médica creada correctamente"
    for key, value in record_values.items():
        setattr(record, key, value)

    if health_values:
        health = patient.health
        if not health:
            health = PatientHealth(id_patient=patient.id_patient)
            db.session.add(health)
        for key, value in health_values.items():
            setattr(health, key, value)

    db.session.commit()
    db.session.refresh(patient)
    return jsonify({"message": message, "medical_record": medical_record_payload(patient)}), 200


@record_bp.route("/", methods=["GET"])
@jwt_required()
@role_required("Paciente")
def get_record():
    user_id = get_jwt_identity()

    patient = Patient.query.filter_by(id_user=user_id).first()
    if not patient:
        return jsonify({"message": "Perfil de paciente no encontrado."}), 404

    payload = medical_record_payload(patient)
    if not payload:
        return jsonify({"message": "Aún no has creado tu ficha médica."}), 404

    return jsonify(payload), 200
