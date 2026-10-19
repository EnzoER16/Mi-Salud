from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone, timedelta
from config.settings import db
from models.medication_intake import MedicationIntake
from models.treatment import Treatment
from models.medical_consultation import MedicalConsultation
from models.patient import Patient
from models.user import User
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

def send_email(to_email, subject, html_content):
    # Idealmente, estas credenciales deberían ir en tu archivo .env
    sender_email = os.environ.get("MAIL_USERNAME", "tucorreo@gmail.com") 
    sender_password = os.environ.get("MAIL_PASSWORD", "tu_contraseña_de_aplicacion_google")

    msg = MIMEMultipart("alternative")
    msg['Subject'] = subject
    msg['From'] = sender_email
    msg['To'] = to_email

    msg.attach(MIMEText(html_content, "html"))

    try:
        # Usamos el servidor SMTP de Gmail
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, sender_password)
            server.send_message(msg)
    except Exception as e:
        print(f"Error al enviar el correo a {to_email}: {e}")

def check_pending_intakes(app):
    with app.app_context():
        now = datetime.now(timezone.utc)
        
        # Buscamos tomas pendientes que no hayan sido notificadas
        # y cuyo horario programado es en los próximos 5 minutos (o ya pasó)
        intakes_to_notify = db.session.query(MedicationIntake, Treatment, User).join(
            Treatment, MedicationIntake.id_treatment == Treatment.id_treatment
        ).join(
            MedicalConsultation, Treatment.id_consultation == MedicalConsultation.id_consultation
        ).join(
            Patient, MedicalConsultation.id_patient == Patient.id_patient
        ).join(
            User, Patient.id_user == User.id_user
        ).filter(
            MedicationIntake.status == "Pendiente",
            MedicationIntake.notified == False,
            MedicationIntake.scheduled_time <= now + timedelta(minutes=5)
        ).all()

        for intake, treatment, user in intakes_to_notify:
            subject = f"🔔 Recordatorio de MiSalud+: Es hora de tu {treatment.medication}"
            
            # Formateamos la hora para que sea legible (Asumiendo hora Argentina UTC-3)
            local_time = intake.scheduled_time - timedelta(hours=3)
            time_str = local_time.strftime('%H:%M')

            body = f"""
            <div style="font-family: Arial, sans-serif; color: #0B2A5C; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E1EAEE; border-radius: 12px;">
                <h2 style="color: #0E8FA3;">Hola, {user.username}</h2>
                <p>Este es un recordatorio automático para que no olvides tu medicación.</p>
                <div style="background-color: #F3F8F9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>💊 Medicamento:</strong> {treatment.medication}</p>
                    <p><strong>⚖️ Dosis:</strong> {treatment.dose}</p>
                    <p><strong>⏰ Horario programado:</strong> {time_str} hs</p>
                </div>
                <p>Por favor, marcá la toma en la plataforma para mantener tu porcentaje de cumplimiento al día:</p>
                <a href="http://localhost:5173/dashboard" style="display: inline-block; background-color: #2DB89A; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">Registrar mi toma</a>
            </div>
            """
            
            send_email(user.email, subject, body)
            
            # Marcamos la toma como notificada para no volver a enviarle correo
            intake.notified = True
        
        # Si se notificó a alguien, guardamos los cambios en la base de datos
        if intakes_to_notify:
            db.session.commit()

def start_scheduler(app):
    scheduler = BackgroundScheduler()
    # Ejecutamos la revisión cada 1 minuto
    scheduler.add_job(func=check_pending_intakes, args=[app], trigger="interval", minutes=1)
    scheduler.start()