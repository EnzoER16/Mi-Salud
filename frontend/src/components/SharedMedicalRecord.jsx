import { Box, Typography, Paper, Divider, Stack, Chip } from '@mui/material';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import IconBadge from './IconBadge';
import { cardSx } from '../theme';

const fields = [
  ['blood_group', 'Grupo sanguíneo'], ['allergies', 'Alergias'], ['antecedents', 'Antecedentes'],
  ['conditions', 'Condiciones crónicas'], ['intolerances', 'Intolerancias'],
  ['surgeries', 'Cirugías e internaciones'], ['family_history', 'Antecedentes familiares'],
  ['current_medication', 'Medicación habitual'], ['weight_kg', 'Peso (kg)'], ['height_cm', 'Altura (cm)'],
  ['bmi', 'IMC'], ['wears_glasses', 'Usa anteojos'], ['last_checkup', 'Último control médico'],
  ['last_dental_checkup', 'Último control dental'], ['primary_doctor_name', 'Médico de cabecera'],
  ['primary_doctor_phone', 'Teléfono del médico de cabecera'], ['care_center', 'Centro de atención habitual'],
];
function valueOf(v) {
  if (v === null || v === undefined || v === '') return 'No informado';
  if (Array.isArray(v)) return v.length ? v.join(', ') : 'No informado';
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  return String(v);
}
export default function SharedMedicalRecord({ record }) {
  return <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2.5, sm: 3 } }}>
    <Stack direction="row" gap={2} alignItems="center" sx={{ mb: 2 }}>
      <IconBadge tone="teal"><AssignmentOutlinedIcon /></IconBadge>
      <Box><Typography variant="h6">Ficha médica compartida</Typography>
        <Typography variant="body2" color="text.secondary">Consulta de solo lectura, autorizada por el paciente.</Typography>
      </Box>
      <Chip label="Solo lectura" size="small" variant="outlined" sx={{ ml: 'auto' }} />
    </Stack>
    <Stack spacing={1.3} divider={<Divider flexItem />}>
      {fields.map(([key, label]) => <Box key={key} sx={{ py: 0.5 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{valueOf(record[key])}</Typography>
      </Box>)}
    </Stack>
  </Paper>;
}
