import { useContext, useState } from 'react';
import { AppBar, Box, Toolbar, Typography, Container, IconButton, Menu, MenuItem, Divider, Avatar, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Layout = ({ children }) => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleNavigate = (path) => {
        handleMenuClose();
        navigate(path);
    };

    const handleLogout = () => {
        handleMenuClose();
        logout();
        navigate('/login');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <AppBar position="static" color="primary" elevation={2}>
                <Toolbar>
                    {/* Logo clickeable */}
                    <Typography 
                        variant="h6" 
                        component="div" 
                        sx={{ flexGrow: 1, cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => navigate('/dashboard')}
                    >
                        MiSalud+
                    </Typography>
                    
                    {user && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            
                            {/* NUEVO BOTÓN DE INICIO EXPLÍCITO */}
                            <Button 
                                color="inherit" 
                                onClick={() => handleNavigate('/dashboard')}
                                sx={{ fontWeight: '500', textTransform: 'none', fontSize: '1rem' }}
                            >
                                Inicio
                            </Button>

                            <IconButton onClick={handleMenuOpen} color="inherit" sx={{ p: 0 }}>
                                <Avatar sx={{ bgcolor: 'secondary.main', color: '#fff' }}>
                                    {user.username.charAt(0).toUpperCase()}
                                </Avatar>
                            </IconButton>
                            
                            {/* Menú Desplegable */}
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            >
                                <MenuItem disabled>
                                    <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 'bold' }}>
                                        {user.username} {/* ({user.role}) */}
                                    </Typography>
                                </MenuItem>
                                <Divider />
                                
                                {user.role === 'Paciente' && [
                                    <MenuItem key="datos" onClick={() => handleNavigate('/complete-profile')}>Datos Personales</MenuItem>,
                                    <MenuItem key="ficha" onClick={() => handleNavigate('/medical-record')}>Mi Ficha Médica</MenuItem>
                                ]}
                                
                                {user.role === 'Doctor' && (
                                    <MenuItem onClick={() => handleNavigate('/complete-profile')}>Datos Profesionales</MenuItem>
                                )}
                                
                                <Divider />
                                <MenuItem onClick={handleLogout} sx={{ color: 'error.main', fontWeight: 'bold' }}>
                                    Cerrar Sesión
                                </MenuItem>
                            </Menu>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            <Container component="main" maxWidth="md" sx={{ flexGrow: 1, py: 4, display: 'flex', flexDirection: 'column' }}>
                {children}
            </Container>
        </Box>
    );
};

export default Layout;