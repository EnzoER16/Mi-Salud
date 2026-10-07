from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from config.settings import db
from models.doctor import Doctor
from models.patient import Patient
from models.treatment import Treatment
from models.treatment_history import TreatmentHistory
from models.medication_intake import MedicationIntake
from models.medical_consultation import MedicalConsultation
from routes.auth_routes import role_required
from datetime import datetime, timedelta, timezone
from models.notification import Notification

treatment_bp = Blueprint("treatment", __name__, url_prefix="/api/treatment")

def _as_utc(dt):
    """MySQL devuelve datetimes sin zona; los marcamos como UTC."""
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

@treatment_bp.route("/<treatment_id>", methods=["PATCH"])
@jwt_required()
@role_required("Doctor")
def edit_treatment(treatment_id):
    user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(id_user=user_id).first()
    if not doctor:
        return jsonify({"message": "Acceso denegado. Perfil de médico no encontrado."}), 403

    treatment = db.session.get(Treatment, treatment_id)
    if not treatment:
        return jsonify({"message": "Tratamiento no encontrado."}), 404

    consultation = db.session.get(MedicalConsultation, treatment.id_consultation)
    if consultation.id_doctor != doctor.id_doctor:
        return jsonify({"message": "Solo el médico que recetó puede editar este tratamiento."}), 403

    now = datetime.now(timezone.utc)
    start = _as_utc(consultation.date)

    # Solo se editan tratamientos activos
    if start + timedelta(days=treatment.duration_days) <= now:
        return jsonify({"message": "El tratamiento ya finalizó y no puede editarse."}), 400

    data = request.get_json(silent=True) or {}
    try:
        new_dose = str(data.get("dose", treatment.dose)).strip()
        new_frequency_hours = int(data.get("frequency_hours", treatment.frequency_hours))
        new_duration_days = int(data.get("duration_days", treatment.duration_days))
    except (TypeError, ValueError):
        return jsonify({"message": "Frecuencia y duración deben ser números."}), 400

    if not new_dose or new_frequency_hours < 1 or new_duration_days < 1:
        return jsonify({"message": "Dosis, frecuencia y duración deben ser válidas."}), 400

    # MSP-50: armar el historial de cambios
    changes = []
    if treatment.dose != new_dose:
        changes.append(f"Dosis cambiada de '{treatment.dose}' a '{new_dose}'")
    if treatment.frequency_hours != new_frequency_hours:
        changes.append(f"Frecuencia cambiada de cada {treatment.frequency_hours}hs a cada {new_frequency_hours}hs")
    if treatment.duration_days != new_duration_days:
        changes.append(f"Duración cambiada de {treatment.duration_days} días a {new_duration_days} días")

    if not changes:
        return jsonify({"message": "No se detectaron cambios para actualizar."}), 400

    db.session.add(TreatmentHistory(
        id_treatment=treatment.id_treatment,
        changes_details=" | ".join(changes)))

    # MSP-49: actualizar parámetros
    treatment.dose = new_dose
    treatment.frequency_hours = new_frequency_hours
    treatment.duration_days = new_duration_days

    # MSP-51: borrar tomas pendientes futuras y regenerarlas
    db.session.query(MedicationIntake).filter(
        MedicationIntake.id_treatment == treatment.id_treatment,
        MedicationIntake.status == "Pendiente",
        MedicationIntake.scheduled_time > now).delete()

    end_time = start + timedelta(days=new_duration_days)
    current_time = now + timedelta(hours=new_frequency_hours)
    while current_time < end_time:
        db.session.add(MedicationIntake(
            id_treatment=treatment.id_treatment,
            scheduled_time=current_time))
        current_time += timedelta(hours=new_frequency_hours)

    patient = db.session.get(Patient, consultation.id_patient)
    db.session.add(Notification(
        id_user=patient.id_user,
        message=f"{doctor.user.username} hizo cambios en tu tratamiento de {treatment.medication}",
        details=" · ".join(changes)))

    db.session.commit()

    return jsonify({
        "message": "Tratamiento y recordatorios actualizados exitosamente.",
        "changes_applied": changes,
        "treatment": treatment.to_json()}), 200

