from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.settings import db
from models.patient import Patient
from models.medical_record import MedicalRecord
from routes.auth_routes import role_required

record_bp = Blueprint("medical_record", __name__, url_prefix="/api/medical-record")

@record_bp.route("/", methods=["POST"])
@jwt_required()
@role_required("Paciente")
def create_or_update_record():
    user_id = get_jwt_identity()
    
    patient = Patient.query.filter_by(id_user=user_id).first()
    if not patient:
        return jsonify({"message": "Perfil de paciente no encontrado. Complete su perfil básico primero."}), 404

    data = request.get_json(silent=True) or {}
    blood_group = data.get("blood_group")
    allergies = data.get("allergies")
    antecedents = data.get("antecedents")

    record = MedicalRecord.query.filter_by(id_patient=patient.id_patient).first()

    if record:
        record.blood_group = blood_group
        record.allergies = allergies
        record.antecedents = antecedents
        message = "Ficha médica actualizada correctamente"
    else:
        record = MedicalRecord(
            id_patient=patient.id_patient,
            blood_group=blood_group,
            allergies=allergies,
            antecedents=antecedents)
        db.session.add(record)
        message = "Ficha médica creada correctamente"

    db.session.commit()
    return jsonify({"message": message, "medical_record": record.to_json()}), 200

@record_bp.route("/", methods=["GET"])
@jwt_required()
@role_required("Paciente")
def get_record():
    user_id = get_jwt_identity()
    
    patient = Patient.query.filter_by(id_user=user_id).first()
    if not patient:
        return jsonify({"message": "Perfil de paciente no encontrado."}), 404

    record = MedicalRecord.query.filter_by(id_patient=patient.id_patient).first()
    
    if not record:
        return jsonify({"message": "Aún no has creado tu ficha médica."}), 404

    return jsonify(record.to_json()), 200