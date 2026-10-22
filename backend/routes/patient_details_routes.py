from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps

from config.settings import db
from models.patient import Patient
from models.patient_details import PatientDetails, empty_patient_details_json
from models.emergency_contact import EmergencyContact
from routes.auth_routes import role_required
import validators as v

# Comparte el prefijo /api/patient con patient_routes (las rutas no se pisan: /details y /emergency-contacts)
patient_details_bp = Blueprint("patient_details", __name__, url_prefix="/api/patient")

SEX_OPTIONS = ("Femenino", "Masculino", "Otro", "Prefiero no decirlo")
MARITAL_OPTIONS = ("Soltero/a", "Casado/a", "Unión convivencial", "Divorciado/a", "Viudo/a")
MAX_CONTACTS = 5

DETAILS_SPEC = {
    "first_name": v.text("El nombre", 60),
    "last_name": v.text("El apellido", 60),
    "birth_date": v.day("La fecha de nacimiento"),
    "sex": v.choice("El sexo", SEX_OPTIONS),
    "marital_status": v.choice("El estado civil", MARITAL_OPTIONS),
    "occupation": v.text("La ocupación", 80),
    "phone": v.phone("El teléfono"),
    "locality": v.text("La localidad", 80),
    "province": v.text("La provincia", 60),
    "postal_code": v.postal_code("El código postal"),
}

CONTACT_SPEC = {
    "name": v.text("El nombre del contacto", 80, required=True),
    "relationship": v.text("El parentesco", 40),
    "phone": v.phone("El teléfono del contacto", required=True),
}


def patient_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        patient = Patient.query.filter_by(id_user=get_jwt_identity()).first()
        if not patient:
            return jsonify({"message": "Perfil de paciente no encontrado. Completá tus datos primero."}), 404
        g.patient = patient
        return fn(*args, **kwargs)
    return wrapper


def patient_details_payload(patient):
    """Datos personales completos (los de `patients` + los ampliados). También los usa la vista del médico."""
    details = patient.details.to_json() if patient.details else empty_patient_details_json()
    details["email"] = patient.user.email if patient.user else None
    details["dni"] = patient.dni
    details["address"] = patient.address
    return details


@patient_details_bp.route("/details", methods=["GET"])
@jwt_required()
@role_required("Paciente")
@patient_required
def get_details():
    return jsonify(patient_details_payload(g.patient)), 200


@patient_details_bp.route("/details", methods=["PUT"])
@jwt_required()
@role_required("Paciente")
@patient_required
def save_details():
    data = request.get_json(silent=True) or {}
    try:
        cleaned = v.parse_fields(data, DETAILS_SPEC)
    except v.ValidationError as err:
        return jsonify({"message": str(err)}), 400

    details = g.patient.details
    if not details:
        details = PatientDetails(id_patient=g.patient.id_patient)
        db.session.add(details)
    for key, value in cleaned.items():
        setattr(details, key, value)

    db.session.commit()
    return jsonify({"message": "Datos personales guardados.", "details": patient_details_payload(g.patient)}), 200


# ---------- Contactos de emergencia ----------

def _owned_contact(contact_id):
    return EmergencyContact.query.filter_by(id_contact=contact_id, id_patient=g.patient.id_patient).first()


@patient_details_bp.route("/emergency-contacts", methods=["GET"])
@jwt_required()
@role_required("Paciente")
@patient_required
def list_contacts():
    contacts = (EmergencyContact.query.filter_by(id_patient=g.patient.id_patient)
                .order_by(EmergencyContact.created_at).all())
    return jsonify([c.to_json() for c in contacts]), 200


@patient_details_bp.route("/emergency-contacts", methods=["POST"])
@jwt_required()
@role_required("Paciente")
@patient_required
def add_contact():
    data = request.get_json(silent=True) or {}
    try:
        cleaned = v.parse_fields({k: data.get(k) for k in CONTACT_SPEC}, CONTACT_SPEC)
    except v.ValidationError as err:
        return jsonify({"message": str(err)}), 400

    total = EmergencyContact.query.filter_by(id_patient=g.patient.id_patient).count()
    if total >= MAX_CONTACTS:
        return jsonify({"message": f"Podés cargar hasta {MAX_CONTACTS} contactos de emergencia."}), 400

    contact = EmergencyContact(
        id_patient=g.patient.id_patient,
        name=cleaned["name"],
        relationship_label=cleaned["relationship"],
        phone=cleaned["phone"])
    db.session.add(contact)
    db.session.commit()
    return jsonify(contact.to_json()), 201


@patient_details_bp.route("/emergency-contacts/<contact_id>", methods=["PATCH"])
@jwt_required()
@role_required("Paciente")
@patient_required
def update_contact(contact_id):
    contact = _owned_contact(contact_id)
    if not contact:
        return jsonify({"message": "Contacto no encontrado."}), 404

    data = request.get_json(silent=True) or {}
    try:
        cleaned = v.parse_fields(data, CONTACT_SPEC)
    except v.ValidationError as err:
        return jsonify({"message": str(err)}), 400

    if "name" in cleaned:
        contact.name = cleaned["name"]
    if "relationship" in cleaned:
        contact.relationship_label = cleaned["relationship"]
    if "phone" in cleaned:
        contact.phone = cleaned["phone"]
    db.session.commit()
    return jsonify(contact.to_json()), 200


@patient_details_bp.route("/emergency-contacts/<contact_id>", methods=["DELETE"])
@jwt_required()
@role_required("Paciente")
@patient_required
def delete_contact(contact_id):
    contact = _owned_contact(contact_id)
    if not contact:
        return jsonify({"message": "Contacto no encontrado."}), 404
    db.session.delete(contact)
    db.session.commit()
    return jsonify({"message": "Contacto eliminado."}), 200
