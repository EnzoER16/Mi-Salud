import { useState, useEffect, useContext } from 'react';
import { Box, TextField, Button, Alert, CircularProgress, MenuItem, Snackbar } from '@mui/material';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    createProfile, getProfile, getPatientDetails, savePatientDetails, getDoctorDetails, saveDoctorDetails,
} from '../services/api';
import PageHeader from '../components/PageHeader';
import FormSection, { fullWidth } from '../components/profile/FormSection';
import EmergencyContacts from '../components/profile/EmergencyContacts';
import { SEX_OPTIONS, MARITAL_OPTIONS, ageFromDay, todayInput, str, orNullValue } from '../components/profile/format';

// Quitamos first_name y last_name de acá porque ahora usamos el nombre global del usuario
const PATIENT_DETAIL_FIELDS = ['birth_date', 'sex', 'marital_status', 'occupation', 'phone', 'locality', 'province', 'postal_code'];
const DOCTOR_PRO_FIELDS = ['workplace', 'office_address', 'attention_hours', 'accepted_insurances', 'bio'];

const CompleteProfile = () => {
    // Agregamos 'login' para poder actualizar el nombre en vivo en el menú superior
    const { user, login } = useContext(AuthContext);
    const navigate = useNavigate();
    const isPatient = user?.role === 'Paciente';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');
    const [hasProfile, setHasProfile] = useState(false);

    // Estado del nombre unificado (viene del registro)
    const [name, setName] = useState(user?.username || '');

    // Paciente
    const [base, setBase] = useState({ dni: '', health_insurance: '', plan: '', member_number: '', address: '' });
    const [details, setDetails] = useState(Object.fromEntries(PATIENT_DETAIL_FIELDS.map((f) => [f, ''])));
    const [email, setEmail] = useState('');
    
    // Médico
    const [pro, setPro] = useState({ specialty: '', license_number: '' });
    const [place, setPlace] = useState(Object.fromEntries(DOCTOR_PRO_FIELDS.map((f) => [f, ''])));

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            try {
                const profile = await getProfile(user.role);
                if (profile) {
                    setHasProfile(true);
                    
                    // Cargamos el nombre que viene de la base de datos (tabla users)
                    setName(profile.username || user?.username || '');

                    if (isPatient) {
                        setBase({
                            dni: str(profile.dni), health_insurance: str(profile.health_insurance), plan: str(profile.plan),
                            member_number: str(profile.member_number), address: str(profile.address),
                        });
                        const d = await getPatientDetails();
                        if (d) {
                            setDetails(Object.fromEntries(PATIENT_DETAIL_FIELDS.map((f) => [f, str(d[f])])));
                            setEmail(str(d.email));
                        }
                    } else {
                        setPro({ specialty: str(profile.specialty), license_number: str(profile.license_number) });
                        const d = await getDoctorDetails();
                        if (d) setPlace(Object.fromEntries(DOCTOR_PRO_FIELDS.map((f) => [f, str(d[f])])));
                    }
                }
            } catch (err) {
                console.log('No se pudo cargar el perfil previo:', err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user, isPatient]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) return setError('El nombre y apellido son obligatorios.');
        if (isPatient && base.dni.length < 7) return setError('El DNI debe tener al menos 7 dígitos.');
        if (!isPatient && pro.license_number.trim().length < 4) return setError('Ingresá una matrícula válida.');

        setSaving(true);
        try {
            if (isPatient) {
                // Enviamos el nombre junto con los datos base para que el backend actualice el usuario
                await createProfile({ ...base, username: name.trim() }, 'Paciente');
                const payload = Object.fromEntries(PATIENT_DETAIL_FIELDS.map((f) => [f, orNullValue(details[f])]));
                await savePatientDetails(payload);
            } else {
                await createProfile({ ...pro, username: name.trim() }, 'Doctor');
                await saveDoctorDetails(Object.fromEntries(DOCTOR_PRO_FIELDS.map((f) => [f, orNullValue(place[f])])));
            }
            
            // Actualizamos la sesión en React para que el nombre cambie instantáneamente en el navbar
            const updatedUser = { ...user, username: name.trim() };
            login(updatedUser, localStorage.getItem('token'));

            setHasProfile(true);
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

    const setB = (key) => (e) => setBase((prev) => ({ ...prev, [key]: e.target.value }));
    const setD = (key) => (e) => setDetails((prev) => ({ ...prev, [key]: e.target.value }));
    const setP = (key) => (e) => setPlace((prev) => ({ ...prev, [key]: e.target.value }));
    const age = ageFromDay(details.birth_date);

    return (
        <Box sx={{ maxWidth: 760, width: '100%', mx: 'auto' }}>
            <PageHeader
                eyebrow="Mi cuenta"
                title={isPatient ? 'Mis datos personales' : 'Mis datos profesionales'}
                subtitle={isPatient
                    ? 'Mantené actualizada tu información: ayuda a que te atiendan más rápido y mejor.'
                    : 'Esta información identifica tu consultorio y tu práctica profesional.'}
            />

            <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {error && <Alert severity="error">{error}</Alert>}

                    {isPatient ? (
                        <>
                            <FormSection icon={<PersonOutlineIcon />} title="Datos personales" description="Cómo figurás en tu ficha.">
                                {/* Único campo de nombre (reemplaza a first_name y last_name) */}
                                <TextField 
                                    label="Nombre y apellido" 
                                    required 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    sx={fullWidth} 
                                />
                                <TextField
                                    label="DNI" required value={base.dni}
                                    onChange={(e) => setBase((prev) => ({ ...prev, dni: e.target.value.replace(/[^0-9]/g, '') }))}
                                    slotProps={{ htmlInput: { maxLength: 8, inputMode: 'numeric' } }}
                                />
                                <TextField
                                    label="Fecha de nacimiento" type="date" value={details.birth_date} onChange={setD('birth_date')}
                                    helperText={age !== null ? `${age} años` : ' '}
                                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: todayInput(), min: '1900-01-01' } }}
                                />
                                <TextField select label="Sexo" value={details.sex} onChange={setD('sex')}>
                                    <MenuItem value=""><em>Sin especificar</em></MenuItem>
                                    {SEX_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                                </TextField>
                                <TextField select label="Estado civil" value={details.marital_status} onChange={setD('marital_status')}>
                                    <MenuItem value=""><em>Sin especificar</em></MenuItem>
                                    {MARITAL_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                                </TextField>
                                <TextField label="Ocupación" value={details.occupation} onChange={setD('occupation')} slotProps={{ htmlInput: { maxLength: 80 } }} sx={fullWidth} />
                            </FormSection>

                            <FormSection icon={<HomeOutlinedIcon />} tone="blue" title="Domicilio y contacto" description="Para ubicarte y comunicarnos con vos.">
                                <TextField label="Correo electrónico" value={email} disabled helperText="Es el de tu cuenta" />
                                <TextField label="Teléfono" type="tel" value={details.phone} onChange={setD('phone')} slotProps={{ htmlInput: { maxLength: 25, inputMode: 'tel' } }} />
                                <TextField label="Domicilio" value={base.address} onChange={setB('address')} slotProps={{ htmlInput: { maxLength: 100 } }} sx={fullWidth} placeholder="Calle y número" />
                                <TextField label="Localidad" value={details.locality} onChange={setD('locality')} slotProps={{ htmlInput: { maxLength: 80 } }} />
                                <TextField label="Provincia" value={details.province} onChange={setD('province')} slotProps={{ htmlInput: { maxLength: 60 } }} />
                                <TextField label="Código postal" value={details.postal_code} onChange={setD('postal_code')} slotProps={{ htmlInput: { maxLength: 10 } }} />
                            </FormSection>

                            <FormSection icon={<HealthAndSafetyOutlinedIcon />} tone="green" title="Cobertura médica" description="Tu obra social o prepaga.">
                                <TextField label="Obra social" value={base.health_insurance} onChange={setB('health_insurance')} slotProps={{ htmlInput: { maxLength: 50 } }} />
                                <TextField label="Plan" value={base.plan} onChange={setB('plan')} slotProps={{ htmlInput: { maxLength: 10 } }} />
                                <TextField label="Número de afiliado" value={base.member_number} onChange={setB('member_number')} slotProps={{ htmlInput: { maxLength: 20 } }} sx={fullWidth} />
                            </FormSection>
                        </>
                    ) : (
                        <>
                            <FormSection icon={<BadgeOutlinedIcon />} title="Identificación profesional">
                                {/* Agregamos el campo de nombre también para el médico */}
                                <TextField 
                                    label="Nombre y apellido" 
                                    required 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    sx={fullWidth} 
                                />
                                <TextField label="Especialidad" required value={pro.specialty} onChange={(e) => setPro((p) => ({ ...p, specialty: e.target.value }))} slotProps={{ htmlInput: { maxLength: 50 } }} />
                                <TextField label="Número de matrícula" required value={pro.license_number} onChange={(e) => setPro((p) => ({ ...p, license_number: e.target.value }))} slotProps={{ htmlInput: { maxLength: 20 } }} />
                            </FormSection>

                            <FormSection icon={<StorefrontOutlinedIcon />} tone="blue" title="Lugar de atención" description="Dónde y cuándo te pueden encontrar tus pacientes.">
                                <TextField label="Consultorio, clínica u hospital" value={place.workplace} onChange={setP('workplace')} slotProps={{ htmlInput: { maxLength: 120 } }} sx={fullWidth} />
                                <TextField label="Dirección" value={place.office_address} onChange={setP('office_address')} slotProps={{ htmlInput: { maxLength: 150 } }} />
                                <TextField label="Horarios de atención" value={place.attention_hours} onChange={setP('attention_hours')} placeholder="Ej: Lun a Vie de 9 a 13" slotProps={{ htmlInput: { maxLength: 150 } }} />
                                <TextField label="Obras sociales que atendés" value={place.accepted_insurances} onChange={setP('accepted_insurances')} placeholder="Ej: OSDE, Swiss Medical, PAMI" slotProps={{ htmlInput: { maxLength: 255 } }} sx={fullWidth} />
                            </FormSection>

                            <FormSection icon={<MedicalServicesOutlinedIcon />} tone="green" title="Presentación" description="Una breve descripción de tu práctica (opcional)." columns={1}>
                                <TextField
                                    multiline minRows={3} label="Sobre mí" value={place.bio} onChange={setP('bio')}
                                    slotProps={{ htmlInput: { maxLength: 500 } }} helperText={`${place.bio.length}/500`}
                                />
                            </FormSection>
                        </>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                        <Button variant="outlined" color="inherit" onClick={() => navigate('/dashboard')} disabled={saving}>
                            Volver al inicio
                        </Button>
                        <Button type="submit" variant="contained" disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                        </Button>
                    </Box>
                </Box>
            </form>

            {/* Fuera del <form>: sus diálogos tienen su propio formulario y los eventos de React burbujean por los portales */}
            {isPatient && (
                <Box sx={{ mt: 3 }}>
                    <EmergencyContacts disabled={!hasProfile} onFeedback={setFeedback} />
                </Box>
            )}

            <Snackbar
                open={Boolean(feedback)} autoHideDuration={3500} onClose={() => setFeedback('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" variant="filled" onClose={() => setFeedback('')} sx={{ width: '100%' }}>{feedback}</Alert>
            </Snackbar>
        </Box>
    );
};

export default CompleteProfile;