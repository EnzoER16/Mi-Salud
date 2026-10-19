from flask import Blueprint, request, jsonify, g, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from datetime import datetime, timezone
import os, re, uuid

from config.settings import db
from models.patient import Patient
from models.appointment import Appointment
from models.appointment_file import AppointmentFile
from models.appointment_note import AppointmentNote
from routes.auth_routes import role_required

appointment_bp = Blueprint("appointment", __name__, url_prefix="/api/appointments")

MAX_FILE_BYTES = 10 * 1024 * 1024        # 10 MB por archivo
MAX_FILES_PER_APPOINTMENT = 20
MODALITIES = ("Presencial", "Virtual")

# Tipos permitidos: (mime, extensiones válidas). El tipo real se detecta por el CONTENIDO del archivo,
# no por lo que diga el navegador, así no se puede subir un .exe renombrado como .pdf.
ALLOWED_TYPES = {
    "pdf": ("application/pdf", {"pdf"}),
    "jpeg": ("image/jpeg", {"jpg", "jpeg"}),
    "png": ("image/png", {"png"}),
}


def _detect_type(head):
    if head.startswith(b"%PDF-"):
        return "pdf"
    if head.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    return None


def _upload_dir():
    path = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(path, exist_ok=True)
    return path


def _clean_display_name(raw):
    """Nombre para mostrar: sin carpetas ni caracteres de control. El archivo en disco usa un uuid."""
    name = os.path.basename((raw or "").replace("\\", "/"))
    name = re.sub(r"[\x00-\x1f\x7f]", "", name).strip()
    return name[:150]


def _remove_from_disk(stored_name):
    try:
        os.remove(os.path.join(_upload_dir(), stored_name))
    except OSError:
        pass


def _parse_datetime(value):
    """Acepta ISO 8601 (con o sin zona) y lo devuelve en UTC sin zona, como el resto de la base."""
    if not isinstance(value, str) or not value.strip():
        raise ValueError("fecha vacía")
    text = value.strip()
    if text[-1] in ("Z", "z"):
        text = text[:-1] + "+00:00"
    dt = datetime.fromisoformat(text)
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    if not (2000 <= dt.year <= 2100):
        raise ValueError("fecha fuera de rango")
    return dt


def _read_appointment_fields(data, partial=False):
    """Valida y normaliza los campos de un turno. Devuelve (campos, mensaje_de_error)."""
    fields = {}

    if not partial or "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            return None, "El motivo o especialidad del turno es obligatorio."
        if len(title) > 100:
            return None, "El motivo del turno no puede superar los 100 caracteres."
        fields["title"] = title

    if not partial or "scheduled_at" in data:
        try:
            fields["scheduled_at"] = _parse_datetime(data.get("scheduled_at"))
        except (ValueError, TypeError):
            return None, "La fecha y hora del turno no son válidas."

    for key, label in (("doctor_name", "El nombre del profesional"), ("location", "El lugar")):
        if key in data:
            value = (data.get(key) or "").strip()
            if len(value) > 100:
                return None, f"{label} no puede superar los 100 caracteres."
            fields[key] = value or None

    if "modality" in data:
        modality = data.get("modality")
        if modality not in MODALITIES:
            return None, "La modalidad debe ser Presencial o Virtual."
        fields["modality"] = modality

    return fields, None


