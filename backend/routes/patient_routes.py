from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.settings import db
from models.user import User
from models.patient import Patient
from routes.auth_routes import role_required
from models.doctor import Doctor
from models.medical_record import MedicalRecord
from models.medical_consultation import MedicalConsultation
import qrcode, io, base64

patient_bp = Blueprint("patient", __name__, url_prefix="/api/patient")

@patient_bp.route("/profile", methods=["POST"])
@jwt_required()
@role_required("Paciente")
def create_or_update_profile():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    username = (data.get("username") or "").strip()
    dni = (data.get("dni") or "").strip()
    health_insurance = (data.get("health_insurance") or "").strip()
    plan = (data.get("plan") or "").strip()
    member_number = (data.get("member_number") or "").strip()
    address = (data.get("address") or "").strip()

    if not dni or not username:
        return jsonify({"message": "El nombre y el DNI son obligatorios"}), 400

    if not dni.isdigit() or not (7 <= len(dni) <= 8):
        return jsonify({"message": "El DNI debe tener entre 7 y 8 caracteres numéricos"}), 400

    # Actualizamos el nombre en la tabla users
    user = db.session.get(User, user_id)
    if user:
        user.username = username

    patient = Patient.query.filter_by(id_user=user_id).first()

    if patient:
        patient.dni = dni
        patient.health_insurance = health_insurance
        patient.plan = plan
        patient.member_number = member_number
        patient.address = address
        message = "Perfil de paciente actualizado exitosamente"
    else:
        patient = Patient(
            id_user=user_id, 
            dni=dni, 
            health_insurance=health_insurance, 
            plan=plan, 
            member_number=member_number, 
            address=address)
        db.session.add(patient)
        message = "Perfil de paciente creado exitosamente"

    db.session.commit()
    
    response_data = patient.to_json()
    response_data["username"] = user.username
    return jsonify({"message": message, "profile": response_data}), 200

@patient_bp.route("/profile", methods=["GET"])
@jwt_required()
@role_required("Paciente")
def get_profile():
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(id_user=user_id).first()

    if not patient:
        return jsonify({"message": "Perfil de paciente no encontrado. Por favor, complete sus datos."}), 404

    # Agregamos el nombre desde la tabla users para que el frontend lo pueda mostrar
    response_data = patient.to_json()
    response_data["username"] = patient.user.username
    return jsonify(response_data), 200

@patient_bp.route("/my-qr", methods=["GET"])
@jwt_required()
@role_required("Paciente")
def generate_my_qr():
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(id_user=user_id).first()
    
    if not patient:
        return jsonify({"message": "Perfil de paciente no encontrado. Complete sus datos primero."}), 404

    qr_data = patient.id_patient
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
    qr.add_data(qr_data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

    return jsonify({
        "message": "Código QR generado exitosamente.",
        "qr_data": qr_data,
        "qr_image_base64": f"data:image/png;base64,{img_base64}"}), 200

@patient_bp.route("/qr/<patient_id>", methods=["GET"])
@jwt_required()
@role_required("Doctor")
def get_patient_by_qr(patient_id):
    user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(id_user=user_id).first()
    
    if not doctor:
        return jsonify({"message": "Perfil de médico no encontrado. Acceso denegado."}), 403

    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"message": "Paciente no encontrado o código QR inválido."}), 404

    # Armamos la misma estructura que usamos en la búsqueda por DNI
    record_data = None
    if patient.medical_record:
        record_data = {
            "blood_group": patient.medical_record.blood_group,
            "allergies": patient.medical_record.allergies,
            "antecedents": patient.medical_record.antecedents
        }

    return jsonify({
        "id_patient": patient.id_patient,
        "name": patient.user.username,
        "dni": patient.dni,
        "health_insurance": patient.health_insurance,
        "plan": patient.plan,
        "medical_record": record_data
    }), 200

@patient_bp.route("/history", methods=["GET"])
@jwt_required()
@role_required("Paciente")
def get_patient_history():
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(id_user=user_id).first()
    
    if not patient:
        return jsonify({"message": "Perfil de paciente no encontrado."}), 404

    consultations = MedicalConsultation.query.filter_by(id_patient=patient.id_patient).all()
    
    history_data = []
    for c in consultations:
        history_data.append({
            "id_consultation": c.id_consultation,
            "date": c.date.strftime("%d/%m/%Y") if hasattr(c, 'date') and c.date else "Fecha no registrada",
            "diagnosis": c.diagnosis,
            "location": c.location
        })

    return jsonify(history_data), 200