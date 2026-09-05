import { useContext } from 'react';
import { AppBar, Box, Toolbar, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Layout = ({ children }) => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            {/* Barra de Navegación Superior */}
            <AppBar position="static" color="primary" elevation={2}>
                <Toolbar>
                    {/* Logo / Nombre de la app (Clickeable) */}
                    <Typography 
                        variant="h6" 
                        component="div" 
                        sx={{ flexGrow: 1, cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => navigate('/dashboard')}
                    >
                        MiSalud+
                    </Typography>
                    
                    {/* Botones de navegación (solo se muestran si hay usuario) */}
                    {user && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Button color="inherit" onClick={() => navigate('/dashboard')}>
                                Inicio
                            </Button>
                            
                            {/* Solo el paciente ve el acceso directo a su ficha por ahora */}
                            {user.role === 'Paciente' && (
                                <Button color="inherit" onClick={() => navigate('/medical-record')}>
                                    Mi perfil
                                </Button>
                            )}
                            
                            <Button 
                                color="inherit" 
                                onClick={handleLogout} 
                                sx={{ ml: 2, border: '1px solid rgba(255,255,255,0.5)' }}
                            >
                                Salir
                            </Button>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            {/* Contenedor principal donde se inyectarán las pantallas (Dashboard, Ficha, etc.) */}
            <Container component="main" maxWidth="md" sx={{ flexGrow: 1, py: 4, display: 'flex', flexDirection: 'column' }}>
                {children}
            </Container>
        </Box>
    );
};

export default Layout;