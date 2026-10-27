import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Divider, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import PieChartOutlineRoundedIcon from '@mui/icons-material/PieChartOutlineRounded';
import { generateAISummary, getPatientClinicalAnalysis, getFinishedTreatmentAnalysis } from '../services/api';
import { cardSx } from '../theme';

const PALETTE = ['#0E8FA3', '#80B854', '#4976B5', '#E3A34B', '#A38ACD', '#C87786', '#8495A5'];
const monthLabel = (value) => { const [year, month] = value.split('-'); return `${month}/${year}`; };
const dateLabel = (date) => date ? new Date(date.endsWith('Z') || /[+-]\d\d:\d\d$/.test(date) ? date : `${date}Z`).toLocaleDateString('es-AR') : 'Sin fecha';

function DiagnosisPie({ rows }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  let angle = -Math.PI / 2;
  const segments = rows.map((row, index) => {
    const sweep = total ? (row.count / total) * Math.PI * 2 : 0;
    const start = angle; angle += sweep;
    const x1 = 100 + 83 * Math.cos(start), y1 = 100 + 83 * Math.sin(start);
    const x2 = 100 + 83 * Math.cos(angle), y2 = 100 + 83 * Math.sin(angle);
    const path = `M 100 100 L ${x1} ${y1} A 83 83 0 ${sweep > Math.PI ? 1 : 0} 1 ${x2} ${y2} Z`;
    return <path key={row.diagnosis} d={path} fill={PALETTE[index % PALETTE.length]} stroke="white" strokeWidth="2" />;
  });
  return <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
    <Box component="svg" role="img" aria-label="Distribución porcentual de consultas por diagnóstico" viewBox="0 0 200 200" sx={{ width: 210, height: 210, maxWidth: '100%' }}>
      {rows.length === 1 ? <circle cx="100" cy="100" r="83" fill={PALETTE[0]}/> : segments}
      <circle cx="100" cy="100" r="43" fill="white" />
      <text x="100" y="96" textAnchor="middle" fontSize="23" fontWeight="700" fill="#12334c">{total}</text>
      <text x="100" y="116" textAnchor="middle" fontSize="11" fill="#5b6e80">consultas</text>
    </Box>
    <Box sx={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {rows.map((row, index) => <Box key={row.diagnosis} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'start' }}>
          <Box sx={{ width: 11, height: 11, mt: .6, borderRadius: .5, flexShrink: 0, bgcolor: PALETTE[index % PALETTE.length] }}/>
          <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{row.diagnosis}</Typography>
        </Box>
        <Typography variant="body2" fontWeight={700} sx={{ whiteSpace: 'nowrap' }}>{row.count} · {row.percentage}%</Typography>
      </Box>)}
    </Box>
  </Box>;
}

