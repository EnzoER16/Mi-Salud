from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.settings import db
from models.patient import Patient
from models.treatment import Treatment
from models.medication_intake import MedicationIntake
from models.medical_consultation import MedicalConsultation
from routes.auth_routes import role_required
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
intake_bp = Blueprint("medication_intake", __name__, url_prefix="/api/intake")

@intake_bp.route("/today", methods=["GET"])
@jwt_required()
@role_required("Paciente")
def get_todays_intakes():
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(id_user=user_id).first()
    
    if not patient:
        return jsonify({"message": "Perfil de paciente no encontrado"}), 404

    # Las fechas de la BD representan UTC sin tzinfo. Se consulta el día local
    # de Argentina como intervalo UTC, sin depender de date() de SQLite.
    local_now = datetime.now(ZoneInfo('America/Argentina/Buenos_Aires'))
    start_local = datetime.combine(local_now.date(), datetime.min.time(), tzinfo=ZoneInfo('America/Argentina/Buenos_Aires'))
    start_utc = start_local.astimezone(timezone.utc).replace(tzinfo=None)
    end_utc = (start_local + timedelta(days=1)).astimezone(timezone.utc).replace(tzinfo=None)

    todays_intakes = (db.session.query(MedicationIntake)
        .join(Treatment).join(MedicalConsultation)
        .filter(MedicalConsultation.id_patient == patient.id_patient,
                MedicationIntake.scheduled_time >= start_utc,
                MedicationIntake.scheduled_time < end_utc)
        .order_by(MedicationIntake.scheduled_time.asc()).all())

    counts = {}
    result = []
    for intake in todays_intakes:
        treatment = intake.treatment
        if treatment.id_treatment not in counts:
            all_intakes = treatment.intakes
            counts[treatment.id_treatment] = (
                sum(item.status == 'Tomado' for item in all_intakes), len(all_intakes)
            )
        consultation = db.session.get(MedicalConsultation, treatment.id_consultation)
        data = intake.to_json()
        data.update({
            'medication': treatment.medication,
            'dose': treatment.dose,
            'diagnosis': consultation.diagnosis if consultation else None,
            'frequency_hours': treatment.frequency_hours,
            'duration_days': treatment.duration_days,
            'instructions': treatment.instructions,
            'treatment_taken': counts[treatment.id_treatment][0],
            'treatment_total': counts[treatment.id_treatment][1],
        })
        result.append(data)
    return jsonify(result), 200


@intake_bp.route("/<intake_id>/check", methods=["PATCH"])
@jwt_required()
@role_required("Paciente")
def check_intake(intake_id):
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(id_user=user_id).first()

    intake = db.session.query(MedicationIntake).join(Treatment).join(MedicalConsultation).filter(
        MedicationIntake.id_intake == intake_id,
        MedicalConsultation.id_patient == patient.id_patient).first()

    if not intake:
        return jsonify({"message": "Toma no encontrada"}), 404
    if intake.status != "Pendiente":
        return jsonify({"message": f"Esta toma ya fue marcada como {intake.status.lower()}"}), 400

    intake.status = "Tomado"
    intake.taken_time = datetime.now(timezone.utc)
    db.session.commit()

    treatment = Treatment.query.get(intake.id_treatment)
    return jsonify({"message": "Toma registrada exitosamente.", "compliance_percentage": treatment.calculate_compliance(), "intake": intake.to_json()}), 200


@intake_bp.route("/<intake_id>/skip", methods=["PATCH"])
@jwt_required()
@role_required("Paciente")
def skip_intake(intake_id):
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(id_user=user_id).first()

    intake = db.session.query(MedicationIntake).join(Treatment).join(MedicalConsultation).filter(
        MedicationIntake.id_intake == intake_id,
        MedicalConsultation.id_patient == patient.id_patient).first()

    if not intake or intake.status != "Pendiente":
        return jsonify({"message": "Toma no encontrada o ya procesada"}), 404

    intake.status = "Omitido"
    db.session.commit()

    treatment = Treatment.query.get(intake.id_treatment)
    return jsonify({"message": "Toma salteada.", "compliance_percentage": treatment.calculate_compliance(), "intake": intake.to_json()}), 200


@intake_bp.route("/<intake_id>/postpone", methods=["PATCH"])
@jwt_required()
@role_required("Paciente")
def postpone_intake(intake_id):
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(id_user=user_id).first()

    intake = db.session.query(MedicationIntake).join(Treatment).join(MedicalConsultation).filter(
        MedicationIntake.id_intake == intake_id,
        MedicalConsultation.id_patient == patient.id_patient).first()

    if not intake or intake.status != "Pendiente":
        return jsonify({"message": "Toma no encontrada o ya procesada"}), 404

    # Le sumamos 1 hora al horario programado
    intake.scheduled_time = intake.scheduled_time + timedelta(hours=1)
    db.session.commit()

    return jsonify({"message": "Toma pospuesta por 1 hora.", "intake": intake.to_json()}), 200