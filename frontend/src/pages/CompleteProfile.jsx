import { useState, useEffect, useContext } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createProfile, getProfile } from '../services/api';

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
                
                // Si el perfil ya existe, precargamos los inputs
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
                // Si hay error (ej: no encontró el perfil), no hacemos nada malo,
                // simplemente dejamos los inputs en blanco para que los llene por primera vez.
                console.log("No se encontró perfil previo, se creará uno nuevo.");
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

            // Aquí el backend debe encargarse de crear o actualizar según corresponda
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

    return (
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
            <Typography variant="h5" color="primary" gutterBottom fontWeight="bold">
                Mis Datos Personales
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Revisa y mantén actualizada la información de tu cuenta como {user?.role}.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <form onSubmit={handleSubmit}>
                {user?.role === 'Paciente' ? (
                    <>
                        <TextField fullWidth label="DNI" variant="outlined" margin="normal" required value={dni} onChange={(e) => setDni(e.target.value)} />
                        <TextField fullWidth label="Obra Social" variant="outlined" margin="normal" required value={healthInsurance} onChange={(e) => setHealthInsurance(e.target.value)} />
                        <TextField fullWidth label="Plan" variant="outlined" margin="normal" value={plan} onChange={(e) => setPlan(e.target.value)} />
                        <TextField fullWidth label="Número de Afiliado" variant="outlined" margin="normal" required value={memberNumber} onChange={(e) => setMemberNumber(e.target.value)} />
                        <TextField fullWidth label="Dirección" variant="outlined" margin="normal" required value={address} onChange={(e) => setAddress(e.target.value)} />
                    </>
                ) : (
                    <>
                        <TextField fullWidth label="Especialidad" variant="outlined" margin="normal" required value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
                        <TextField fullWidth label="Número de Matrícula" variant="outlined" margin="normal" required value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
                    </>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                    <Button 
                        variant="outlined" 
                        color="inherit" 
                        onClick={() => navigate('/dashboard')}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary"
                    >
                        Guardar Cambios
                    </Button>
                </Box>
            </form>
        </Paper>
    );
};

export default CompleteProfile;