import { useState, useContext } from 'react';
import { Box, TextField, Button, Typography, Alert, InputAdornment, IconButton, Divider } from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { loginUser, loginWithGoogle } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';
import { colors } from '../theme';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await loginUser({ email, password });
            login(data.user, data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        try {
            const data = await loginWithGoogle(credentialResponse.credential);
            login(data.user, data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <AuthShell
            title="Ingresá a tu cuenta"
            subtitle="Accedé a tu historial, tratamientos y recordatorios."
            footer={
                <Typography variant="body2" color="text.secondary">
                    ¿No tenés una cuenta?{' '}
                    <Link to="/register" style={{ color: colors.teal, fontWeight: 600, textDecoration: 'none' }}>
                        Registrate acá
                    </Link>
                </Typography>
            }
        >
            {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    required
                    label="Correo electrónico"
                    type="email"
                    margin="normal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start"><EmailOutlinedIcon fontSize="small" /></InputAdornment>
                            ),
                        },
                    }}
                />
                <TextField
                    fullWidth
                    required
                    label="Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start"><LockOutlinedIcon fontSize="small" /></InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        edge="end"
                                        aria-label="Mostrar u ocultar contraseña"
                                        onClick={() => setShowPassword((v) => !v)}
                                    >
                                        {showPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />

                <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 2, py: 1.4 }}>
                    {loading ? 'Ingresando...' : 'Iniciar sesión'}
                </Button>
            </form>

            <Divider sx={{ my: 3, color: 'text.secondary', fontSize: '0.8rem' }}>o continuá con</Divider>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('El inicio de sesión con Google falló.')}
                    theme="outline"
                    text="continue_with"
                    width="300"
                />
            </Box>
        </AuthShell>
    );
};

export default Login;
