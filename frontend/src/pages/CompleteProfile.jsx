import { useState, useEffect, useContext } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createProfile, getProfile } from '../services/api';
import PageHeader from '../components/PageHeader';
import { cardSx } from '../theme';

const CompleteProfile = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [dni, setDni] = useState('');
    const [healthInsurance, setHealthInsurance] = useState('');
    const [plan, setPlan] = useState('');
    const [memberNumber, setMemberNumber] = useState('');
    const [address, setAddress] = useState('');

    const [specialty, setSpecialty] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');

    // Al cargar la vista, buscamos si ya tiene perfil creado
    useEffect(() => {
        const fetchExistingProfile = async () => {
            try {
                const existingData = await getProfile(user.role);

                if (existingData) {
                    if (user.role === 'Paciente') {
                        setDni(existingData.dni || '');
                        setHealthInsurance(existingData.health_insurance || '');
                        setPlan(existingData.plan || '');
                        setMemberNumber(existingData.member_number || '');
                        setAddress(existingData.address || '');
                    } else if (user.role === 'Doctor') {
                        setSpecialty(existingData.specialty || '');
                        setLicenseNumber(existingData.license_number || '');
                    }
                }
            } catch (err) {
                console.log('No se encontró perfil previo, se creará uno nuevo.');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchExistingProfile();
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const profileData = user.role === 'Paciente'
                ? { dni, health_insurance: healthInsurance, plan, member_number: memberNumber, address }
                : { specialty, license_number: licenseNumber };

            await createProfile(profileData, user.role);
            setSuccess('Perfil guardado con éxito. Redirigiendo...');

            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    const isPatient = user?.role === 'Paciente';

    return (
        <Box sx={{ maxWidth: 720, width: '100%', mx: 'auto' }}>
            <PageHeader
                eyebrow="Mi cuenta"
                title={isPatient ? 'Mis datos personales' : 'Mis datos profesionales'}
                subtitle="Revisá y mantené actualizada la información de tu cuenta."
            />

            <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2.5, sm: 4 } }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <form onSubmit={handleSubmit}>
                    {isPatient ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                            <TextField
                                label="DNI"
                                required
                                value={dni}
                                onChange={(e) => setDni(e.target.value.replace(/[^0-9]/g, ''))}
                                slotProps={{ htmlInput: { maxLength: 8, inputMode: 'numeric' } }}
                                sx={{ gridColumn: { sm: '1 / -1' } }}
                            />
                            <TextField label="Obra social" value={healthInsurance} onChange={(e) => setHealthInsurance(e.target.value)} />
                            <TextField label="Plan" value={plan} onChange={(e) => setPlan(e.target.value)} />
                            <TextField label="Número de afiliado" value={memberNumber} onChange={(e) => setMemberNumber(e.target.value)} />
                            <TextField label="Dirección" value={address} onChange={(e) => setAddress(e.target.value)} />
                        </Box>
                    ) : (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                            <TextField label="Especialidad" required value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
                            <TextField label="Número de matrícula" required value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 4 }}>
                        <Button variant="outlined" color="inherit" onClick={() => navigate('/dashboard')}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="contained">
                            Guardar cambios
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
};

export default CompleteProfile;
