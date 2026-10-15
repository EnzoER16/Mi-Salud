import { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, InputAdornment, ToggleButton, ToggleButtonGroup } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';
import AuthShell from '../components/AuthShell';
import { colors } from '../theme';

const adornment = (icon) => ({
    input: { startAdornment: <InputAdornment position="start">{icon}</InputAdornment> },
});

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Paciente');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await registerUser({ username, email, password, role });
            navigate('/login');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            title="Creá tu cuenta"
            subtitle="Sumate a MiSalud+ en un par de minutos."
            footer={
                <Typography variant="body2" color="text.secondary">
                    ¿Ya tenés una cuenta?{' '}
                    <Link to="/login" style={{ color: colors.teal, fontWeight: 600, textDecoration: 'none' }}>
                        Iniciá sesión
                    </Link>
                </Typography>
            }
        >
            {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mt: 1, mb: 0.75 }}>
                    Soy...
                </Typography>
                <ToggleButtonGroup
                    exclusive
                    fullWidth
                    color="primary"
                    value={role}
                    onChange={(e, value) => value && setRole(value)}
                >
                    <ToggleButton value="Paciente" sx={{ gap: 1, textTransform: 'none', fontWeight: 600, py: 1.1 }}>
                        <HealthAndSafetyOutlinedIcon fontSize="small" /> Paciente
                    </ToggleButton>
                    <ToggleButton value="Doctor" sx={{ gap: 1, textTransform: 'none', fontWeight: 600, py: 1.1 }}>
                        <MedicalServicesOutlinedIcon fontSize="small" /> Médico/a
                    </ToggleButton>
                </ToggleButtonGroup>

                <TextField
                    fullWidth required label="Nombre y apellido" margin="normal"
                    value={username} onChange={(e) => setUsername(e.target.value)}
                    slotProps={adornment(<PersonOutlineIcon fontSize="small" />)}
                />
                <TextField
                    fullWidth required label="Correo electrónico" type="email" margin="normal"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    slotProps={adornment(<EmailOutlinedIcon fontSize="small" />)}
                />
                <TextField
                    fullWidth required label="Contraseña" type="password" margin="normal"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    slotProps={adornment(<LockOutlinedIcon fontSize="small" />)}
                />

                <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 2, py: 1.4 }}>
                    {loading ? 'Creando cuenta...' : 'Registrarme'}
                </Button>
            </form>

            <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                    Tu nombre es el que van a ver los médicos y pacientes en la plataforma.
                </Typography>
            </Box>
        </AuthShell>
    );
};

export default Register;
