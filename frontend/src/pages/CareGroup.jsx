import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Chip, Divider, FormControlLabel, MenuItem, Paper,
  Stack, Switch, TextField, Typography, CircularProgress } from '@mui/material';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import {
  getCareMembers, getCareInvitations, getSharedPatients, inviteCareMember,
  acceptCareInvitation, declineCareInvitation, updateCarePermissions, removeCareMember,
} from '../services/careService';
import { cardSx } from '../theme';
import MyCareActivity from './MyCareActivity';

const flags = [
  ['can_view_medication', 'Ver medicación'],
  ['can_record_intakes', 'Registrar tomas'],
  ['can_view_record', 'Ver ficha médica'],
];

export default function CareGroup() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [pending, setPending] = useState([]);
  const [shared, setShared] = useState([]);
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('Familiar');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function refresh() {
    const [a, b, c] = await Promise.all([getCareMembers(), getCareInvitations(), getSharedPatients()]);
    setMembers(a); setPending(b); setShared(c);
  }
  useEffect(() => {
    refresh().catch(err => setError(err.message)).finally(() => setLoading(false));
  }, []);

  async function perform(action, success) {
    setBusy(true); setError(''); setMessage('');
    try { await action(); await refresh(); setMessage(success); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  const card = { ...cardSx, p: { xs: 2, sm: 3 } };
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="overline" color="primary">MI SALUD</Typography>
        <Typography variant="h4">Mi grupo de cuidado</Typography>
        <Typography color="text.secondary">Compartí tu seguimiento solamente con personas que autorices.</Typography>
      </Box>
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {message && <Alert severity="success" onClose={() => setMessage('')}>{message}</Alert>}
      {loading ? <CircularProgress /> : <>
        <Paper sx={card} elevation={0}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <GroupOutlinedIcon color="primary" />
            <Typography variant="h6">Invitar integrante</Typography>
          </Stack>
          <Box component="form" onSubmit={(e) => {
            e.preventDefault();
            perform(async () => { await inviteCareMember({ email, relationship }); setEmail(''); }, 'Invitación creada.');
          }} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField label="Correo de una cuenta existente" type="email" required value={email}
              onChange={e => setEmail(e.target.value)} sx={{ flex: '2 1 250px' }} />
            <TextField select label="Vínculo" value={relationship} onChange={e => setRelationship(e.target.value)} sx={{ flex: '1 1 150px' }}>
              <MenuItem value="Familiar">Familiar</MenuItem>
              <MenuItem value="Cuidador">Cuidador</MenuItem>
            </TextField>
            <Button variant="contained" disabled={busy} type="submit">Invitar</Button>
          </Box>
        </Paper>

        <Paper sx={card} elevation={0}>
          <Typography variant="h6" sx={{ mb: 2 }}>Personas invitadas</Typography>
          {members.length === 0 && <Typography color="text.secondary">Todavía no invitaste a nadie.</Typography>}
          <Stack spacing={2} divider={<Divider />}>
            {members.map(m => <Box key={m.id_member}>
              <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
                <Typography fontWeight={600}>{m.member_name}</Typography>
                <Chip size="small" label={m.relationship} />
                <Chip size="small" color={m.status === 'Activo' ? 'success' : 'default'} label={m.status} />
              </Stack>
              <Typography variant="body2" color="text.secondary">{m.member_email}</Typography>
              <Stack sx={{ mt: 1 }}>
                {flags.map(([key, label]) => <FormControlLabel key={key}
                  control={<Switch size="small" checked={!!m[key]} disabled={busy}
                    onChange={e => perform(() => updateCarePermissions(m.id_member, { [key]: e.target.checked }), 'Permiso actualizado.')} />}
                  label={label} />)}
              </Stack>
              <Button color="error" size="small" disabled={busy}
                onClick={() => { if (window.confirm('¿Revocar esta invitación o acceso?')) perform(() => removeCareMember(m.id_member), 'Acceso revocado.'); }}>
                Revocar acceso
              </Button>
            </Box>)}
          </Stack>
        </Paper>

        <Paper sx={card} elevation={0}>
          <Typography variant="h6" sx={{ mb: 2 }}>Invitaciones recibidas</Typography>
          {pending.length === 0 && <Typography color="text.secondary">No tenés invitaciones pendientes.</Typography>}
          {pending.map(m => <Stack key={m.id_member} direction="row" gap={2} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
            <Typography sx={{ flex: 1 }}>{m.patient_name} te invita como {m.relationship.toLowerCase()}.</Typography>
            <Button variant="contained" disabled={busy} onClick={() => perform(() => acceptCareInvitation(m.id_member), 'Invitación aceptada.')}>Aceptar</Button>
            <Button disabled={busy} onClick={() => perform(() => declineCareInvitation(m.id_member), 'Invitación rechazada.')}>Rechazar</Button>
          </Stack>)}
        </Paper>

        <Paper sx={card} elevation={0}>
          <Typography variant="h6" sx={{ mb: 2 }}>Personas que me compartieron acceso</Typography>
          {shared.length === 0 ? <Typography color="text.secondary">Todavía no cuidás a otro paciente desde MiSalud+.</Typography> :
            shared.map(m => <Stack key={m.id_member} direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}><Typography sx={{ flex: 1 }}>{m.patient_name} · {m.relationship}</Typography><Button variant="outlined" disabled={!m.can_view_medication && !m.can_view_record} onClick={() => navigate(`/care/patient/${m.id_patient}`)}>{m.can_view_medication ? 'Ver seguimiento' : 'Ver ficha médica'}</Button></Stack>)}
        </Paper>
      </>}
      <MyCareActivity />
    </Box>
  );
}
