from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.settings import db
from models.doctor import Doctor
from models.patient import Patient
from models.medical_consultation import MedicalConsultation
from routes.auth_routes import role_required
from datetime import datetime, timezone, timedelta
from collections import Counter, defaultdict
from models.medical_record import MedicalRecord
from models.treatment import Treatment
import google.generativeai as genai, os
from routes.medical_record_routes import medical_record_payload
from routes.patient_details_routes import patient_details_payload
from routes.vaccine_routes import vaccines_payload

doctor_bp = Blueprint("doctor", __name__, url_prefix="/api/doctor")

@doctor_bp.route("/profile", methods=["POST"])
@jwt_required()
@role_required("Doctor")
def create_or_update_profile():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    specialty = (data.get("specialty") or "").strip()
    license_number = (data.get("license_number") or "").strip()

    if not specialty or not license_number:
        return jsonify({"message": "La especialidad y la matrícula son obligatorias"}), 400

    if len(specialty) < 3 or len(license_number) < 4:
        return jsonify({"message": "La especialidad y la matrícula deben ser válidas"}), 400

    doctor = Doctor.query.filter_by(id_user=user_id).first()

    if doctor:
        doctor.specialty = specialty
        doctor.license_number = license_number
        message = "Perfil de médico actualizado exitosamente"
    else:
        doctor = Doctor(
            id_user=user_id, 
            specialty=specialty, 
            license_number=license_number)
        db.session.add(doctor)
        message = "Perfil de médico creado exitosamente"

    db.session.commit()
    return jsonify({"message": message, "profile": doctor.to_json()}), 200

@doctor_bp.route("/profile", methods=["GET"])
@jwt_required()
@role_required("Doctor")
def get_profile():
    user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(id_user=user_id).first()

    if not doctor:
        return jsonify({"message": "Perfil de médico no encontrado. Por favor, complete sus datos."}), 404

    return jsonify(doctor.to_json()), 200

# Asumiendo que tu Blueprint se llama doctor_bp y tiene url_prefix='/api/doctor'
@doctor_bp.route("/patient/<string:dni>", methods=["GET"])
@jwt_required()
@role_required("Doctor")
def get_patient_by_dni(dni):
    # 1. Buscamos al paciente usando el DNI
    patient = Patient.query.filter_by(dni=dni).first()
    
    if not patient:
        return jsonify({"message": "No se encontró ningún paciente con ese DNI."}), 404

    # 2. Ficha médica completa (si la tiene): la de siempre + peso, estatura, condiciones crónicas, etc.
    record_data = medical_record_payload(patient)

    # 3. Datos personales, contactos de emergencia y carnet de vacunas, para tener contexto en la consulta
    personal = patient_details_payload(patient)
    full_name = " ".join(p for p in (personal.get("first_name"), personal.get("last_name")) if p) or patient.user.username
    contacts = [c.to_json() for c in sorted(patient.emergency_contacts, key=lambda c: c.created_at or datetime.min)]

    # 4. Devolvemos los datos estructurados para React
    return jsonify({
        "id_patient": patient.id_patient,
        "name": full_name,
        "dni": patient.dni,
        "health_insurance": patient.health_insurance,
        "plan": patient.plan,
        "medical_record": record_data,
        "personal": {
            "age": personal.get("age"),
            "sex": personal.get("sex"),
            "phone": personal.get("phone"),
            "locality": personal.get("locality"),
        },
        "emergency_contacts": contacts,
        "vaccines": vaccines_payload(patient.id_patient),
    }), 200

@doctor_bp.route("/history", methods=["GET"])
@jwt_required()
@role_required("Doctor")
def get_doctor_history():
    user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(id_user=user_id).first()
    
    if not doctor:
        return jsonify({"message": "Perfil de médico no encontrado."}), 403

    # Buscamos todas las consultas de este médico (idealmente ordenadas, pero lo hacemos simple)
    consultations = MedicalConsultation.query.filter_by(id_doctor=doctor.id_doctor).all()
    
    history_data = []
    for c in consultations:
        # Buscamos al paciente de esta consulta para mostrar su DNI
        patient = Patient.query.get(c.id_patient)
        
        history_data.append({
            "id_consultation": c.id_consultation,
            # Si tu modelo al final guardó la fecha, la formateamos. Si no, mostramos un texto.
            "date": c.date.strftime("%d/%m/%Y") if hasattr(c, 'date') and c.date else "Fecha no registrada",
            "patient_dni": patient.dni if patient else "Desconocido",
            "diagnosis": c.diagnosis,
            "location": c.location
        })

    return jsonify(history_data), 200

