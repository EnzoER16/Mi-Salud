from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.settings import db
from models.patient import Patient
from routes.auth_routes import role_required
from models.doctor import Doctor
from models.medical_record import MedicalRecord
import qrcode, io, base64

patient_bp = Blueprint("patient", __name__, url_prefix="/api/patient")

@patient_bp.route("/profile", methods=["POST"])
@jwt_required()
@role_required("Paciente")
def create_or_update_profile():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    dni = (data.get("dni") or "").strip()
    health_insurance = (data.get("health_insurance") or "").strip()
    plan = (data.get("plan") or "").strip()
    member_number = (data.get("member_number") or "").strip()
    address = (data.get("address") or "").strip()

    if not dni:
        return jsonify({"message": "Faltan datos obligatorios para completar el perfil"}), 400

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
    return jsonify({"message": message, "profile": patient.to_json()}), 200

@patient_bp.route("/profile", methods=["GET"])
@jwt_required()
@role_required("Paciente")
def get_profile():
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(id_user=user_id).first()

    if not patient:
        return jsonify({"message": "Perfil de paciente no encontrado. Por favor, complete sus datos."}), 404

    return jsonify(patient.to_json()), 200

@patient_bp.route("/my-qr", methods=["GET"])
@jwt_required()
@role_required("Paciente")
def generate_my_qr():
    """
    HU 6: Generación de 'DNI de Salud' (QR).
    El paciente solicita su código QR. El backend genera la imagen y la devuelve en Base64.
    """
    user_id = get_jwt_identity()
    patient = Patient.query.filter_by(id_user=user_id).first()
    
    if not patient:
        return jsonify({"message": "Perfil de paciente no encontrado. Complete sus datos primero."}), 404

    # El dato que contendrá el QR (el ID que el médico usará en la ruta de escaneo)
    qr_data = patient.id_patient

    # Configuración del código QR
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4)
    qr.add_data(qr_data)
    qr.make(fit=True)

    # Creamos la imagen
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convertimos la imagen a un string Base64 para poder enviarla dentro de un JSON
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

    return jsonify({
        "message": "Código QR generado exitosamente.",
        "qr_data": qr_data,
        # El frontend puede mostrar esta imagen usando: <img src="data:image/png;base64,iVBORw0KGgo..." />
        "qr_image_base64": f"data:image/png;base64,{img_base64}"}), 200

@patient_bp.route("/qr/<patient_id>", methods=["GET"])
@jwt_required()
@role_required("Doctor")
def get_patient_by_qr(patient_id):
    """
    HU 2 y HU 6: Acceso al perfil mediante código QR.
    El médico escanea el QR y el sistema devuelve los datos y la ficha médica del paciente.
    """
    # 1. Verificamos la identidad del médico que está haciendo el escaneo
    user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(id_user=user_id).first()
    
    if not doctor:
        return jsonify({"message": "Perfil de médico no encontrado. Acceso denegado."}), 403

    # 2. Buscamos el perfil del paciente usando el ID proveniente del QR
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"message": "Paciente no encontrado o código QR inválido."}), 404

    # 3. Buscamos la ficha médica asociada a ese paciente
    medical_record = MedicalRecord.query.filter_by(id_patient=patient.id_patient).first()

    # 4. Construimos la carga de datos (payload) que el médico necesita ver
    response_data = {
        "patient": patient.to_json(),
        "medical_record": medical_record.to_json() if medical_record else None}

    return jsonify(response_data), 200