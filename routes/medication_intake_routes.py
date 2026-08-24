from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.settings import db
from models.patient import Patient
from models.treatment import Treatment
from models.medication_intake import MedicationIntake
from models.medical_consultation import MedicalConsultation
from routes.auth_routes import role_required
from datetime import datetime, timezone

intake_bp = Blueprint("medication_intake", __name__, url_prefix="/api/intake")

@intake_bp.route("/today", methods=["GET"])
@jwt_required()
@role_required("Paciente")
def get_todays_intakes():
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(id_user=user_id).first()
    
    if not patient:
        return jsonify({"message": "Perfil de paciente no encontrado"}), 404

    today = datetime.now(timezone.utc).date()
    
    todays_intakes = db.session.query(MedicationIntake).join(Treatment).join(MedicalConsultation).filter(
        MedicalConsultation.id_patient == patient.id_patient,
        db.func.date(MedicationIntake.scheduled_time) == today).order_by(MedicationIntake.scheduled_time.asc()).all()

    return jsonify([intake.to_json() for intake in todays_intakes]), 200


@intake_bp.route("/<intake_id>/check", methods=["PATCH"])
@jwt_required()
@role_required("Paciente")
def check_intake(intake_id):
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(id_user=user_id).first()

    if not patient:
        return jsonify({"message": "Perfil de paciente no encontrado"}), 404

    intake = db.session.query(MedicationIntake).join(Treatment).join(MedicalConsultation).filter(
        MedicationIntake.id_intake == intake_id,
        MedicalConsultation.id_patient == patient.id_patient).first()

    if not intake:
        return jsonify({"message": "Toma no encontrada o no tienes permisos sobre ella"}), 404

    if intake.status == "Tomado":
        return jsonify({"message": "Esta medicación ya fue registrada como tomada"}), 400

    intake.status = "Tomado"
    intake.taken_time = datetime.now(timezone.utc)
    db.session.commit()

    treatment = Treatment.query.get(intake.id_treatment)
    compliance = treatment.calculate_compliance()

    return jsonify({
        "message": "Toma registrada exitosamente.",
        "compliance_percentage": compliance,
        "intake": intake.to_json()}), 200