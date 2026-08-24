import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, MenuItem } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Paciente');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await registerUser({ username, email, password, role });
            // Si el registro es exitoso, lo mandamos al login
            navigate('/login');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Box 
            sx={{ 
                minHeight: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)'
            }}
        >
            <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 2 }}>
                <Typography variant="h5" align="center" gutterBottom fontWeight="bold" color="primary">
                    MiSalud+
                </Typography>
                <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 3 }}>
                    Crea tu cuenta
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Nombre de Usuario"
                        variant="outlined"
                        margin="normal"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <TextField
                        fullWidth
                        label="Correo Electrónico"
                        type="email"
                        variant="outlined"
                        margin="normal"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <TextField
                        fullWidth
                        label="Contraseña"
                        type="password"
                        variant="outlined"
                        margin="normal"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <TextField
                        select
                        fullWidth
                        label="Rol"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        margin="normal"
                    >
                        <MenuItem value="Paciente">Paciente</MenuItem>
                        <MenuItem value="Doctor">Doctor/a</MenuItem>
                    </TextField>
                    
                    <Button 
                        type="submit" 
                        fullWidth 
                        variant="contained" 
                        color="primary" 
                        sx={{ mt: 3, mb: 2, py: 1.5 }}
                    >
                        Registrarse
                    </Button>
                </form>

                <Typography align="center" variant="body2">
                    ¿Ya tienes una cuenta?{' '}
                    <Link to="/login" style={{ textDecoration: 'none', color: '#1976d2' }}>
                        Inicia sesión aquí
                    </Link>
                </Typography>
            </Paper>
        </Box>
    );
};

export default Register;