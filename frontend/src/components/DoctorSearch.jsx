import { useState } from 'react';
import { Box, Typography, Button, TextField, Paper, Alert, Avatar, InputAdornment } from '@mui/material';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import QrCodeScannerOutlinedIcon from '@mui/icons-material/QrCodeScannerOutlined';
import BloodtypeOutlinedIcon from '@mui/icons-material/BloodtypeOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Scanner } from '@yudiel/react-qr-scanner';
import { getPatientByDni, createConsultation } from '../services/api';
import NewTreatmentForm from './NewTreatmentForm';
import TreatmentManager from './TreatmentManager';
import PatientExtraInfo from './PatientExtraInfo';
import IconBadge from './IconBadge';
import { colors, cardSx } from '../theme';

const initials = (name = '') =>
    name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'P';

// Tarjetita con un dato de la ficha médica
const InfoTile = ({ icon, label, value, warn = false }) => (
    <Box
        sx={{
            p: 2,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: warn ? '#F5D9A6' : 'divider',
            bgcolor: warn ? '#FFF9EC' : '#FAFCFD',
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: warn ? '#B26A00' : 'text.secondary', mb: 0.5 }}>
            {icon}
            <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {label}
            </Typography>
        </Box>
        <Typography sx={{ fontWeight: 600 }}>{value}</Typography>
    </Box>
);