@doctor_bp.route("/patient/<string:patient_id>/ai-summary", methods=["GET"])
@jwt_required()
@role_required("Doctor")
def generate_ai_summary(patient_id):
    # 1. Verificamos la API Key
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return jsonify({"message": "La API Key de Gemini no está configurada."}), 500
        
    genai.configure(api_key=api_key)
    
    # 2. Recopilamos los datos del paciente
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"message": "Paciente no encontrado."}), 404
        
    record = MedicalRecord.query.filter_by(id_patient=patient_id).first()
    
    # Todos los antecedentes se recuperan; el resumen con IA se centra en períodos finalizados.
    consultations = (MedicalConsultation.query.filter_by(id_patient=patient_id)
                     .order_by(MedicalConsultation.date.desc()).all())
    now = datetime.now(timezone.utc)
    consult_by_id = {c.id_consultation: c for c in consultations}
    all_treatments = (db.session.query(Treatment).join(MedicalConsultation,
                      Treatment.id_consultation == MedicalConsultation.id_consultation)
                      .filter(MedicalConsultation.id_patient == patient_id).all())
    finished = []
    for treatment in all_treatments:
        consultation = consult_by_id.get(treatment.id_consultation)
        if not consultation or not consultation.date:
            continue
        start_dt = consultation.date.replace(tzinfo=timezone.utc) if consultation.date.tzinfo is None else consultation.date.astimezone(timezone.utc)
        end_dt = start_dt + timedelta(days=treatment.duration_days)
        if end_dt > now:
            continue
        intakes = list(treatment.intakes)
        taken = sum(intake.status == 'Tomado' for intake in intakes)
        total = len(intakes)
        later = [c for c in consultations
                 if c.id_consultation != consultation.id_consultation
                 and c.date and c.date > consultation.date
                 and ' '.join((c.diagnosis or '').casefold().split()) == ' '.join((consultation.diagnosis or '').casefold().split())]
        finished.append({
            'id_treatment': treatment.id_treatment,
            'diagnosis': consultation.diagnosis,
            'consultation_date': consultation.date.date().isoformat(),
            'end_date': end_dt.date().isoformat(),
            'medication': treatment.medication,
            'dose': treatment.dose,
            'taken': taken,
            'total': total,
            'percentage': round(taken / total * 100, 1) if total else None,
            'later_consultations': len(later),
        })
    finished.sort(key=lambda t: t['end_date'], reverse=True)
    # El informe estructurado está disponible aunque Gemini no responda.
    history_text = '\n'.join(
        f"- {t['diagnosis']} | consulta {t['consultation_date']} | tratamiento {t['medication']} ({t['dose']}) "
        f"| período finalizado {t['end_date']} | tomas registradas {t['taken']}/{t['total']} "
        f"| posteriores consultas con mismo diagnóstico textual: {t['later_consultations']}"
        for t in finished[:60]
    ) or 'No hay tratamientos con período programado finalizado en los registros disponibles.'
    prompt = f"""Sos un asistente de revisión documental para un médico. Redactá en español argentino
    un análisis BREVE (máximo 180 palabras) SOLO de tratamientos cuyo período programado terminó.
    No repitas el grupo sanguíneo, las alergias ni los tratamientos activos: están en la ficha.
    Separá el resultado en: (1) Cumplimiento registrado de tratamientos anteriores,
    (2) Consultas posteriores por el mismo diagnóstico textual, (3) Preguntas para verificar.
    Explicá patrones longitudinales que sean comprobables en los datos adjuntos y priorizá
    los casos con registros incompletos. Si hay pocos datos, decilo expresamente.
    IMPORTANTE: "tomas registradas" NO equivale a dosis realmente tomadas; el fin del período
    NO significa abandono, curación ni alta médica. Una consulta posterior NO prueba recaída ni
    causalidad. No inventes consultas, diagnósticos, resultados, indicaciones ni porcentajes.
    Tratamientos anteriores (hasta 60, ordenados desde los más recientes):
    {history_text}
    """

    try:
        # Usamos exactamente el modelo que exige Google para las cuentas nuevas en este momento
        model_name = 'gemini-3.8-flash'
        
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        
        return jsonify({
            "message": "Resumen generado exitosamente",
            "summary": response.text,
            "finished_treatments": finished,
        }), 200
        
    except Exception as e:
        print("Error de integración con Gemini:", e)
        return jsonify({"message": "Ocurrió un error al procesar el resumen con Inteligencia Artificial."}), 500