@treatment_bp.route("/<consultation_id>", methods=["POST"])
@jwt_required()
@role_required("Doctor")
def add_treatment(consultation_id):
    user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(id_user=user_id).first()
    if not doctor:
        return jsonify({"message": "Acceso denegado. Perfil de médico no encontrado."}), 403

    consultation = MedicalConsultation.query.get(consultation_id)
    if not consultation:
        return jsonify({"message": "Consulta no encontrada."}), 404

    data = request.get_json(silent=True) or {}
    medication = data.get("medication")
    dose = data.get("dose")
    frequency_hours = data.get("frequency_hours")
    duration_days = data.get("duration_days")

    if not all([medication, dose, frequency_hours, duration_days]):
        return jsonify({"message": "Faltan parámetros del tratamiento."}), 400

    new_treatment = Treatment(
        id_consultation=consultation_id,
        medication=medication,
        dose=dose,
        frequency_hours=int(frequency_hours),
        duration_days=int(duration_days))
    db.session.add(new_treatment)
    db.session.commit()

    start_time = datetime.now(timezone.utc)
    total_hours = int(duration_days) * 24

    current_time = start_time
    end_time = start_time + timedelta(hours=total_hours)

    while current_time < end_time:
        new_intake = MedicationIntake(
            id_treatment=new_treatment.id_treatment,
            scheduled_time=current_time)
        db.session.add(new_intake)
        current_time += timedelta(hours=int(frequency_hours))

    # Notificar al paciente del nuevo tratamiento
    patient = db.session.get(Patient, consultation.id_patient)
    db.session.add(Notification(
        id_user=patient.id_user,
        message=f"{doctor.user.username} te recetó un nuevo tratamiento: {medication}",
        details=f"{dose} cada {frequency_hours} hs durante {duration_days} días"))

    db.session.commit()

    return jsonify({
        "message": "Tratamiento y tomas generadas exitosamente",
        "treatment": new_treatment.to_json()}), 201

@treatment_bp.route("/intake/<intake_id>/check", methods=["PATCH"])
@jwt_required()
@role_required("Paciente")
def check_intake(intake_id):
    intake = MedicationIntake.query.get(intake_id)
    if not intake:
        return jsonify({"message": "Toma no encontrada"}), 404

    if intake.status == "Tomado":
        return jsonify({"message": "Esta medicación ya fue registrada como tomada."}), 400

    intake.status = "Tomado"
    intake.taken_time = datetime.now(timezone.utc)
    db.session.commit()

    treatment = Treatment.query.get(intake.id_treatment)
    compliance = treatment.calculate_compliance()

    return jsonify({
        "message": "Toma registrada exitosamente.",
        "compliance_percentage": compliance,
        "intake": intake.to_json()}), 200

@treatment_bp.route("/my-treatments", methods=["GET"])
@jwt_required()
@role_required("Paciente")
def get_my_treatments():
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(id_user=user_id).first()

    if not patient:
        return jsonify({"message": "Paciente no encontrado"}), 404

    # Buscamos los tratamientos cruzando la tabla de Consultas
    treatments = db.session.query(Treatment).join(MedicalConsultation).filter(
        MedicalConsultation.id_patient == patient.id_patient
    ).all()

    # El to_json() del modelo ya incluye el "compliance" con el porcentaje
    return jsonify([t.to_json() for t in treatments]), 200

@treatment_bp.route("/patient/<patient_id>", methods=["GET"])
@jwt_required()
@role_required("Doctor")
def get_patient_treatments(patient_id):
    now = datetime.now(timezone.utc)
    rows = db.session.query(Treatment, MedicalConsultation).join(
        MedicalConsultation, Treatment.id_consultation == MedicalConsultation.id_consultation
    ).filter(
        MedicalConsultation.id_patient == patient_id
    ).order_by(MedicalConsultation.date.desc()).all()

    result = []
    for t, c in rows:
        item = t.to_json()
        item["is_active"] = _as_utc(c.date) + timedelta(days=t.duration_days) > now
        result.append(item)
    return jsonify(result), 200


@treatment_bp.route("/<treatment_id>/history", methods=["GET"])
@jwt_required()
@role_required("Doctor")
def get_treatment_history(treatment_id):
    history = TreatmentHistory.query.filter_by(
        id_treatment=treatment_id
    ).order_by(TreatmentHistory.date_modified.desc()).all()
    return jsonify([h.to_json() for h in history]), 200