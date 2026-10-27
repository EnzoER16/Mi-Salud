import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, Chip, CircularProgress, Divider, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { cardSx } from '../theme';
import IconBadge from '../components/IconBadge';
import SharedMedicalRecord from '../components/SharedMedicalRecord';
import { getSharedMedicalRecord } from '../services/careService';
import { getSharedPatients, getSharedMedication, registerSharedIntake, getSharedActivity } from '../services/careService';

const time = iso => new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

export default function CareDashboard() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [record, setRecord] = useState(null);
  const [recordMessage, setRecordMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const refresh = async () => {
    if (patient?.can_view_medication) {
      const meds = await getSharedMedication(patientId);
      setTreatments(meds);
      if (patient.relationship === 'Familiar') setActivity(await getSharedActivity(patientId));
    }
  };
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const shared = await getSharedPatients();
        const current = shared.find(p => p.id_patient === patientId);
        if (!current) throw new Error('No tenés una vinculación activa con este paciente.');
        if (alive) setPatient(current);
        if (current.can_view_medication) {
          const meds = await getSharedMedication(patientId);
          if (alive) setTreatments(meds);
          if (current.relationship === 'Familiar') {
            const log = await getSharedActivity(patientId);
            if (alive) setActivity(log);
          }
        }
        if (current.can_view_record) {
          try {
            const data = await getSharedMedicalRecord(patientId);
            if (alive) setRecord(data);
          } catch (e) { if (alive) setRecordMessage(e.message); }
        }
      } catch (e) { if (alive) setError(e.message); }
      finally { if (alive) setLoading(false); }
    }
    load(); return () => { alive = false; };
  }, [patientId]);

  async function check(intakeId) {
    setBusy(intakeId); setError(''); setMessage('');
    try { await registerSharedIntake(patientId, intakeId); await refresh(); setMessage('Toma registrada correctamente.'); }
    catch (e) { setError(e.message); }
    finally { setBusy(null); }
  }

  return <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Box>
      <Typography variant="overline" color="primary">GRUPO DE CUIDADO</Typography>
      <Typography variant="h4">Seguimiento de {patient?.patient_name || 'paciente'}</Typography>
      <Typography color="text.secondary">Solo la información que este paciente autorizó compartir.</Typography>
      <Button sx={{ mt: 1 }} onClick={() => navigate('/care-group')}>Volver a Mi grupo de cuidado</Button>
    </Box>
    {error && <Alert severity="error">{error}</Alert>}
    {message && <Alert severity="success">{message}</Alert>}
    {loading ? <CircularProgress /> : patient && <>
      {patient.can_view_record && (record ? <SharedMedicalRecord record={record} /> :
        <Alert severity="info">{recordMessage || "No hay ficha médica disponible."}</Alert>)}
      {patient.can_view_medication && <>
      <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2.5, sm: 3 } }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <IconBadge tone="green"><TrendingUpRoundedIcon /></IconBadge>
          <Box><Typography variant="h6">Progreso de tratamientos</Typography>
            <Typography variant="body2" color="text.secondary">Porcentaje según todas las tomas del tratamiento, incluidas las futuras.</Typography></Box>
        </Stack>
        {treatments.length === 0 ? <Typography color="text.secondary">No hay tratamientos registrados.</Typography> :
          treatments.map(t => <Box key={t.id_treatment} sx={{ mb: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" gap={2}>
              <Typography fontWeight={700}>{t.medication} · {t.dose}</Typography><Typography color="primary.main" fontWeight={700}>{t.compliance}%</Typography>
            </Stack>
            {t.diagnosis && <Typography variant="body2" color="text.secondary">Diagnóstico: {t.diagnosis}</Typography>}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Cada {t.frequency_hours} hs durante {t.duration_days} días</Typography>
            <LinearProgress variant="determinate" value={Math.max(0, Math.min(100, t.compliance))} sx={{ height: 10, borderRadius: 5 }} />
          </Box>)}
      </Paper>
      <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2.5, sm: 3 } }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <IconBadge tone="teal"><MedicationOutlinedIcon /></IconBadge>
          <Box><Typography variant="h6">Medicación de hoy</Typography>
            <Typography variant="body2" color="text.secondary">Registrá una administración solamente si tenés autorización y la toma se realizó.</Typography></Box>
        </Stack>
        {treatments.flatMap(t => t.intakes_today.map(i => ({ ...i, medication: t.medication, dose: t.dose, diagnosis: t.diagnosis, frequency_hours: t.frequency_hours, duration_days: t.duration_days, instructions: t.instructions, treatment_taken: t.treatment_taken, treatment_total: t.treatment_total }))).sort((a,b) => a.scheduled_time.localeCompare(b.scheduled_time)).length === 0 &&
          <Alert severity="info">No hay tomas programadas para hoy.</Alert>}
        <Stack spacing={1.5}>
          {treatments.flatMap(t => t.intakes_today.map(i => ({ ...i, medication: t.medication, dose: t.dose, diagnosis: t.diagnosis, frequency_hours: t.frequency_hours, duration_days: t.duration_days, instructions: t.instructions, treatment_taken: t.treatment_taken, treatment_total: t.treatment_total }))).sort((a,b) => a.scheduled_time.localeCompare(b.scheduled_time)).map(i =>
            <Box key={i.id_intake} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, p: 1.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
              <Typography fontWeight={700}>{time(i.scheduled_time)}</Typography>
              <Box sx={{ flex: 1, minWidth: 150 }}>
                 <Typography fontWeight={600}>{i.medication} · {i.dose}</Typography>
                 <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{i.status === 'Tomado' ? 'Ya tomaste esta dosis' : 'Pendiente de tomar'}</Typography>
                 <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 1, pt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                   {i.diagnosis && <Typography variant="caption" sx={{ overflowWrap: 'anywhere' }}><Box component="span" sx={{ color: 'text.secondary' }}>Diagnóstico: </Box>{i.diagnosis}</Typography>}
                   <Typography variant="caption" sx={{ overflowWrap: 'anywhere' }}><Box component="span" sx={{ color: 'text.secondary' }}>Tratamiento: </Box>Cada {i.frequency_hours} hs durante {i.duration_days} días</Typography>
                   {i.instructions && <Typography variant="caption" sx={{ overflowWrap: 'anywhere' }}><Box component="span" sx={{ color: 'text.secondary' }}>Indicaciones: </Box>{i.instructions}</Typography>}
                   <Typography variant="caption"><Box component="span" sx={{ color: 'text.secondary' }}>Tomas totales: </Box><Box component="span" sx={{ fontWeight: 700 }}>{i.treatment_taken}/{i.treatment_total}</Box></Typography>
                 </Box>
               </Box>
              {i.status === 'Tomado' ? <Chip size="small" color="success" label="Tomado" /> :
                <Button variant="contained" size="small" disabled={busy !== null || !patient.can_record_intakes || i.status !== 'Pendiente' || new Date(i.scheduled_time) > new Date()} onClick={() => check(i.id_intake)}>Registrar toma</Button>}
            </Box>)}
        </Stack>
        {!patient.can_record_intakes && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>Tenés permiso de consulta, pero no de registrar tomas.</Typography>}
      </Paper>
      {patient.relationship === 'Familiar' && <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2.5, sm: 3 } }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Actividad de cuidadores</Typography>
        {activity.length === 0 ? <Typography color="text.secondary">Todavía no se registraron tomas desde el grupo de cuidado.</Typography> :
          <Stack divider={<Divider />} spacing={1}>{activity.map(a => <Box key={a.id_activity} sx={{ py: 1 }}>
            <Typography fontWeight={600}>{a.medication || 'Medicamento'} · {a.dose || 'Dosis no especificada'}</Typography>
            <Typography variant="body2">Registrado por {a.actor_name}</Typography>
            <Typography variant="caption" color="text.secondary">Programada: {a.scheduled_time ? new Date(a.scheduled_time).toLocaleString('es-AR') : 'Sin fecha'} · </Typography>
            <Typography variant="caption" color="text.secondary">{new Date(a.created_at).toLocaleString('es-AR')}</Typography>
          </Box>)}</Stack>}
      </Paper>}
      </>}
    </>}
  </Box>;
}