@doctor_bp.get("/patient/<string:patient_id>/clinical-analysis")
@jwt_required()
@role_required("Doctor")
def get_patient_clinical_analysis(patient_id):
    # Las autorizaciones clínicas adicionales siguen pendientes en el proyecto.
    doctor = Doctor.query.filter_by(id_user=get_jwt_identity()).first()
    if not doctor:
        return jsonify({"message": "Perfil de médico no encontrado."}), 403
    patient = db.session.get(Patient, patient_id)
    if not patient:
        return jsonify({"message": "Paciente no encontrado."}), 404

    consultations = (MedicalConsultation.query.filter_by(id_patient=patient_id)
        .order_by(MedicalConsultation.date.desc()).all())
    groups = defaultdict(lambda: {"label": "", "count": 0, "recent_60": 0})
    months = Counter()
    records = []
    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=60)
    for consultation in consultations:
        label = (consultation.diagnosis or "").strip() or "Sin diagnóstico"
        # Agrupación literal normalizada (no infiere sinónimos ni síntomas).
        key = " ".join(label.casefold().split())
        group = groups[key]
        group["label"] = group["label"] or label
        group["count"] += 1
        date = consultation.date
        if date is not None:
            naive_utc = date.replace(tzinfo=None) if date.tzinfo else date
            if cutoff <= naive_utc <= datetime.now(timezone.utc).replace(tzinfo=None):
                group["recent_60"] += 1
            months[date.strftime('%Y-%m')] += 1
        records.append({
            "id_consultation": consultation.id_consultation,
            "date": date.isoformat() if date else None,
            "diagnosis": label,
            "location": consultation.location or "No indicado",
        })
    total = len(consultations)
    diagnoses = [{"diagnosis": x["label"], "count": x["count"],
                  "percentage": round(x["count"] * 100 / total, 1) if total else 0}
                 for x in sorted(groups.values(), key=lambda value: (-value["count"], value["label"]))]
    alerts = [{"diagnosis": group["label"], "count": group["recent_60"], "days": 60}
              for group in groups.values() if group["recent_60"] >= 5]
    alerts.sort(key=lambda row: (-row["count"], row["diagnosis"]))
    return jsonify({
        "total": total, "diagnoses": diagnoses,
        "months": [{"month": m, "count": n} for m, n in sorted(months.items(), reverse=True)],
        "consultations": records, "recurrence_alerts": alerts,
        "threshold": {"min_consultations": 5, "days": 60},
    }), 200

@doctor_bp.get('/patient/<string:patient_id>/treatment-history-analysis')
@jwt_required()
@role_required('Doctor')
def treatment_history_analysis(patient_id):
    if not Doctor.query.filter_by(id_user=get_jwt_identity()).first():
        return jsonify({'message': 'Perfil de médico no encontrado.'}), 403
    if not db.session.get(Patient, patient_id):
        return jsonify({'message': 'Paciente no encontrado.'}), 404
    now = datetime.now(timezone.utc)
    rows = (db.session.query(Treatment, MedicalConsultation)
            .join(MedicalConsultation, Treatment.id_consultation == MedicalConsultation.id_consultation)
            .filter(MedicalConsultation.id_patient == patient_id).all())
    consultations = MedicalConsultation.query.filter_by(id_patient=patient_id).all()
    items = []
    for treatment, consultation in rows:
        if not consultation.date:
            continue
        start = consultation.date.replace(tzinfo=timezone.utc) if consultation.date.tzinfo is None else consultation.date.astimezone(timezone.utc)
        end = start + timedelta(days=treatment.duration_days)
        if end > now:
            continue
        total = len(treatment.intakes)
        taken = sum(i.status == 'Tomado' for i in treatment.intakes)
        same_later = [c for c in consultations if c.id_consultation != consultation.id_consultation
                      and c.date and c.date > consultation.date
                      and ' '.join((c.diagnosis or '').casefold().split()) == ' '.join((consultation.diagnosis or '').casefold().split())]
        items.append({'id_treatment': treatment.id_treatment, 'diagnosis': consultation.diagnosis,
                      'medication': treatment.medication, 'dose': treatment.dose,
                      'end_date': end.date().isoformat(), 'taken': taken, 'total': total,
                      'percentage': round(taken * 100 / total, 1) if total else None,
                      'later_consultations': len(same_later)})
    items.sort(key=lambda row: row['end_date'], reverse=True)
    return jsonify({'treatments': items, 'total': len(items),
                    'all_registered': sum(i['total'] > 0 and i['taken'] == i['total'] for i in items)}), 200
