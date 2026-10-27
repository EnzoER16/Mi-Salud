from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config.settings import Configuration, db
from models import user, patient, doctor, medical_record, medical_consultation, treatment, medication_intake, treatment_history
from routes.auth_routes import auth_bp
from routes.patient_routes import patient_bp
from routes.doctor_routes import doctor_bp
from routes.medical_record_routes import record_bp
from routes.medical_consultation_routes import consultation_bp
from routes.treatment_routes import treatment_bp
from routes.medication_intake_routes import intake_bp
from models import user, patient, doctor, medical_record, medical_consultation, treatment, medication_intake, treatment_history, notification, medication, appointment, appointment_file, appointment_note, patient_details, emergency_contact, patient_health, patient_vaccine, doctor_details
from models.medication import seed_medications
from routes.notification_routes import notification_bp
from routes.medication_routes import medication_bp
from scheduler import start_scheduler
from routes.appointment_routes import appointment_bp
from routes.patient_details_routes import patient_details_bp
from routes.doctor_details_routes import doctor_details_bp
from routes.vaccine_routes import vaccine_bp
from models import care_member, care_activity
from routes.care_group_routes import care_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Configuration)

    db.init_app(app)
    JWTManager(app)
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    app.register_blueprint(auth_bp)
    app.register_blueprint(patient_bp)
    app.register_blueprint(doctor_bp)
    app.register_blueprint(record_bp)
    app.register_blueprint(consultation_bp)
    app.register_blueprint(treatment_bp)
    app.register_blueprint(intake_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(medication_bp)
    app.register_blueprint(appointment_bp)
    app.register_blueprint(patient_details_bp)
    app.register_blueprint(doctor_details_bp)
    app.register_blueprint(vaccine_bp)
    app.register_blueprint(care_bp)

    @app.errorhandler(413)
    def file_too_large(_error):
        return jsonify({"message": "El archivo supera el máximo de 10 MB."}), 413
    
    with app.app_context():
        db.create_all()
        seed_medications()  # carga el catálogo de medicamentos (solo agrega los que faltan)

    start_scheduler(app)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)