const DoctorSearch = ({ onConsultationCreated }) => {
    const [dniInput, setDniInput] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [patientData, setPatientData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Estados para la nueva consulta
    const [showConsultationForm, setShowConsultationForm] = useState(false);
    const [location, setLocation] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [startingConsultation, setStartingConsultation] = useState(false);
    const [activeConsultationId, setActiveConsultationId] = useState(null);
    const [consultationSuccess, setConsultationSuccess] = useState('');
    const [treatmentsVersion, setTreatmentsVersion] = useState(0);

    const resetConsultation = () => {
        setShowConsultationForm(false);
        setActiveConsultationId(null);
        setConsultationSuccess('');
        setLocation('');
        setDiagnosis('');
    };

    const handleSearch = async (dniToSearch) => {
        if (!dniToSearch) return;

        setLoading(true);
        setError('');
        setPatientData(null);
        setIsScanning(false);
        resetConsultation();

        try {
            const data = await getPatientByDni(dniToSearch);
            if (!data) {
                setError('No se encontró ningún paciente con ese DNI.');
            } else {
                setPatientData(data);
            }
        } catch (err) {
            setError(err.message || 'Paciente no encontrado o sin ficha médica.');
        } finally {
            setLoading(false);
            setDniInput('');
        }
    };

    const handleStartConsultation = async () => {
        if (!location || !diagnosis) {
            setError('Por favor, ingresá el lugar de atención y el diagnóstico.');
            return;
        }

        setStartingConsultation(true);
        setError('');

        try {
            const data = await createConsultation(patientData.id_patient, { location, diagnosis });
            setActiveConsultationId(data.consultation.id_consultation);
            setConsultationSuccess('Consulta registrada. Ahora podés recetar un tratamiento.');
            if (onConsultationCreated) onConsultationCreated();
        } catch (err) {
            setError(err.message || 'Error al guardar la consulta');
        } finally {
            setStartingConsultation(false);
        }
    };

    const record = patientData?.medical_record;
    const allergies = record?.allergies?.trim();
    const hasAllergies = Boolean(allergies) && !/^(ninguna|no|-)$/i.test(allergies);

    return (
        <Box>
            {/* ===== Tarjeta de búsqueda (como en el boceto) ===== */}
            <Paper elevation={0} sx={{ ...cardSx, p: { xs: 2.5, sm: 3.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <IconBadge tone="blue" size={48}><PersonSearchOutlinedIcon /></IconBadge>
                    <Box>
                        <Typography variant="h6">Buscar Paciente</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Ingresá el DNI o escaneá el código QR del paciente.
                        </Typography>
                    </Box>
                </Box>

                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.75 }}>
                    DNI del paciente
                </Typography>
                <Box
                    component="form"
                    onSubmit={(e) => { e.preventDefault(); handleSearch(dniInput); }}
                    sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
                >
                    <TextField
                        placeholder="Ingresar DNI manualmente"
                        value={dniInput}
                        onChange={(e) => setDniInput(e.target.value.replace(/[^0-9]/g, ''))}
                        sx={{ flex: 1, minWidth: 220 }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start"><BadgeOutlinedIcon fontSize="small" /></InputAdornment>
                                ),
                            },
                            htmlInput: { maxLength: 8, inputMode: 'numeric' },
                        }}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        startIcon={<SearchRoundedIcon />}
                        disabled={loading || !dniInput}
                        sx={{ py: 1.7 }}
                    >
                        Buscar
                    </Button>

                    <Typography variant="body2" color="text.secondary">o</Typography>

                    <Button
                        variant="outlined"
                        startIcon={isScanning ? <CloseRoundedIcon /> : <QrCodeScannerOutlinedIcon />}
                        onClick={() => setIsScanning((v) => !v)}
                        sx={{ py: 1.7 }}
                    >
                        {isScanning ? 'Cancelar escáner' : 'Escanear QR'}
                    </Button>
                </Box>

                {isScanning && (
                    <Box
                        sx={{
                            maxWidth: 320,
                            mx: 'auto',
                            mt: 3,
                            borderRadius: 3,
                            overflow: 'hidden',
                            border: '2px solid',
                            borderColor: 'primary.main',
                        }}
                    >
                        <Scanner
                            onScan={(result) => {
                                if (result && result.length > 0) {
                                    handleSearch(result[0].rawValue);
                                }
                            }}
                            paused={loading}
                        />
                    </Box>
                )}

                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </Paper>

            {/* ===== Ficha del paciente ===== */}
            {patientData && (
                <Paper elevation={0} sx={{ ...cardSx, mt: 3, overflow: 'hidden' }}>
                    <Box
                        sx={{
                            p: { xs: 2.5, sm: 3 },
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            background: 'linear-gradient(90deg, #F1F7FD 0%, #F0FAF7 100%)',
                        }}
                    >
                        <Avatar
                            sx={{ width: 52, height: 52, bgcolor: '#fff', color: colors.teal, fontWeight: 700, border: '1px solid', borderColor: 'divider' }}
                        >
                            {initials(patientData.name)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="h6" noWrap>{patientData.name || 'Paciente'}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                DNI {patientData.dni}
                                {patientData.health_insurance
                                    ? ` · ${patientData.health_insurance}${patientData.plan ? ` ${patientData.plan}` : ''}`
                                    : ''}
                            </Typography>
                        </Box>
                        <Button
                            size="small"
                            color="inherit"
                            onClick={() => { setPatientData(null); resetConsultation(); }}
                            sx={{ letterSpacing: 0, textTransform: 'none', color: 'text.secondary' }}
                        >
                            Cerrar ficha
                        </Button>
                    </Box>

                    <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Ficha médica</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
                            <InfoTile
                                icon={<BloodtypeOutlinedIcon fontSize="small" />}
                                label="Grupo sanguíneo"
                                value={record?.blood_group || 'No especificado'}
                            />
                            <InfoTile
                                icon={<WarningAmberRoundedIcon fontSize="small" />}
                                label="Alergias"
                                value={hasAllergies ? allergies : 'Ninguna'}
                                warn={hasAllergies}
                            />
                            <InfoTile
                                icon={<AssignmentOutlinedIcon fontSize="small" />}
                                label="Antecedentes"
                                value={record?.antecedents || 'Ninguno'}
                            />
                        </Box>

                        {/* Datos adicionales que cargó el paciente (peso, condiciones, contactos de emergencia, vacunas...) */}
                        <PatientExtraInfo patientData={patientData} />

                        <TreatmentManager patientId={patientData.id_patient} refreshKey={treatmentsVersion} />

                        {/* Paso 1: botón para iniciar la consulta */}
                        {!showConsultationForm && !activeConsultationId && (
                            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setShowConsultationForm(true)}>
                                Registrar nueva consulta
                            </Button>
                        )}

                        {/* Paso 2: formulario de la consulta */}
                        {showConsultationForm && !activeConsultationId && (
                            <Box sx={{ p: 3, bgcolor: '#F4F9FD', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    Detalles de la atención
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 2 }}>
                                    <TextField
                                        fullWidth label="Lugar de atención"
                                        placeholder="Ej: Consultorio 3, Guardia"
                                        value={location} onChange={(e) => setLocation(e.target.value)}
                                    />
                                    <TextField
                                        fullWidth label="Diagnóstico clínico" multiline minRows={2}
                                        placeholder="Ej: Faringitis aguda. Se receta antibiótico."
                                        value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
                                    />
                                </Box>
                                <Box sx={{ mt: 2.5, display: 'flex', gap: 1.5 }}>
                                    <Button variant="contained" onClick={handleStartConsultation} disabled={startingConsultation}>
                                        {startingConsultation ? 'Guardando...' : 'Guardar diagnóstico'}
                                    </Button>
                                    <Button color="inherit" onClick={() => { setShowConsultationForm(false); setError(''); }}>
                                        Cancelar
                                    </Button>
                                </Box>
                            </Box>
                        )}

                        {/* Paso 3: consulta guardada, se abre la receta */}
                        {activeConsultationId && (
                            <Box>
                                {consultationSuccess && <Alert severity="success" sx={{ mb: 2 }}>{consultationSuccess}</Alert>}

                                <NewTreatmentForm
                                    consultationId={activeConsultationId}
                                    onTreatmentAdded={() => {
                                        setConsultationSuccess('¡Tratamiento asignado! El paciente ya tiene sus recordatorios.');
                                        setTreatmentsVersion((v) => v + 1);
                                    }}
                                />

                                <Button variant="outlined" color="inherit" sx={{ mt: 2 }} onClick={resetConsultation}>
                                    Finalizar consulta
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

export default DoctorSearch;