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

treatment_bp = Blueprint("treatment", __name__, url_prefix="/api/treatment")

@treatment_bp.route("/<treatment_id>", methods=["PATCH"])
@jwt_required()
@role_required("Doctor")
def edit_treatment(treatment_id):
    """
    HU 12: Edición de indicaciones de tratamiento activo.
    Permite al médico ajustar dosis, frecuencia y duración.
    """
    user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(id_user=user_id).first()
    
    if not doctor:
        return jsonify({"message": "Acceso denegado. Perfil de médico no encontrado."}), 403

    treatment = Treatment.query.get(treatment_id)
    if not treatment:
        return jsonify({"message": "Tratamiento no encontrado."}), 404

    data = request.get_json(silent=True) or {}
    new_dose = data.get("dose", treatment.dose)
    new_frequency_hours = int(data.get("frequency_hours", treatment.frequency_hours))
    new_duration_days = int(data.get("duration_days", treatment.duration_days))

    # 1. Armar el registro de los cambios para el historial
    changes = []
    if treatment.dose != new_dose:
        changes.append(f"Dosis cambiada de '{treatment.dose}' a '{new_dose}'")
    if treatment.frequency_hours != new_frequency_hours:
        changes.append(f"Frecuencia cambiada de cada {treatment.frequency_hours}hs a cada {new_frequency_hours}hs")
    if treatment.duration_days != new_duration_days:
        changes.append(f"Duración cambiada de {treatment.duration_days} días a {new_duration_days} días")

    if not changes:
        return jsonify({"message": "No se detectaron cambios para actualizar."}), 400

    # Guardar el historial en la base de datos
    history_record = TreatmentHistory(
        id_treatment=treatment.id_treatment,
        changes_details=" | ".join(changes))
    db.session.add(history_record)

    # 2. Actualizar los datos del tratamiento
    treatment.dose = new_dose
    treatment.frequency_hours = new_frequency_hours
    treatment.duration_days = new_duration_days

    # 3. Actualizar los recordatorios (Eliminar pendientes futuros y regenerar)
    now = datetime.now(timezone.utc)
    
    # Eliminamos las tomas pendientes que estaban programadas para el futuro
    db.session.query(MedicationIntake).filter(
        MedicationIntake.id_treatment == treatment.id_treatment,
        MedicationIntake.status == "Pendiente",
        MedicationIntake.scheduled_time > now).delete()

    # Recalculamos la fecha de finalización basada en la consulta original
    consultation = MedicalConsultation.query.get(treatment.id_consultation)
    end_time = consultation.date + timedelta(days=new_duration_days)

    # Empezamos a programar las nuevas tomas a partir de ahora + la nueva frecuencia
    current_time = now + timedelta(hours=new_frequency_hours)

    while current_time < end_time:
        new_intake = MedicationIntake(
            id_treatment=treatment.id_treatment,
            scheduled_time=current_time)
        db.session.add(new_intake)
        current_time += timedelta(hours=new_frequency_hours)

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