import { useContext, useEffect, useRef, useState } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Chip } from '@mui/material';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import DoctorSearch from '../components/DoctorSearch';
import DoctorHistory from '../components/DoctorHistory';
import PatientHistory from '../components/PatientHistory';
import PatientIntakes from '../components/PatientIntakes';
import TreatmentProgress from '../components/TreatmentProgress';
import AppointmentsCard from '../components/AppointmentsCard';
import EmergencyCard from '../components/EmergencyCard';
import PageHeader from '../components/PageHeader';
import IconBadge from '../components/IconBadge';
import { colors, cardSx, gradient } from '../theme';
import { TourContext } from '../components/tour/TourContext';
import { hasSeenTour } from '../components/tour/tourState';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const { startTour } = useContext(TourContext);
    const tourAsked = useRef(false);

    const [loadingProfile, setLoadingProfile] = useState(true);
    const [profileData, setProfileData] = useState(null);

    const [refreshTrigger, setRefreshTrigger] = useState(0);   // paciente: progreso
    const [historyVersion, setHistoryVersion] = useState(0);
    const [doctorPatientOpen, setDoctorPatientOpen] = useState(false);   // médico: historial

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getProfile(user.role);
                setProfileData(data);
            } catch (error) {
                console.error('Error validando el perfil:', error);
            } finally {
                setLoadingProfile(false);
            }
        };

        if (user) {
            fetchProfile();
        }
    }, [user]);

    // Recorrido guiado: recién cuando la persona completó sus datos y ve su inicio de verdad (una sola vez por usuario)
    useEffect(() => {
        if (loadingProfile || !profileData || !user || tourAsked.current || hasSeenTour(user)) return undefined;
        tourAsked.current = true;
        const t = setTimeout(startTour, 700);   // un instante para que terminen de dibujarse las tarjetas
        return () => { clearTimeout(t); tourAsked.current = false; };
    }, [loadingProfile, profileData, user, startTour]);

    if (loadingProfile) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader eyebrow="Inicio" title={`Bienvenido/a, ${user?.username}`} />

            {/* ===== Perfil incompleto ===== */}
            {!profileData && (
                <Paper
                    elevation={0}
                    sx={{ ...cardSx, p: { xs: 3, sm: 4 }, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}
                >
                    <IconBadge tone="amber" size={52}><ManageAccountsOutlinedIcon /></IconBadge>
                    <Box sx={{ flex: 1, minWidth: 240 }}>
                        <Typography variant="h6">Completá tu perfil</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Necesitamos unos datos más para habilitar todas las funciones de la plataforma.
                            Cuando termines, te mostramos un recorrido rápido por la aplicación.
                        </Typography>
                    </Box>
                    <Button variant="contained" onClick={() => navigate('/complete-profile')}>
                        Completar mi perfil
                    </Button>
                </Paper>
            )}

            {/* ===== Vista del médico ===== */}
            {profileData && user?.role === 'Doctor' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <Box data-tour="doctor-search">
                        <DoctorSearch onPatientChange={setDoctorPatientOpen} onConsultationCreated={() => setHistoryVersion((v) => v + 1)} />
                    </Box>
                    {!doctorPatientOpen && (
                        <Box data-tour="doctor-history">
                            <DoctorHistory refreshKey={historyVersion} />
                        </Box>
                    )}
                </Box>
            )}

            {/* ===== Vista del paciente ===== */}
            {profileData && user?.role === 'Paciente' && (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '300px minmax(0, 1fr)' },
                        gap: 3,
                        alignItems: 'start',
                    }}
                >
                    {/* Columna izquierda: credencial QR y acceso a Mis seguimientos, números de emergencia.
                        Queda fija al hacer scroll solo si la pantalla es lo bastante alta para mostrarla entera. */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 3,
                            '@media (min-width: 900px) and (min-height: 1150px)': { position: 'sticky', top: 110 },
                        }}
                    >
                        {/* Credencial QR */}
                        <Paper data-tour="qr" elevation={0} sx={{ ...cardSx, overflow: 'hidden', textAlign: 'center' }}>
                            <Box sx={{ height: 6, background: gradient }} />
                            <Box sx={{ p: 3 }}>
                                <Typography variant="overline" sx={{ color: colors.teal, fontWeight: 700, letterSpacing: '0.08em' }}>
                                    Mi credencial de salud
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'inline-flex',
                                        p: 2,
                                        my: 1.5,
                                        borderRadius: 3,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        bgcolor: '#fff',
                                    }}
                                >
                                    <QRCodeSVG value={profileData.id_patient} size={160} level="H" />
                                </Box>
                                <Typography fontWeight={700}>DNI: {profileData.dni}</Typography>
                            
                                {/* Contenedor en columna para forzar que vayan uno debajo del otro */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mt: 1 }}>
                                    {profileData.health_insurance && (
                                        <Chip
                                            size="small"
                                            label={`${profileData.health_insurance}${profileData.plan ? ` · ${profileData.plan}` : ''}`}
                                            sx={{ bgcolor: 'primary.light', color: 'primary.main' }}
                                        />
                                    )}
                                    <Typography variant="caption" color="text.secondary">
                                        Presentá este código al médico
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>

                        <AppointmentsCard />
                        <EmergencyCard />
                    </Box>

                    {/* Contenido (Vista del Paciente) */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                        <TreatmentProgress
                            refreshTrigger={refreshTrigger}
                            onRescheduled={() => setRefreshTrigger((prev) => prev + 1)}
                        />
                        <Box data-tour="meds">
                            <PatientIntakes
                                refreshKey={refreshTrigger}
                                onIntakeChecked={() => setRefreshTrigger((prev) => prev + 1)}
                            />
                        </Box>
                        <PatientHistory />
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default Dashboard;