export default function PatientClinicalAnalysis({ patientId, refreshKey = 0 }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [finished, setFinished] = useState(null);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => { setOpen(false); setData(null); setSummary(''); setFinished(null); setError(''); }, [patientId]);
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    getPatientClinicalAnalysis(patientId)
      .then(result => { if (active) { setData(result); setError(''); } })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [patientId, refreshKey, open]);

  async function requestSummary() {
    setLoadingAI(true); setAiError(''); setHistoryError('');
    try {
      const report = await getFinishedTreatmentAnalysis(patientId);
      setFinished(report);
      if (!report.total) { setSummary(''); return; }
      const result = await generateAISummary(patientId);
      setSummary(result.summary || 'Sin interpretación disponible.');
    } catch (err) { setAiError(err.message || 'No se pudo completar la interpretación por IA.'); }
    finally { setLoadingAI(false); }
  }

  return <Box sx={{ mb: 3 }}>
    <Button variant="outlined" startIcon={<PieChartOutlineRoundedIcon />} onClick={() => setOpen(v => !v)}>
      {open ? 'Ocultar análisis clínico' : 'Analizar historial clínico'}
    </Button>
    {open && <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2, sm: 3 }, mt: 2 }}>
      <Typography variant="h6">Análisis del historial clínico</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Datos registrados en MiSalud+; agrupa textos de diagnósticos iguales, sin interpretar enfermedades.</Typography>
      {loading && <CircularProgress size={24} />}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && data && <>
        <Typography variant="subtitle1" fontWeight={700}>Consultas registradas: {data.total}</Typography>
        {!data.total ? <Alert severity="info" sx={{ my: 2 }}>Este paciente todavía no tiene consultas registradas.</Alert> : <>
          <Box sx={{ my: 2 }}><DiagnosisPie rows={data.diagnoses} /></Box>
          <Divider sx={{ my: 2 }}/>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Consultas por mes</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {data.months.map(m => <Box key={m.month} sx={{ px: 1.5, py: 1, bgcolor: '#EFF7FA', borderRadius: 2 }}><Typography variant="body2">{monthLabel(m.month)} · <b>{m.count}</b></Typography></Box>)}
          </Box>
          <Typography variant="subtitle1" fontWeight={700}>Historial de este paciente</Typography>
          <TableContainer sx={{ maxHeight: 320, mt: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Table size="small" stickyHeader><TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Diagnóstico</TableCell><TableCell>Lugar de atención</TableCell></TableRow></TableHead>
              <TableBody>{data.consultations.map(c => <TableRow key={c.id_consultation}><TableCell sx={{ whiteSpace: 'nowrap' }}>{dateLabel(c.date)}</TableCell><TableCell>{c.diagnosis}</TableCell><TableCell>{c.location}</TableCell></TableRow>)}</TableBody></Table>
          </TableContainer>
          <Divider sx={{ my: 2 }}/>
          <Typography variant="subtitle1" fontWeight={700}>Señales de recurrencia</Typography>
          {data.recurrence_alerts.length ? data.recurrence_alerts.map(a => <Alert key={a.diagnosis} severity="warning" sx={{ mt: 1 }}>
            {a.count} consultas registradas por «{a.diagnosis}» en los últimos {a.days} días. Revisar antecedentes y registros originales.
          </Alert>) : <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>No se detectaron cinco o más consultas con el mismo diagnóstico textual en los últimos 60 días.</Typography>}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Señal estadística informativa; no constituye una alerta clínica validada ni un diagnóstico.</Typography>
        </>}
        <Divider sx={{ my: 2 }}/>
        <Button variant="outlined" color="secondary" startIcon={<AutoAwesomeRoundedIcon />} disabled={loadingAI} onClick={requestSummary}>
          {loadingAI ? 'Analizando tratamientos anteriores...' : 'Analizar evolución y tratamientos con IA'}
        </Button>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>Primero se calculan las tomas de tratamientos cuyo período terminó. La IA interpreta los registros; no confirma que se hayan tomado todas las dosis.</Typography>
        {finished && <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>Tratamientos con período finalizado: {finished.total}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Con todas las dosis registradas: {finished.all_registered} de {finished.total}. No implica curación ni confirma administración real.</Typography>
          {finished.total === 0 ? <Alert severity="info">Todavía no hay tratamientos cuyo período programado haya finalizado.</Alert> :
            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, maxHeight: 320 }}>
              <Table size="small" stickyHeader><TableHead><TableRow><TableCell>Diagnóstico</TableCell><TableCell>Tratamiento</TableCell><TableCell>Finalizó</TableCell><TableCell>Tomas registradas</TableCell><TableCell>Consultas posteriores*</TableCell></TableRow></TableHead>
                <TableBody>{finished.treatments.map(t => <TableRow key={t.id_treatment}><TableCell>{t.diagnosis}</TableCell><TableCell>{t.medication} · {t.dose}</TableCell><TableCell>{t.end_date}</TableCell><TableCell>{t.taken}/{t.total} · {t.percentage === null ? 'Sin dosis programadas' : `${t.percentage}%`}</TableCell><TableCell>{t.later_consultations}</TableCell></TableRow>)}</TableBody>
              </Table>
            </TableContainer>}
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>*Consultas posteriores con exactamente el mismo diagnóstico normalizado; no demuestra recaída. Las tomas no registradas pueden haberse realizado fuera de la app.</Typography>
        </Box>}
        {aiError && <Alert severity="error" sx={{ mt: 1 }}>{aiError}</Alert>}
        {summary && <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: '#F5F3FF' }}><Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{summary}</Typography></Paper>}
      </>}
    </Paper>}
  </Box>;
}
