import { useContext, useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Alert } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../services/api';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [profileData, setProfileData] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getProfile(user.role);
                // Ya NO redirigimos. Solo guardamos los datos (o null si no tiene perfil).
                setProfileData(data);
            } catch (error) {
                console.error("Error validando el perfil:", error);
            } finally {
                setLoadingProfile(false);
            }
        };

        if (user) {
            fetchProfile();
        }
    }, [user]);

    if (loadingProfile) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    return (
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2, background: 'linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%)' }}>
            <Typography variant="h4" color="primary" gutterBottom>
                Bienvenido, {user?.username}
            </Typography>

            <Box sx={{ p: 2, backgroundColor: '#f0f4f8', borderRadius: 1 }}>
                
                {/* CONDICIÓN 1: El usuario todavía NO completó su perfil */}
                {!profileData ? (
                    <>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Aún no has completado tus datos personales. Por favor, complétalos para habilitar todas las funciones.
                        </Alert>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={() => navigate('/complete-profile')}
                        >
                            Completar mi Perfil
                        </Button>
                    </>
                ) : (
                    /* CONDICIÓN 2: El usuario YA completó su perfil, mostramos sus datos */
                    <>
                        {user?.role === 'Paciente' && (
                            <>
                                <Typography variant="body1"><strong>DNI:</strong> {profileData.dni}</Typography>
                                <Typography variant="body1"><strong>Obra Social:</strong> {profileData.health_insurance} (Plan {profileData.plan})</Typography>
                                <Typography variant="body1"><strong>N° Afiliado:</strong> {profileData.member_number}</Typography>
                            </>
                        )}
                        
                        {user?.role === 'Doctor' && (
                            <>
                                <Typography variant="body1"><strong>Especialidad:</strong> {profileData.specialty}</Typography>
                                <Typography variant="body1"><strong>Matrícula:</strong> {profileData.license_number}</Typography>
                            </>
                        )}

                        {/* Un único botón claro para administrar el perfil, eliminamos el duplicado de la ficha */}
                        <Box sx={{ mt: 3 }}>
                            <Button 
                                variant="outlined" 
                                color="primary" 
                                onClick={() => navigate('/complete-profile')}
                            >
                                Editar Datos Personales
                            </Button>
                        </Box>
                    </>
                )}
            </Box>
        </Paper>
    );
};

export default Dashboard;