import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert } from '@mui/material';
import { loginUser } from '../services/api';
import { Link } from 'react-router-dom'

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const data = await loginUser({ email, password });
            
            // Guardamos el token en localStorage para mantener la sesión
            localStorage.setItem('token', data.token);
            
            // Aquí puedes redirigir al usuario (ej. usando react-router-dom)
            console.log("Login exitoso, usuario:", data.user);
            
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
                background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)' // Degradado sutil y moderno
            }}
        >
            <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 2 }}>
                <Typography variant="h5" align="center" gutterBottom fontWeight="bold" color="primary">
                    MiSalud+
                </Typography>
                <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 3 }}>
                    Ingresa a tu cuenta
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
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
                    
                    <Button 
                        type="submit" 
                        fullWidth 
                        variant="contained" 
                        color="primary" 
                        sx={{ mt: 3, mb: 2, py: 1.5 }}
                    >
                        Iniciar Sesión
                    </Button>
                    
                    {/* El botón de Google irá aquí más adelante */}
                    <Button 
                        fullWidth 
                        variant="outlined" 
                        color="secondary"
                    >
                        Continuar con Google
                    </Button>

                    <Typography align="center" variant="body2" sx={{ mt: 2 }}>
                        ¿No tienes una cuenta?{' '}
                        <Link to="/register" style={{ textDecoration: 'none', color: '#1976d2' }}>
                            Regístrate aquí
                        </Link>
                    </Typography>
                </form>
            </Paper>
        </Box>
    );
};

export default Login;