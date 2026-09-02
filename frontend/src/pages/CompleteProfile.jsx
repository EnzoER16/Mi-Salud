import { useState, useContext } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createProfile } from '../services/api';

const CompleteProfile = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Estados para Paciente
    const [dni, setDni] = useState('');
    const [healthInsurance, setHealthInsurance] = useState('');
    const [plan, setPlan] = useState('');
    const [memberNumber, setMemberNumber] = useState('');
    const [address, setAddress] = useState('');

    // Estados para Médico
    const [specialty, setSpecialty] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const profileData = user.role === 'Paciente' 
                ? { dni, health_insurance: healthInsurance, plan, member_number: memberNumber, address }
                : { specialty, license_number: licenseNumber };

            await createProfile(profileData, user.role);
            setSuccess('Perfil completado con éxito. Redirigiendo...');
            
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Box 
            sx={{ 
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)'
            }}
        >
            <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 500, borderRadius: 2 }}>
                <Typography variant="h5" align="center" gutterBottom fontWeight="bold" color="primary">
                    Completar Perfil
                </Typography>
                <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 3 }}>
                    Necesitamos algunos datos más para configurar tu cuenta como {user?.role}.
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
                    
                    <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3, mb: 2, py: 1.5 }}>
                        Guardar Perfil
                    </Button>
                </form>
            </Paper>
        </Box>
    );
};

export default CompleteProfile;