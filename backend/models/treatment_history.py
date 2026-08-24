from config.settings import db
import uuid
from datetime import datetime, timezone

class TreatmentHistory(db.Model):
    __tablename__ = "treatment_history"

    id_history = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    id_treatment = db.Column(db.String(36), db.ForeignKey('treatments.id_treatment'), nullable=False)
    
    date_modified = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    changes_details = db.Column(db.Text, nullable=False)

    def __init__(self, id_treatment, changes_details):
        self.id_treatment = id_treatment
        self.changes_details = changes_details

    def to_json(self):
        return {
            "id_history": self.id_history,
            "id_treatment": self.id_treatment,
            "date_modified": self.date_modified.isoformat(),
            "changes_details": self.changes_details}