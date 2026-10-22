import { useState, useEffect, useContext } from 'react';
import { Box, TextField, Button, Alert, CircularProgress, Snackbar } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getDoctorDetails, saveDoctorDetails } from '../services/api';
import PageHeader from '../components/PageHeader';
import FormSection from '../components/profile/FormSection';
import { ageFromDay, todayInput, str, orNullValue } from '../components/profile/format';

const FIELDS = ['first_name', 'last_name', 'birth_date', 'phone', 'locality'];

// "Datos personales" del médico (los profesionales están en /complete-profile)
const DoctorPersonal = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');
    const [needsProfile, setNeedsProfile] = useState(false);
    const [email, setEmail] = useState('');
    const [form, setForm] = useState(Object.fromEntries(FIELDS.map((f) => [f, ''])));

    useEffect(() => {
        if (user?.role !== 'Doctor') return;
        getDoctorDetails()
            .then((d) => {
                if (!d) return setNeedsProfile(true);   // todavía no cargó especialidad y matrícula
                setForm(Object.fromEntries(FIELDS.map((f) => [f, str(d[f])])));
                setEmail(str(d.email));
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [user]);

    if (user && user.role !== 'Doctor') return <Navigate to="/dashboard" replace />;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            await saveDoctorDetails(Object.fromEntries(FIELDS.map((f) => [f, orNullValue(form[f])])));
            setFeedback('Datos guardados correctamente.');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
    const age = ageFromDay(form.birth_date);

    return (
        <Box sx={{ maxWidth: 760, width: '100%', mx: 'auto' }}>
            <PageHeader eyebrow="Mi cuenta" title="Mis datos personales" subtitle="Tus datos de contacto como persona (los de tu práctica están en Datos profesionales)." />

            {needsProfile ? (
                <Alert severity="info" action={<Button color="inherit" size="small" onClick={() => navigate('/complete-profile')}>Completar</Button>}>
                    Primero completá tus datos profesionales (especialidad y matrícula).
                </Alert>
            ) : (
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {error && <Alert severity="error">{error}</Alert>}

                        <FormSection icon={<PersonOutlineIcon />} title="Datos personales">
                            <TextField label="Nombre" value={form.first_name} onChange={set('first_name')} slotProps={{ htmlInput: { maxLength: 60 } }} />
                            <TextField label="Apellido" value={form.last_name} onChange={set('last_name')} slotProps={{ htmlInput: { maxLength: 60 } }} />
                            <TextField
                                label="Fecha de nacimiento" type="date" value={form.birth_date} onChange={set('birth_date')}
                                helperText={age !== null ? `${age} años` : ' '}
                                slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: todayInput(), min: '1900-01-01' } }}
                            />
                            <TextField label="Localidad" value={form.locality} onChange={set('locality')} slotProps={{ htmlInput: { maxLength: 80 } }} />
                        </FormSection>

                        <FormSection icon={<HomeOutlinedIcon />} tone="blue" title="Contacto">
                            <TextField label="Correo electrónico" value={email} disabled helperText="Es el de tu cuenta" />
                            <TextField label="Teléfono" type="tel" value={form.phone} onChange={set('phone')} slotProps={{ htmlInput: { maxLength: 25, inputMode: 'tel' } }} />
                        </FormSection>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                            <Button variant="outlined" color="inherit" onClick={() => navigate('/dashboard')} disabled={saving}>Volver al inicio</Button>
                            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
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

export default DoctorPersonal;
