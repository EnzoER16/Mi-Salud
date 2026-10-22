import { useState, useEffect } from 'react';
import {
    Box, TextField, Button, Alert, MenuItem, CircularProgress, Chip, Typography, FormControlLabel, Switch, Snackbar, InputAdornment,
} from '@mui/material';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import VaccinesOutlinedIcon from '@mui/icons-material/VaccinesOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import { useNavigate } from 'react-router-dom';
import { getMedicalRecord, saveMedicalRecord, getProfile } from '../services/api';
import PageHeader from '../components/PageHeader';
import FormSection, { fullWidth } from '../components/profile/FormSection';
import { BLOOD_GROUPS, CONDITIONS, todayInput, str, orNullValue, bmiValue, bmiLabel } from '../components/profile/format';

const TEXT_FIELDS = [
    'allergies', 'intolerances', 'antecedents', 'surgeries', 'family_history', 'current_medication',
    'primary_doctor_name', 'primary_doctor_phone', 'care_center', 'last_checkup', 'last_dental_checkup',
];

const MedicalRecord = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');
    const [needsProfile, setNeedsProfile] = useState(false);

    const [bloodGroup, setBloodGroup] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [conditions, setConditions] = useState([]);
    const [glasses, setGlasses] = useState(false);
    const [text, setText] = useState(Object.fromEntries(TEXT_FIELDS.map((f) => [f, ''])));

    useEffect(() => {
        const fetchRecord = async () => {
            try {
                const profile = await getProfile('Paciente');
                if (!profile) {
                    setNeedsProfile(true);
                    return;
                }
                const record = await getMedicalRecord();
                if (record) {
                    setBloodGroup(record.blood_group || '');
                    setWeight(str(record.weight_kg));
                    setHeight(str(record.height_cm));
                    setConditions(record.conditions || []);
                    setGlasses(Boolean(record.wears_glasses));
                    setText(Object.fromEntries(TEXT_FIELDS.map((f) => [f, str(record[f])])));
                }
            } catch (err) {
                console.error(err);
                setError('No se pudo cargar la información previa.');
            } finally {
                setLoading(false);
            }
        };
        fetchRecord();
    }, []);

    const toggleCondition = (name) =>
        setConditions((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!bloodGroup) return setError('Elegí tu grupo sanguíneo (si no lo sabés, "Desconocido").');

        setSaving(true);
        try {
            const payload = {
                blood_group: bloodGroup,
                weight_kg: orNullValue(weight),
                height_cm: orNullValue(height),
                conditions,
                wears_glasses: glasses,
                ...Object.fromEntries(TEXT_FIELDS.map((f) => [f, orNullValue(text[f])])),
            };
            await saveMedicalRecord(payload);
            setFeedback('Ficha médica guardada correctamente.');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const setT = (key) => (e) => setText((prev) => ({ ...prev, [key]: e.target.value }));
    const bmi = bmiValue(weight, height);

    return (
        <Box sx={{ maxWidth: 760, width: '100%', mx: 'auto' }}>
            <PageHeader
                eyebrow="Mi cuenta"
                title="Mi ficha médica"
                subtitle="Mantené actualizada tu información clínica. Es clave para los médicos que te atiendan."
            />

            {needsProfile ? (
                <Alert severity="info" action={<Button color="inherit" size="small" onClick={() => navigate('/complete-profile')}>Completar</Button>}>
                    Primero completá tus datos personales (DNI) para poder crear tu ficha médica.
                </Alert>
            ) : (
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {error && <Alert severity="error">{error}</Alert>}

                        <FormSection icon={<MonitorHeartOutlinedIcon />} title="Datos básicos" description="Los más importantes en una emergencia.">
                            <TextField select label="Grupo sanguíneo *" error={Boolean(error) && !bloodGroup} value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} sx={fullWidth}>
                                {BLOOD_GROUPS.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                            </TextField>
                            <TextField
                                label="Peso" value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^0-9.,]/g, ''))}
                                slotProps={{ input: { endAdornment: <InputAdornment position="end">kg</InputAdornment> }, htmlInput: { inputMode: 'decimal', maxLength: 5 } }}
                            />
                            <TextField
                                label="Estatura" value={height} onChange={(e) => setHeight(e.target.value.replace(/[^0-9]/g, ''))}
                                slotProps={{ input: { endAdornment: <InputAdornment position="end">cm</InputAdornment> }, htmlInput: { inputMode: 'numeric', maxLength: 3 } }}
                            />
                            {bmi !== null && (
                                <Typography variant="body2" color="text.secondary" sx={fullWidth}>
                                    Índice de masa corporal: <strong>{bmi}</strong> · {bmiLabel(bmi)} (es orientativo)
                                </Typography>
                            )}
                            <FormControlLabel
                                sx={fullWidth}
                                control={<Switch checked={glasses} onChange={(e) => setGlasses(e.target.checked)} />}
                                label="Uso anteojos o lentes de contacto"
                            />
                        </FormSection>

                        <FormSection icon={<WarningAmberRoundedIcon />} tone="amber" title="Alergias e intolerancias" description="Dejá en blanco si no tenés." columns={1}>
                            <TextField
                                multiline minRows={2} label="Alergias conocidas" placeholder="Ej: Penicilina, Ibuprofeno, Maní"
                                value={text.allergies} onChange={setT('allergies')} slotProps={{ htmlInput: { maxLength: 2000 } }}
                            />
                            <TextField
                                multiline minRows={2} label="Intolerancias" placeholder="Ej: Lactosa, Gluten"
                                value={text.intolerances} onChange={setT('intolerances')} slotProps={{ htmlInput: { maxLength: 2000 } }}
                            />
                        </FormSection>

                        <FormSection icon={<VaccinesOutlinedIcon />} tone="blue" title="Condiciones crónicas y medicación" description="Tocá las que tengas." columns={1}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }} role="group" aria-label="Condiciones crónicas">
                                {CONDITIONS.map((name) => {
                                    const selected = conditions.includes(name);
                                    return (
                                        <Chip
                                            key={name} label={name} clickable onClick={() => toggleCondition(name)}
                                            aria-pressed={selected} color={selected ? 'primary' : 'default'}
                                            variant={selected ? 'filled' : 'outlined'}
                                        />
                                    );
                                })}
                            </Box>
                            <TextField
                                multiline minRows={2} label="Otras enfermedades o antecedentes" placeholder="Algo que no esté en la lista"
                                value={text.antecedents} onChange={setT('antecedents')} slotProps={{ htmlInput: { maxLength: 2000 } }}
                            />
                            <TextField
                                multiline minRows={2} label="Medicación habitual" placeholder="Ej: Enalapril 10 mg por la mañana"
                                helperText="Incluí lo que tomás de forma regular, aunque no te lo haya recetado un médico de MiSalud+."
                                value={text.current_medication} onChange={setT('current_medication')} slotProps={{ htmlInput: { maxLength: 2000 } }}
                            />
                        </FormSection>

                        <FormSection icon={<HistoryEduOutlinedIcon />} tone="green" title="Historia clínica" columns={1}>
                            <TextField
                                multiline minRows={2} label="Cirugías e internaciones" placeholder="Ej: Apendicectomía (2015), internación por neumonía (2020)"
                                value={text.surgeries} onChange={setT('surgeries')} slotProps={{ htmlInput: { maxLength: 2000 } }}
                            />
                            <TextField
                                multiline minRows={2} label="Antecedentes familiares" placeholder="Ej: Padre con diabetes, madre con hipertensión"
                                value={text.family_history} onChange={setT('family_history')} slotProps={{ htmlInput: { maxLength: 2000 } }}
                            />
                        </FormSection>

                        <FormSection icon={<EventAvailableOutlinedIcon />} title="Controles" description="Cuándo fue la última vez.">
                            <TextField
                                label="Último control médico" type="date" value={text.last_checkup} onChange={setT('last_checkup')}
                                slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: todayInput() } }}
                            />
                            <TextField
                                label="Último control dental" type="date" value={text.last_dental_checkup} onChange={setT('last_dental_checkup')}
                                slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: todayInput() } }}
                            />
                        </FormSection>

                        <FormSection icon={<LocalHospitalOutlinedIcon />} tone="blue" title="Dónde te atendés">
                            <TextField label="Médico de cabecera" value={text.primary_doctor_name} onChange={setT('primary_doctor_name')} slotProps={{ htmlInput: { maxLength: 100 } }} />
                            <TextField label="Teléfono del médico" type="tel" value={text.primary_doctor_phone} onChange={setT('primary_doctor_phone')} slotProps={{ htmlInput: { maxLength: 25, inputMode: 'tel' } }} />
                            <TextField
                                label="Hospital o centro de atención" value={text.care_center} onChange={setT('care_center')}
                                placeholder="El que te queda más cerca o al que vas habitualmente"
                                slotProps={{ htmlInput: { maxLength: 120 } }} sx={fullWidth}
                            />
                        </FormSection>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                            <Button variant="outlined" color="inherit" onClick={() => navigate('/dashboard')} disabled={saving}>Volver al inicio</Button>
                            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Guardando...' : 'Guardar ficha'}</Button>
                        </Box>
                    </Box>
                </form>
            )}

            <Snackbar open={Boolean(feedback)} autoHideDuration={3500} onClose={() => setFeedback('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity="success" variant="filled" onClose={() => setFeedback('')} sx={{ width: '100%' }}>{feedback}</Alert>
            </Snackbar>
        </Box>
    );
};

export default MedicalRecord;