def patient_required(fn):
    """Busca el perfil del paciente logueado y lo deja en g.patient."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        patient = Patient.query.filter_by(id_user=get_jwt_identity()).first()
        if not patient:
            return jsonify({"message": "Perfil de paciente no encontrado. Completá tus datos primero."}), 404
        g.patient = patient
        return fn(*args, **kwargs)
    return wrapper


# Los "owned" devuelven None si el recurso no existe O es de otro paciente (siempre 404, no se filtra nada).
def _owned_appointment(appointment_id):
    return Appointment.query.filter_by(id_appointment=appointment_id, id_patient=g.patient.id_patient).first()


def _owned_file(file_id):
    return (AppointmentFile.query
            .join(Appointment, AppointmentFile.id_appointment == Appointment.id_appointment)
            .filter(AppointmentFile.id_file == file_id, Appointment.id_patient == g.patient.id_patient)
            .first())


def _owned_note(note_id):
    return (AppointmentNote.query
            .join(Appointment, AppointmentNote.id_appointment == Appointment.id_appointment)
            .filter(AppointmentNote.id_note == note_id, Appointment.id_patient == g.patient.id_patient)
            .first())


NOT_FOUND = ({"message": "No se encontró el turno."}, 404)


# ====================== TURNOS ======================

@appointment_bp.route("/", methods=["GET"])
@jwt_required()
@role_required("Paciente")
@patient_required
def list_appointments():
    appointments = (Appointment.query.filter_by(id_patient=g.patient.id_patient)
                    .order_by(Appointment.scheduled_at.asc()).all())
    return jsonify([a.to_json() for a in appointments]), 200


@appointment_bp.route("/", methods=["POST"])
@jwt_required()
@role_required("Paciente")
@patient_required
def create_appointment():
    data = request.get_json(silent=True) or {}
    fields, error = _read_appointment_fields(data)
    if error:
        return jsonify({"message": error}), 400

    appointment = Appointment(id_patient=g.patient.id_patient, **fields)
    db.session.add(appointment)
    db.session.commit()
    return jsonify(appointment.to_json(detail=True)), 201


@appointment_bp.route("/<appointment_id>", methods=["GET"])
@jwt_required()
@role_required("Paciente")
@patient_required
def get_appointment(appointment_id):
    appointment = _owned_appointment(appointment_id)
    if not appointment:
        return jsonify(NOT_FOUND[0]), NOT_FOUND[1]
    return jsonify(appointment.to_json(detail=True)), 200


@appointment_bp.route("/<appointment_id>", methods=["PATCH"])
@jwt_required()
@role_required("Paciente")
@patient_required
def update_appointment(appointment_id):
    appointment = _owned_appointment(appointment_id)
    if not appointment:
        return jsonify(NOT_FOUND[0]), NOT_FOUND[1]

    data = request.get_json(silent=True) or {}
    fields, error = _read_appointment_fields(data, partial=True)
    if error:
        return jsonify({"message": error}), 400

    for key, value in fields.items():
        setattr(appointment, key, value)
    db.session.commit()
    return jsonify(appointment.to_json(detail=True)), 200


@appointment_bp.route("/<appointment_id>", methods=["DELETE"])
@jwt_required()
@role_required("Paciente")
@patient_required
def delete_appointment(appointment_id):
    appointment = _owned_appointment(appointment_id)
    if not appointment:
        return jsonify(NOT_FOUND[0]), NOT_FOUND[1]

    stored_names = [f.stored_name for f in appointment.files]
    db.session.delete(appointment)      # borra también sus archivos y notas en la base
    db.session.commit()
    for name in stored_names:           # y los archivos del disco
        _remove_from_disk(name)
    return jsonify({"message": "Turno eliminado."}), 200


# ====================== ARCHIVOS Y FOTOS ======================

@appointment_bp.route("/<appointment_id>/files", methods=["POST"])
@jwt_required()
@role_required("Paciente")
@patient_required
def upload_files(appointment_id):
    appointment = _owned_appointment(appointment_id)
    if not appointment:
        return jsonify(NOT_FOUND[0]), NOT_FOUND[1]

    uploads = request.files.getlist("files")
    if not uploads:
        return jsonify({"message": "No se recibió ningún archivo."}), 400

    saved_files, written_names, errors = [], [], []
    slots_left = MAX_FILES_PER_APPOINTMENT - len(appointment.files)

    for upload in uploads:
        display_name = _clean_display_name(upload.filename)

        def reject(message):
            errors.append({"name": display_name or "archivo", "message": message})

        if not display_name:
            reject("El archivo no tiene nombre.")
            continue
        if len(saved_files) >= slots_left:
            reject(f"Cada turno admite hasta {MAX_FILES_PER_APPOINTMENT} archivos.")
            continue

        extension = display_name.rsplit(".", 1)[-1].lower() if "." in display_name else ""
        if not any(extension in exts for _, exts in ALLOWED_TYPES.values()):
            reject("Formato no permitido. Solo PDF, JPG o PNG.")
            continue

        upload.stream.seek(0, os.SEEK_END)
        size = upload.stream.tell()
        upload.stream.seek(0)
        if size == 0:
            reject("El archivo está vacío.")
            continue
        if size > MAX_FILE_BYTES:
            reject("El archivo supera el máximo de 10 MB.")
            continue

        detected = _detect_type(upload.stream.read(16))
        upload.stream.seek(0)
        if detected is None or extension not in ALLOWED_TYPES[detected][1]:
            reject("El contenido del archivo no coincide con un PDF, JPG o PNG válido.")
            continue

        mime_type = ALLOWED_TYPES[detected][0]
        stored_name = f"{uuid.uuid4().hex}.{'jpg' if detected == 'jpeg' else detected}"
        upload.save(os.path.join(_upload_dir(), stored_name))
        written_names.append(stored_name)

        record = AppointmentFile(
            id_appointment=appointment.id_appointment,
            original_name=display_name,
            stored_name=stored_name,
            mime_type=mime_type,
            size_bytes=size)
        db.session.add(record)
        saved_files.append(record)

    if not saved_files:
        return jsonify({"message": errors[0]["message"] if errors else "No se pudo guardar el archivo.",
                        "errors": errors}), 400

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        for name in written_names:
            _remove_from_disk(name)
        return jsonify({"message": "Ocurrió un error al guardar los archivos."}), 500

    return jsonify({"files": [f.to_json() for f in saved_files], "errors": errors}), 201


@appointment_bp.route("/files/<file_id>", methods=["GET"])
@jwt_required()
@role_required("Paciente")
@patient_required
def get_file(file_id):
    """Ver (inline) o descargar (?download=1). Solo el dueño del turno puede acceder."""
    record = _owned_file(file_id)
    if not record:
        return jsonify({"message": "No se encontró el archivo."}), 404

    if not os.path.isfile(os.path.join(_upload_dir(), record.stored_name)):
        return jsonify({"message": "El archivo ya no está disponible en el servidor."}), 404

    response = send_from_directory(
        _upload_dir(), record.stored_name,
        mimetype=record.mime_type,
        as_attachment=request.args.get("download") == "1",
        download_name=record.original_name)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = "private, no-store"
    return response


@appointment_bp.route("/files/<file_id>", methods=["DELETE"])
@jwt_required()
@role_required("Paciente")
@patient_required
def delete_file(file_id):
    record = _owned_file(file_id)
    if not record:
        return jsonify({"message": "No se encontró el archivo."}), 404

    stored_name = record.stored_name
    db.session.delete(record)
    db.session.commit()
    _remove_from_disk(stored_name)
    return jsonify({"message": "Archivo eliminado."}), 200


# ====================== REVISIONES Y NOTAS ======================

def _read_note_fields(data):
    title = (data.get("title") or "").strip() or "Nota"
    content = (data.get("content") or "").strip()
    if not content:
        return None, "Escribí el contenido de la nota."
    if len(title) > 100:
        return None, "El título no puede superar los 100 caracteres."
    if len(content) > 2000:
        return None, "La nota no puede superar los 2000 caracteres."
    return {"title": title, "content": content}, None


@appointment_bp.route("/<appointment_id>/notes", methods=["POST"])
@jwt_required()
@role_required("Paciente")
@patient_required
def add_note(appointment_id):
    appointment = _owned_appointment(appointment_id)
    if not appointment:
        return jsonify(NOT_FOUND[0]), NOT_FOUND[1]

    fields, error = _read_note_fields(request.get_json(silent=True) or {})
    if error:
        return jsonify({"message": error}), 400

    note = AppointmentNote(id_appointment=appointment.id_appointment, **fields)
    db.session.add(note)
    db.session.commit()
    return jsonify(note.to_json()), 201


@appointment_bp.route("/notes/<note_id>", methods=["PATCH"])
@jwt_required()
@role_required("Paciente")
@patient_required
def update_note(note_id):
    note = _owned_note(note_id)
    if not note:
        return jsonify({"message": "No se encontró la nota."}), 404

    fields, error = _read_note_fields(request.get_json(silent=True) or {})
    if error:
        return jsonify({"message": error}), 400

    note.title = fields["title"]
    note.content = fields["content"]
    db.session.commit()
    return jsonify(note.to_json()), 200


@appointment_bp.route("/notes/<note_id>", methods=["DELETE"])
@jwt_required()
@role_required("Paciente")
@patient_required
def delete_note(note_id):
    note = _owned_note(note_id)
    if not note:
        return jsonify({"message": "No se encontró la nota."}), 404

    db.session.delete(note)
    db.session.commit()
    return jsonify({"message": "Nota eliminada."}), 200
