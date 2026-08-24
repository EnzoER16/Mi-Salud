from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from config.settings import db
from models.doctor import Doctor
from models.patient import Patient
from models.treatment import Treatment
from models.medication_intake import MedicationIntake
from models.medical_consultation import MedicalConsultation
from routes.auth_routes import role_required
from datetime import datetime, timedelta, timezone

treatment_bp = Blueprint("treatment", __name__, url_prefix="/api/treatment")

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