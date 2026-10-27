"""Autorizaciones de cuidado por paciente (no modifica los roles globales)."""
import uuid
from datetime import datetime, timezone
from config.settings import db


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class CareMember(db.Model):
    __tablename__ = 'care_members'
    id_member = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_patient = db.Column(db.String(36), db.ForeignKey('patients.id_patient'), nullable=False, index=True)
    id_user = db.Column(db.String(36), db.ForeignKey('users.id_user'), nullable=False, index=True)
    relationship = db.Column(db.String(20), nullable=False)  # Familiar | Cuidador
    status = db.Column(db.String(20), nullable=False, default='Pendiente')  # Pendiente | Activo
    can_view_medication = db.Column(db.Boolean, nullable=False, default=True)
    can_record_intakes = db.Column(db.Boolean, nullable=False, default=False)
    can_view_record = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    accepted_at = db.Column(db.DateTime)
    __table_args__ = (db.UniqueConstraint('id_patient', 'id_user', name='uq_care_patient_user'),)

    patient = db.relationship('Patient', foreign_keys=[id_patient])
    member_user = db.relationship('User', foreign_keys=[id_user])

    def to_json(self):
        return {
            'id_member': self.id_member,
            'id_patient': self.id_patient,
            'id_user': self.id_user,
            'member_name': self.member_user.username,
            'member_email': self.member_user.email,
            'patient_name': self.patient.user.username,
            'relationship': self.relationship,
            'status': self.status,
            'can_view_medication': self.can_view_medication,
            'can_record_intakes': self.can_record_intakes,
            'can_view_record': self.can_view_record,
            'created_at': self.created_at.isoformat(),
        }
