import { useContext, useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Alert, Grid } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import DoctorSearch from '../components/DoctorSearch';
import DoctorHistory from '../components/DoctorHistory';
import PatientHistory from '../components/PatientHistory';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [profileData, setProfileData] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getProfile(user.role);
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
            {/* <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 2, fontWeight: 'bold' }}>
                Panel de {user?.role}
            </Typography> */}

            <Box sx={{ p: 2, backgroundColor: '#f0f4f8', borderRadius: 1 }}>
                {!profileData ? (
                    <>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Aún no has completado tu perfil. Por favor, complétalo para habilitar todas las funciones.
                        </Alert>
                        <Button variant="contained" color="primary" onClick={() => navigate('/complete-profile')}>
                            Completar mi Perfil
                        </Button>
                    </>
                ) : (
                    <Grid container spacing={3} alignItems="flex-start">
                        
                        {/* ===== VISTA DEL PACIENTE ===== */}
                        {user?.role === 'Paciente' && (
                            <>
                                {/* AHORA PRIMERO: Credencial QR a la izquierda (ocupa 4/12 del ancho en PC) */}
                                <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Paper elevation={3} sx={{ p: 3, backgroundColor: '#fff', textAlign: 'center', borderRadius: 2, width: '100%' }}>
                                        <QRCodeSVG 
                                            value={profileData.dni} 
                                            size={160} 
                                            level="H" 
                                        />
                                        <Typography variant="subtitle2" display="block" sx={{ mt: 2, fontWeight: 'bold', color: 'text.secondary' }}>
                                            DNI: {profileData.dni}
                                        </Typography>
                                        <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                            Presentá este código al médico
                                        </Typography>
                                    </Paper>
                                </Grid>

                                {/* AHORA SEGUNDO: Historial a la derecha (ocupa 8/12 del ancho en PC) */}
                                <Grid item xs={12} md={8}>
                                    <PatientHistory />
                                </Grid>
                            </>
                        )}
                        
                        {/* ===== VISTA DEL MÉDICO ===== */}
                        {user?.role === 'Doctor' && (
                            <Grid item xs={12}>
                                <DoctorSearch />
                                <DoctorHistory />
                            </Grid>
                        )}
                        
                    </Grid>
                )}
            </Box>
        </Paper>
    );
};

export default Dashboard;