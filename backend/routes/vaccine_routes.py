from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps

from config.settings import db
from models.patient import Patient
from models.patient_vaccine import PatientVaccine
from routes.auth_routes import role_required
import validators as v

vaccine_bp = Blueprint("vaccine", __name__, url_prefix="/api/vaccines")

MAX_VACCINES = 150

VACCINE_SPEC = {
    "name": v.text("El nombre de la vacuna", 100, required=True),
    "dose": v.text("La dosis", 40),
    "applied_on": v.day("La fecha de aplicación"),
    "next_dose_on": v.day("La fecha de la próxima dosis", allow_future=True),
    "place": v.text("El lugar", 100),
    "notes": v.text("Las notas", 255),
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


def vaccines_payload(patient_id):
    """Carnet ordenado: lo más reciente primero y las que no tienen fecha al final."""
    vaccines = PatientVaccine.query.filter_by(id_patient=patient_id).all()
    vaccines.sort(key=lambda x: (x.applied_on is None, -(x.applied_on.toordinal()) if x.applied_on else 0, x.name.lower()))
    return [x.to_json() for x in vaccines]


def _check_dates(applied_on, next_dose_on):
    if applied_on and next_dose_on and next_dose_on <= applied_on:
        return "La próxima dosis tiene que ser posterior a la fecha de aplicación."
    return None


@vaccine_bp.route("/", methods=["GET"])
@jwt_required()
@role_required("Paciente")
@patient_required
def list_vaccines():
    return jsonify(vaccines_payload(g.patient.id_patient)), 200


@vaccine_bp.route("/", methods=["POST"])
@jwt_required()
@role_required("Paciente")
@patient_required
def add_vaccine():
    data = request.get_json(silent=True) or {}
    try:
        cleaned = v.parse_fields({k: data.get(k) for k in VACCINE_SPEC}, VACCINE_SPEC)
    except v.ValidationError as err:
        return jsonify({"message": str(err)}), 400

    problem = _check_dates(cleaned["applied_on"], cleaned["next_dose_on"])
    if problem:
        return jsonify({"message": problem}), 400

    if PatientVaccine.query.filter_by(id_patient=g.patient.id_patient).count() >= MAX_VACCINES:
        return jsonify({"message": f"Alcanzaste el máximo de {MAX_VACCINES} vacunas cargadas."}), 400

    vaccine = PatientVaccine(id_patient=g.patient.id_patient, **cleaned)
    db.session.add(vaccine)
    db.session.commit()
    return jsonify(vaccine.to_json()), 201


def _owned_vaccine(vaccine_id):
    return PatientVaccine.query.filter_by(id_vaccine=vaccine_id, id_patient=g.patient.id_patient).first()


@vaccine_bp.route("/<vaccine_id>", methods=["PATCH"])
@jwt_required()
@role_required("Paciente")
@patient_required
def update_vaccine(vaccine_id):
    vaccine = _owned_vaccine(vaccine_id)
    if not vaccine:
        return jsonify({"message": "Vacuna no encontrada."}), 404

    data = request.get_json(silent=True) or {}
    try:
        cleaned = v.parse_fields(data, VACCINE_SPEC)
    except v.ValidationError as err:
        return jsonify({"message": str(err)}), 400

    applied_on = cleaned.get("applied_on", vaccine.applied_on)
    next_dose_on = cleaned.get("next_dose_on", vaccine.next_dose_on)
    problem = _check_dates(applied_on, next_dose_on)
    if problem:
        return jsonify({"message": problem}), 400

    for key, value in cleaned.items():
        setattr(vaccine, key, value)
    db.session.commit()
    return jsonify(vaccine.to_json()), 200


@vaccine_bp.route("/<vaccine_id>", methods=["DELETE"])
@jwt_required()
@role_required("Paciente")
@patient_required
def delete_vaccine(vaccine_id):
    vaccine = _owned_vaccine(vaccine_id)
    if not vaccine:
        return jsonify({"message": "Vacuna no encontrada."}), 404
    db.session.delete(vaccine)
    db.session.commit()
    return jsonify({"message": "Vacuna eliminada."}), 200
