import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Alert, CircularProgress, Button, Divider, Stack } from '@mui/material';
import { cardSx } from '../theme';
import { getMyCareActivity } from '../services/careService';

const when = value => value ? new Date(value).toLocaleString('es-AR') : 'Sin fecha';

export default function MyCareActivity() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function refresh() {
    setError('');
    try { setRows(await getMyCareActivity()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);
  return <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2, sm: 3 } }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ mb: 2 }}>
      <Box>
        <Typography variant="h6">Actividad en mi cuidado</Typography>
        <Typography variant="body2" color="text.secondary">Registros realizados por personas autorizadas.</Typography>
        <Button size="small" variant="outlined" onClick={refresh} sx={{ mt: 1 }}>Actualizar</Button></Box></Stack>
    {loading ? <CircularProgress size={24}/> : error ? <Alert severity="error">{error}</Alert> : rows.length === 0 ?
      <Typography color="text.secondary">Todavía no hay tomas registradas por familiares o cuidadores.</Typography> :
      <Stack divider={<Divider/>} spacing={1.5}>{rows.map(row => <Box key={row.id_activity}>
        <Typography fontWeight={600}>{row.medication || 'Medicamento'} · {row.dose || 'Dosis sin especificar'}</Typography>
        <Typography variant="body2">Registrado por {row.actor_name}</Typography>
        <Typography variant="caption" color="text.secondary">Registro: {when(row.created_at)} · Toma programada: {when(row.scheduled_time)}</Typography>
      </Box>)}</Stack>}
  </Paper>;
}
