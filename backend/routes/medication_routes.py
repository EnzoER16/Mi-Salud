from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models.medication import Medication
from routes.auth_routes import role_required

medication_bp = Blueprint("medication", __name__, url_prefix="/api/medication")


@medication_bp.route("/", methods=["GET"])
@jwt_required()
@role_required("Doctor")
def list_medications():
    """
    Catálogo de medicamentos para el desplegable de la receta.
    Ordenado por categoría y nombre (así el frontend puede agruparlos).
    Opcional: ?q=ibu filtra por nombre.
    """
    q = (request.args.get("q") or "").strip()

    query = Medication.query
    if q:
        query = query.filter(Medication.name.ilike(f"%{q}%"))

    medications = query.order_by(Medication.category, Medication.name).all()
    return jsonify([m.to_json() for m in medications]), 200
