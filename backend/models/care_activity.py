"""Auditoría de registros de tomas realizados por un cuidador/familiar."""
import uuid
from datetime import datetime, timezone
from config.settings import db

class CareActivity(db.Model):
    __tablename__ = 'care_activities'
    id_activity = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_patient = db.Column(db.String(36), db.ForeignKey('patients.id_patient'), nullable=False, index=True)
    id_actor = db.Column(db.String(36), db.ForeignKey('users.id_user'), nullable=False)
    id_intake = db.Column(db.String(36), db.ForeignKey('medication_intakes.id_intake'), nullable=False)
    action = db.Column(db.String(40), nullable=False, default='intake_recorded')
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    actor = db.relationship('User', foreign_keys=[id_actor])
    def to_json(self):
        return {'id_activity': self.id_activity, 'id_intake': self.id_intake,
                'action': self.action, 'actor_name': self.actor.username,
                'created_at': self.created_at.isoformat() + 'Z'}
