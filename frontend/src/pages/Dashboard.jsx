import { useContext, useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, CircularProgress } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../services/api';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [profileData, setProfileData] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getProfile(user.role);
                
                if (!data) {
                    // Si data es null, el perfil está incompleto. Lo mandamos a llenarlo.
                    navigate('/complete-profile', { replace: true });
                } else {
                    // Si existe, guardamos los datos para mostrarlos y quitamos la pantalla de carga
                    setProfileData(data);
                    setLoadingProfile(false);
                }
            } catch (error) {
                console.error("Error validando el perfil:", error);
                setLoadingProfile(false);
            }
        };

        if (user) {
            fetchProfile();
        }
    }, [user, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Pantalla de carga mientras va y vuelve la petición a Flask
    if (loadingProfile) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <Paper elevation={2} sx={{ p: 4, borderRadius: 2, background: 'linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%)' }}>
                <Typography variant="h4" color="primary" gutterBottom>
                    Bienvenido, {user?.username}
                </Typography>
                
                <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Rol: {user?.role}
                </Typography>

                {/* Mostramos información distinta dependiendo del rol y de los datos que trajimos */}
                <Box sx={{ mb: 4, p: 2, backgroundColor: '#f0f4f8', borderRadius: 1 }}>
                    {user?.role === 'Paciente' && profileData && (
                        <>
                            <Typography variant="body1"><strong>DNI:</strong> {profileData.dni}</Typography>
                            <Typography variant="body1"><strong>Obra Social:</strong> {profileData.health_insurance} (Plan {profileData.plan})</Typography>
                            <Typography variant="body1"><strong>N° Afiliado:</strong> {profileData.member_number}</Typography>
                            
                            <Button 
                                variant="contained" 
                                color="primary" 
                                sx={{ mt: 2 }}
                                onClick={() => navigate('/medical-record')}
                            >
                                Ver / Editar mi Ficha Médica
                            </Button>

                        </>
                    )}
                    
                    {user?.role === 'Doctor' && profileData && (
                        <>
                            <Typography variant="body1"><strong>Especialidad:</strong> {profileData.specialty}</Typography>
                            <Typography variant="body1"><strong>Matrícula:</strong> {profileData.license_number}</Typography>
                        </>
                    )}
                </Box>
                
                <Button variant="outlined" color="error" onClick={handleLogout}>
                    Cerrar Sesión
                </Button>
            </Paper>
        </Box>
    );
};

export default Dashboard;