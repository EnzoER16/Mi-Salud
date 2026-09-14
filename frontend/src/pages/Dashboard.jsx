import { useContext, useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Alert, Grid } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../services/api';
// 1. Importamos el componente para dibujar el QR
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
            
            <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 2, fontWeight: 'bold' }}>
                Rol: {user?.role}
            </Typography>

            <Box sx={{ p: 2, backgroundColor: '#f0f4f8', borderRadius: 1 }}>
                {!profileData ? (
                    <>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Aún no has completado tus datos personales. Por favor, complétalos para habilitar todas las funciones.
                        </Alert>
                        <Button variant="contained" color="primary" onClick={() => navigate('/complete-profile')}>
                            Completar mi Perfil
                        </Button>
                    </>
                ) : (
                    <Grid container spacing={3} alignItems="center">
                        
                        {/* COLUMNA IZQUIERDA: Datos Personales */}
                        <Grid item xs={12} md={user?.role === 'Paciente' ? 8 : 12}>
                            
                            {/* ===== SECCIÓN EXCLUSIVA DEL PACIENTE ===== */}
                            {user?.role === 'Paciente' && (
                                <>
                                    <Typography variant="body1"><strong>DNI:</strong> {profileData.dni}</Typography>
                                    {/* ... los demás datos del paciente ... */}
                                    
                                    <Box sx={{ mt: 3 }}>
                                        <Button variant="outlined" color="primary" onClick={() => navigate('/complete-profile')}>
                                            Editar Datos Personales
                                        </Button>
                                    </Box>

                                    {/* ¡EL HISTORIAL TIENE QUE ESTAR ACÁ ADENTRO! */}
                                    <Box sx={{ mt: 4 }}>
                                        <PatientHistory />
                                    </Box>
                                </>
                            )}
                            
                            {/* ===== SECCIÓN EXCLUSIVA DEL MÉDICO ===== */}
                            {user?.role === 'Doctor' && (
                                <>
                                    <Typography variant="body1"><strong>Especialidad:</strong> {profileData.specialty}</Typography>
                                    <Typography variant="body1"><strong>Matrícula:</strong> {profileData.license_number}</Typography>
                                    
                                    <Box sx={{ mt: 3, mb: 3 }}>
                                        <Button variant="outlined" color="primary" onClick={() => navigate('/complete-profile')}>
                                            Editar Datos Personales
                                        </Button>
                                    </Box>

                                    <DoctorSearch />
                                    <DoctorHistory />
                                </>
                            )}
                        </Grid>

                        {/* COLUMNA DERECHA: Código QR (Solo para Pacientes) */}
                        {user?.role === 'Paciente' && (
                            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Paper elevation={3} sx={{ p: 2, backgroundColor: '#fff', textAlign: 'center', borderRadius: 2 }}>
                                    
                                    {/* Aquí generamos el QR. Le pasamos el DNI como valor. */}
                                    <QRCodeSVG 
                                        value={profileData.dni} 
                                        size={150} 
                                        level="H" // Nivel de corrección de errores alto
                                    />
                                    
                                    <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 'bold', color: 'text.secondary' }}>
                                        DNI: {profileData.dni}
                                    </Typography>
                                    <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                        Mostrá este código al médico
                                    </Typography>
                                </Paper>
                            </Grid>
                        )}
                        
                    </Grid>
                )}
            </Box>
        </Paper>
    );
};

export default Dashboard;