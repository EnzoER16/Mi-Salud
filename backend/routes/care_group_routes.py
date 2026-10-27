"""Etapa 1: invitaciones, aceptación, permisos y revocación.
No expone todavía datos médicos de otros pacientes.
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from config.settings import db
from models.user import User
from models.patient import Patient
from models.care_member import CareMember, utcnow
from models.care_activity import CareActivity
from models.medical_consultation import MedicalConsultation
from models.treatment import Treatment
from models.medication_intake import MedicationIntake
from datetime import datetime, timezone, timedelta
from routes.auth_routes import role_required
from routes.medical_record_routes import medical_record_payload

care_bp = Blueprint('care_group', __name__, url_prefix='/api/care')
PERMISSIONS = ('can_view_medication', 'can_record_intakes', 'can_view_record')


def owner_patient():
    return Patient.query.filter_by(id_user=get_jwt_identity()).first()


def owned_member(member_id):
    patient = owner_patient()
    if not patient:
        return None
    return CareMember.query.filter_by(id_member=member_id, id_patient=patient.id_patient).first()


@care_bp.get('/members')
@jwt_required()
@role_required('Paciente')
def members():
    patient = owner_patient()
    if not patient:
        return jsonify({'message': 'Completá tu perfil de paciente primero.'}), 404
    rows = CareMember.query.filter_by(id_patient=patient.id_patient).order_by(CareMember.created_at.desc()).all()
    return jsonify([m.to_json() for m in rows]), 200


@care_bp.post('/invitations')
@jwt_required()
@role_required('Paciente')
def invite():
    patient = owner_patient()
    if not patient:
        return jsonify({'message': 'Completá tu perfil de paciente primero.'}), 404
    data = request.get_json(silent=True) or {}
    email = str(data.get('email') or '').strip().lower()
    relationship = data.get('relationship')
    if not email or relationship not in ('Familiar', 'Cuidador'):
        return jsonify({'message': 'Ingresá un correo y elegí Familiar o Cuidador.'}), 400
    user = db.session.query(User).filter(db.func.lower(User.email) == email).first()
    if not user:
        return jsonify({'message': 'No existe una cuenta con ese correo. Pedile que se registre.'}), 404
    if user.id_user == get_jwt_identity():
        return jsonify({'message': 'No podés invitarte a vos mismo.'}), 400
    if user.role != 'Paciente':
        return jsonify({'message': 'En esta primera versión, invitá cuentas de paciente.'}), 400
    if CareMember.query.filter_by(id_patient=patient.id_patient, id_user=user.id_user).first():
        return jsonify({'message': 'Esta persona ya tiene una invitación o acceso.'}), 409
    row = CareMember(id_patient=patient.id_patient, id_user=user.id_user, relationship=relationship,
                     can_view_medication=True, can_record_intakes=(relationship == 'Cuidador'), can_view_record=False)
    db.session.add(row)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Esta invitación ya existe.'}), 409
    return jsonify(row.to_json()), 201


@care_bp.get('/invitations/mine')
@jwt_required()
@role_required('Paciente')
def my_invitations():
    rows = CareMember.query.filter_by(id_user=get_jwt_identity(), status='Pendiente').all()
    return jsonify([m.to_json() for m in rows]), 200


@care_bp.post('/invitations/<member_id>/accept')
@jwt_required()
@role_required('Paciente')
def accept(member_id):
    row = CareMember.query.filter_by(id_member=member_id, id_user=get_jwt_identity(), status='Pendiente').first()
    if not row:
        return jsonify({'message': 'Invitación no encontrada.'}), 404
    row.status = 'Activo'
    row.accepted_at = utcnow()
    db.session.commit()
    return jsonify(row.to_json()), 200


@care_bp.post('/invitations/<member_id>/decline')
@jwt_required()
@role_required('Paciente')
def decline(member_id):
    row = CareMember.query.filter_by(id_member=member_id, id_user=get_jwt_identity(), status='Pendiente').first()
    if not row:
        return jsonify({'message': 'Invitación no encontrada.'}), 404
    db.session.delete(row)
    db.session.commit()
    return jsonify({'message': 'Invitación rechazada.'}), 200


@care_bp.get('/shared-with-me')
@jwt_required()
@role_required('Paciente')
def shared_with_me():
    rows = CareMember.query.filter_by(id_user=get_jwt_identity(), status='Activo').all()
    return jsonify([m.to_json() for m in rows]), 200


@care_bp.patch('/members/<member_id>/permissions')
@jwt_required()
@role_required('Paciente')
def permissions(member_id):
    row = owned_member(member_id)
    if not row:
        return jsonify({'message': 'Integrante no encontrado.'}), 404
    data = request.get_json(silent=True) or {}
    if not data or any(k not in PERMISSIONS or type(v) is not bool for k, v in data.items()):
        return jsonify({'message': 'Los permisos deben ser booleanos válidos.'}), 400
    for field, value in data.items():
        setattr(row, field, value)
    db.session.commit()
    return jsonify(row.to_json()), 200


@care_bp.delete('/members/<member_id>')
@jwt_required()
@role_required('Paciente')
def remove_member(member_id):
    row = owned_member(member_id)
    if not row:
        return jsonify({'message': 'Integrante no encontrado.'}), 404
    db.session.delete(row)
    db.session.commit()
    return jsonify({'message': 'Acceso revocado.'}), 200


# Etapa 2: acceso a medicamentos de pacientes que aceptaron compartirlos.
def authorized_member(patient_id, permission):
    return CareMember.query.filter_by(id_patient=patient_id,
                                      id_user=get_jwt_identity(), status='Activo',
                                      **{permission: True}).first()


def treatment_rows(patient_id):
    return (db.session.query(Treatment).join(MedicalConsultation)
            .filter(MedicalConsultation.id_patient == patient_id).all())


@care_bp.get('/patients/<patient_id>/medication')
@jwt_required()
@role_required('Paciente')
def shared_medication(patient_id):
    if not authorized_member(patient_id, 'can_view_medication'):
        return jsonify({'message': 'No tenés acceso a la medicación de este paciente.'}), 403
    treatments = treatment_rows(patient_id)
    now = datetime.now(timezone.utc)
    # Fecha local de Argentina para que la tarjeta muestre las tomas del día del paciente.
    # En esta versión de prueba se toma Argentina UTC-3 como referencia.
    today_ar = (now - timedelta(hours=3)).date()
    result = []
    for treatment in treatments:
        items = []
        for intake in treatment.intakes:
            dt = intake.scheduled_time
            if dt is None:
                continue
            utc_dt = dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)
            if (utc_dt - timedelta(hours=3)).date() == today_ar:
                items.append({'id_intake': intake.id_intake,
                              'scheduled_time': utc_dt.isoformat().replace('+00:00', 'Z'),
                              'status': intake.status,
                              'taken_time': intake.taken_time.isoformat() + 'Z' if intake.taken_time else None})
        result.append({'id_treatment': treatment.id_treatment,
                       'medication': treatment.medication, 'dose': treatment.dose,
                       'frequency_hours': treatment.frequency_hours,
                       'duration_days': treatment.duration_days,
                       'instructions': treatment.instructions,
                       'diagnosis': (db.session.get(MedicalConsultation, treatment.id_consultation).diagnosis
                                     if db.session.get(MedicalConsultation, treatment.id_consultation) else None),
                       'compliance': treatment.calculate_compliance(),
                       'treatment_taken': sum(i.status == 'Tomado' for i in treatment.intakes),
                       'treatment_total': len(treatment.intakes),
                       'intakes_today': sorted(items, key=lambda i: i['scheduled_time'])})
    return jsonify(result), 200


@care_bp.patch('/patients/<patient_id>/intakes/<intake_id>/check')
@jwt_required()
@role_required('Paciente')
def shared_check_intake(patient_id, intake_id):
    if not (authorized_member(patient_id, 'can_record_intakes') and
            authorized_member(patient_id, 'can_view_medication')):
        return jsonify({'message': 'No tenés permiso para registrar tomas.'}), 403
    intake = (db.session.query(MedicationIntake).join(Treatment).join(MedicalConsultation)
              .filter(MedicationIntake.id_intake == intake_id,
                      MedicalConsultation.id_patient == patient_id).first())
    if not intake:
        return jsonify({'message': 'Toma no encontrada para este paciente.'}), 404
    if intake.status != 'Pendiente':
        return jsonify({'message': 'Esta toma ya tiene un estado registrado.'}), 409
    scheduled = intake.scheduled_time
    if scheduled:
        scheduled_utc = scheduled.replace(tzinfo=timezone.utc) if scheduled.tzinfo is None else scheduled.astimezone(timezone.utc)
        if scheduled_utc > datetime.now(timezone.utc):
            return jsonify({'message': 'No se puede confirmar una toma futura.'}), 400
    intake.status = 'Tomado'
    intake.taken_time = datetime.now(timezone.utc).replace(tzinfo=None)
    db.session.add(CareActivity(id_patient=patient_id, id_actor=get_jwt_identity(),
                                id_intake=intake.id_intake, action='intake_recorded'))
    db.session.commit()
    return jsonify({'message': 'Toma registrada.', 'intake': intake.to_json()}), 200



def _activity_rows(patient_id):
    rows = (CareActivity.query.filter_by(id_patient=patient_id)
            .order_by(CareActivity.created_at.desc()).limit(50).all())
    results = []
    for row in rows:
        data = row.to_json()
        intake = db.session.get(MedicationIntake, row.id_intake)
        if intake:
            treatment = db.session.get(Treatment, intake.id_treatment)
            if treatment:
                data['medication'] = treatment.medication
                data['dose'] = treatment.dose
            dt = intake.scheduled_time
            data['scheduled_time'] = (dt.isoformat() + ('Z' if dt.tzinfo is None else '')) if dt else None
        results.append(data)
    return results

@care_bp.get('/patients/<patient_id>/activity')
@jwt_required()
@role_required('Paciente')
def shared_activity(patient_id):
    # El historial de supervisión es exclusivo de familiares autorizados.
    # Los cuidadores mantienen el acceso operativo a medicamentos y tomas,
    # pero no pueden consultar esta auditoría, aunque conozcan la URL.
    member = authorized_member(patient_id, 'can_view_medication')
    if not member or member.relationship != 'Familiar':
        return jsonify({'message': 'No tenés permiso para consultar el historial de supervisión.'}), 403
    return jsonify(_activity_rows(patient_id)), 200


@care_bp.get('/my-activity')
@jwt_required()
@role_required('Paciente')
def owner_activity():
    """El titular puede consultar las acciones realizadas sobre sus propias tomas."""
    patient = owner_patient()
    if not patient:
        return jsonify({'message': 'Completá tu perfil de paciente.'}), 404
    return jsonify(_activity_rows(patient.id_patient)), 200


@care_bp.get('/patients/<patient_id>/medical-record')
@jwt_required()
@role_required('Paciente')
def shared_medical_record(patient_id):
    """Ficha médica de lectura exclusiva para un integrante activo autorizado."""
    if not authorized_member(patient_id, 'can_view_record'):
        return jsonify({'message': 'No tenés permiso para ver la ficha médica.'}), 403
    patient = db.session.get(Patient, patient_id)
    if not patient:
        return jsonify({'message': 'Paciente no encontrado.'}), 404
    record = medical_record_payload(patient)
    if record is None:
        return jsonify({'message': 'Este paciente todavía no completó su ficha médica.'}), 404
    return jsonify(record), 200
