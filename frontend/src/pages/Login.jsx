import { useState, useContext } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, loginWithGoogle } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google'; // Importamos el botón

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    // Tu función handleSubmit normal (queda igual)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const data = await loginUser({ email, password });
            login(data.user, data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    };

    // Nueva función para manejar el éxito de Google
    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        try {
            // Le pasamos el token de Google a nuestra API
            const data = await loginWithGoogle(credentialResponse.credential);
            
            // Iniciamos sesión en nuestro contexto global
            login(data.user, data.token);
            
            // Redirigimos al dashboard
            navigate('/dashboard');
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
                    Ingresa a tu cuenta
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    {/* Tus inputs de email y password... */}
                    <TextField fullWidth label="Correo Electrónico" type="email" variant="outlined" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <TextField fullWidth label="Contraseña" type="password" variant="outlined" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    
                    <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3, mb: 2, py: 1.5 }}>
                        Iniciar Sesión
                    </Button>
                </form>

                {/* Contenedor centrado para el botón de Google */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => {
                            setError('El inicio de sesión con Google falló.');
                        }}
                        theme="outline"
                        text="continue_with"
                        width="100%"
                    />
                </Box>

                <Typography align="center" variant="body2" sx={{ mt: 2 }}>
                    ¿No tienes una cuenta?{' '}
                    <Link to="/register" style={{ textDecoration: 'none', color: '#1976d2' }}>
                        Regístrate aquí
                    </Link>
                </Typography>
            </Paper>
        </Box>
    );
};

export default Login;