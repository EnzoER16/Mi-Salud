import { Box, Typography, Chip, Accordion, AccordionSummary, AccordionDetails, Link } from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ContactPhoneOutlinedIcon from '@mui/icons-material/ContactPhoneOutlined';
import VaccinesOutlinedIcon from '@mui/icons-material/VaccinesOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import { colors } from '../theme';
import { formatDay, bmiLabel } from './profile/format';

const Row = ({ label, children }) => (
    <Box sx={{ p: 1.75, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: '#FAFCFD' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 0.25 }}>
            {label}
        </Typography>
        <Typography sx={{ fontWeight: 600, whiteSpace: 'pre-line', wordBreak: 'break-word' }} component="div">{children}</Typography>
    </Box>
);

// Datos extra del paciente que el médico ve debajo de la ficha: solo se muestran los que el paciente completó.
const PatientExtraInfo = ({ patientData }) => {
    const record = patientData?.medical_record || {};
    const personal = patientData?.personal || {};
    const contacts = patientData?.emergency_contacts || [];
    const vaccines = patientData?.vaccines || [];

    const rows = [];
    const who = [personal.age !== null && personal.age !== undefined ? `${personal.age} años` : null, personal.sex].filter(Boolean).join(' · ');
    if (who) rows.push(['Edad y sexo', who]);
    if (personal.phone || personal.locality) rows.push(['Contacto', [personal.phone, personal.locality].filter(Boolean).join(' · ')]);
    if (record.weight_kg || record.height_cm) {
        const parts = [record.weight_kg ? `${record.weight_kg} kg` : null, record.height_cm ? `${record.height_cm} cm` : null];
        if (record.bmi) parts.push(`IMC ${record.bmi} (${bmiLabel(record.bmi)})`);
        rows.push(['Peso y estatura', parts.filter(Boolean).join(' · ')]);
    }
    if (record.intolerances) rows.push(['Intolerancias', record.intolerances]);
    if (record.current_medication) rows.push(['Medicación habitual', record.current_medication]);
    if (record.surgeries) rows.push(['Cirugías e internaciones', record.surgeries]);
    if (record.family_history) rows.push(['Antecedentes familiares', record.family_history]);
    if (record.last_checkup) rows.push(['Último control médico', formatDay(record.last_checkup)]);
    if (record.last_dental_checkup) rows.push(['Último control dental', formatDay(record.last_dental_checkup)]);
    if (record.wears_glasses) rows.push(['Anteojos', 'Usa anteojos o lentes de contacto']);
    if (record.primary_doctor_name) rows.push(['Médico de cabecera', [record.primary_doctor_name, record.primary_doctor_phone].filter(Boolean).join(' · ')]);
    if (record.care_center) rows.push(['Centro de atención habitual', record.care_center]);

    const conditions = record.conditions || [];
    if (!rows.length && !conditions.length && !contacts.length && !vaccines.length) return null;

    return (
        <Box sx={{ mb: 3 }}>
            {conditions.length > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#B26A00', display: 'block', mb: 0.75 }}>
                        Condiciones crónicas
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {conditions.map((c) => <Chip key={c} label={c} sx={{ bgcolor: '#FFF4E0', color: '#B26A00' }} />)}
                    </Box>
                </Box>
            )}

            {rows.length > 0 && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2, mb: 2 }}>
                    {rows.map(([label, value]) => <Row key={label} label={label}>{value}</Row>)}
                </Box>
            )}

            {contacts.length > 0 && (
                <Accordion disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', '&:before': { display: 'none' }, mb: 1.5 }}>
                    <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ContactPhoneOutlinedIcon fontSize="small" sx={{ color: colors.teal }} />
                            <Typography sx={{ fontWeight: 700 }}>Contactos de emergencia ({contacts.length})</Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                        {contacts.map((c) => (
                            <Box key={c.id_contact} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', py: 0.75 }}>
                                <Typography sx={{ fontWeight: 600 }}>
                                    {c.name}{c.relationship ? <Typography component="span" color="text.secondary"> · {c.relationship}</Typography> : null}
                                </Typography>
                                <Link href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                    <PhoneOutlinedIcon sx={{ fontSize: 16 }} /> {c.phone}
                                </Link>
                            </Box>
                        ))}
                    </AccordionDetails>
                </Accordion>
            )}

            {vaccines.length > 0 && (
                <Accordion disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <VaccinesOutlinedIcon fontSize="small" sx={{ color: colors.teal }} />
                            <Typography sx={{ fontWeight: 700 }}>Vacunas ({vaccines.length})</Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                        {vaccines.map((v) => (
                            <Box key={v.id_vaccine} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', py: 0.75 }}>
                                <Typography sx={{ fontWeight: 600 }}>
                                    {v.name}{v.dose ? <Typography component="span" color="text.secondary"> · {v.dose}</Typography> : null}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {v.applied_on ? formatDay(v.applied_on) : 'Sin fecha'}{v.next_dose_on ? ` · próxima ${formatDay(v.next_dose_on)}` : ''}
                                </Typography>
                            </Box>
                        ))}
                    </AccordionDetails>
                </Accordion>
            )}
        </Box>
    );
};

export default PatientExtraInfo;
