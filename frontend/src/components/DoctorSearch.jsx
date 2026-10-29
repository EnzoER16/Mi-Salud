import { useState, useEffect } from 'react';
import { 
    Box, Typography, Button, TextField, Paper, Alert, Avatar, 
    InputAdornment, Autocomplete, Divider, Select, MenuItem, IconButton 
} from '@mui/material';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import QrCodeScannerOutlinedIcon from '@mui/icons-material/QrCodeScannerOutlined';
import BloodtypeOutlinedIcon from '@mui/icons-material/BloodtypeOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { Scanner } from '@yudiel/react-qr-scanner';
import { getPatientByDni, getPatientByQr, createConsultation, getMedications } from '../services/api';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import TreatmentManager from './TreatmentManager';
import PatientClinicalAnalysis from './PatientClinicalAnalysis';
import PatientExtraInfo from './PatientExtraInfo'; // <-- ACÁ ESTÁ LA IMPORTACIÓN QUE FALTABA
import IconBadge from './IconBadge';
import { colors, cardSx } from '../theme';

const initials = (name = '') =>
    name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'P';

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

const emptyTreatment = { medication: '', doseAmount: '', doseUnit: 'mg', frequency: '', duration: '' };

const DoctorSearch = ({ onConsultationCreated, onPatientChange }) => {
    const [dniInput, setDniInput] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [patientData, setPatientData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Estados para la consulta
    const [showConsultationForm, setShowConsultationForm] = useState(false);
    const [location, setLocation] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [startingConsultation, setStartingConsultation] = useState(false);
    const [consultationSuccess, setConsultationSuccess] = useState('');
    const [treatmentsVersion, setTreatmentsVersion] = useState(0);
    const [analysisOpen, setAnalysisOpen] = useState(false);

    // Estado como array para múltiples tratamientos
    const [treatments, setTreatments] = useState([{ ...emptyTreatment }]);
    const [catalog, setCatalog] = useState([]);

    useEffect(() => {
        getMedications().then(data => {
            if(Array.isArray(data)) setCatalog(data);
        }).catch(() => console.log('Error cargando catálogo'));
    }, []);

    const resetConsultation = () => {
        setShowConsultationForm(false);
        setLocation('');
        setDiagnosis('');
        setTreatments([{ ...emptyTreatment }]);
    };

    const handleSearch = async (searchValue, isQr = false) => {
        if (!searchValue) return;

        setLoading(true);
        setError('');
        setPatientData(null);
        onPatientChange?.(false);
        setIsScanning(false);
        resetConsultation();
        setConsultationSuccess('');
        setAnalysisOpen(false);
        try {
            const data = isQr 
                ? await getPatientByQr(searchValue) 
                : await getPatientByDni(searchValue);

            if (!data) {
                setError(isQr ? 'Código QR inválido.' : 'No se encontró ningún paciente con ese DNI.');
            } else {
                setPatientData(data);
                onPatientChange?.(true);
            }
        } catch (err) {
            setError(err.message || 'Paciente no encontrado o sin ficha médica.');
        } finally {
            setLoading(false);
            setDniInput('');
        }
    };

    const handleTreatmentChange = (index, field, value) => {
        const newTreatments = [...treatments];
        newTreatments[index][field] = value;
        setTreatments(newTreatments);
    };

    const addTreatmentForm = () => {
        setTreatments([...treatments, { ...emptyTreatment }]);
    };

    const removeTreatmentForm = (index) => {
        const newTreatments = treatments.filter((_, i) => i !== index);
        setTreatments(newTreatments);
    };

    const handleStartConsultation = async (e) => {
        e.preventDefault();

        // Filtramos los tratamientos que tienen al menos un campo lleno
        const activeTreatments = treatments.filter(t => 
            t.medication || t.doseAmount || t.frequency || t.duration
        );

        // Validación
        for (const t of activeTreatments) {
            if (!t.medication || !t.doseAmount || !t.frequency || !t.duration) {
                return setError('Por favor, completá todos los campos de cada medicamento recetado.');
            }
            if (Number(t.doseAmount) <= 0 || Number(t.frequency) <= 0 || Number(t.duration) <= 0) {
                return setError('La dosis, frecuencia y duración deben ser mayores a 0.');
            }
        }

        setStartingConsultation(true);
        setError('');

        try {
            // 1. Crear Consulta
            const data = await createConsultation(patientData.id_patient, { location, diagnosis });
            const newConsultationId = data.consultation.id_consultation;

            // 2. Crear Tratamientos en paralelo (si hay)
            if (activeTreatments.length > 0) {
                const token = localStorage.getItem('token');
                
                // Mapeamos los tratamientos a peticiones fetch
                const treatmentPromises = activeTreatments.map(t => 
                    fetch(`http://localhost:5000/api/treatment/${newConsultationId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            medication: t.medication.trim(),
                            dose: `${t.doseAmount}${t.doseUnit}`,
                            frequency_hours: parseInt(t.frequency),
                            duration_days: parseInt(t.duration)
                        })
                    }).then(async (res) => {
                        if (!res.ok) {
                            const errData = await res.json();
                            throw new Error(errData.message || `Error al guardar ${t.medication}`);
                        }
                        return res.json();
                    })
                );

                // Esperamos a que todas las peticiones terminen
                await Promise.all(treatmentPromises);
            }

            setConsultationSuccess(
                activeTreatments.length > 0
                    ? `Consulta guardada y ${activeTreatments.length} medicamento(s) recetado(s) exitosamente.` 
                    : 'Consulta médica registrada exitosamente.'
            );
            
            if (onConsultationCreated) onConsultationCreated();
            setTreatmentsVersion((v) => v + 1);
            resetConsultation();

            setTreatmentsVersion(v => v + 1);
        } catch (err) {
            setError(err.message || 'Error al procesar la solicitud');
        } finally {
            setStartingConsultation(false);
        }
    };

    const record = patientData?.medical_record;
    const allergies = record?.allergies?.trim();
    const hasAllergies = Boolean(allergies) && !/^(ninguna|no|-)$/i.test(allergies);

    return (
        <Box>
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
                    onSubmit={(e) => { e.preventDefault(); handleSearch(dniInput, false); }}
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
                    <Button type="submit" variant="contained" startIcon={<SearchRoundedIcon />} disabled={loading || !dniInput} sx={{ py: 1.7 }}>
                        Buscar
                    </Button>
                    <Typography variant="body2" color="text.secondary">o</Typography>
                    <Button variant="outlined" startIcon={isScanning ? <CloseRoundedIcon /> : <QrCodeScannerOutlinedIcon />} onClick={() => setIsScanning((v) => !v)} sx={{ py: 1.7 }}>
                        {isScanning ? 'Cancelar escáner' : 'Escanear QR'}
                    </Button>
                </Box>

                {isScanning && (
                    <Box sx={{ maxWidth: 320, mx: 'auto', mt: 3, borderRadius: 3, overflow: 'hidden', border: '2px solid', borderColor: 'primary.main' }}>
                        <Scanner
                            onScan={(result) => {
                                if (result && result.length > 0) handleSearch(result[0].rawValue, true);
                            }}
                            paused={loading}
                        />
                    </Box>
                )}
                {error && !showConsultationForm && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </Paper>

            {patientData && (
                <Paper elevation={0} sx={{ ...cardSx, mt: 3, overflow: 'hidden' }}>
                    <Box
                        sx={{
                            p: { xs: 2.5, sm: 3 },
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
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
                                {patientData.health_insurance ? ` · ${patientData.health_insurance}${patientData.plan ? ` ${patientData.plan}` : ''}` : ''}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'flex-end' }, width: { xs: '100%', md: 'auto' } }}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<QueryStatsOutlinedIcon />}
                                onClick={() => setAnalysisOpen((value) => !value)}
                                aria-expanded={analysisOpen}
                                sx={{ bgcolor: '#fff', textTransform: 'none', fontWeight: 700 }}
                            >
                                {analysisOpen ? 'Ocultar análisis clínico' : 'Analizar historial clínico'}
                            </Button>
                            <Button
                                size="small"
                                color="inherit"
                                onClick={() => { setPatientData(null); onPatientChange?.(false); resetConsultation(); setAnalysisOpen(false); setConsultationSuccess(''); }}
                                sx={{ letterSpacing: 0, textTransform: 'none', color: 'text.secondary' }}
                            >
                                Cerrar ficha
                            </Button>
                        </Box>
                    </Box>

                    {/* Datos personales y clínicos: una sección visual propia. */}
                    <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>Ficha médica</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
                            <InfoTile icon={<BloodtypeOutlinedIcon fontSize="small" />} label="Grupo sanguíneo" value={record?.blood_group || 'No especificado'} />
                            <InfoTile icon={<WarningAmberRoundedIcon fontSize="small" />} label="Alergias" value={hasAllergies ? allergies : 'Ninguna'} warn={hasAllergies} />
                            <InfoTile icon={<AssignmentOutlinedIcon fontSize="small" />} label="Antecedentes" value={record?.antecedents || 'Ninguno'} />
                        </Box>
                        
                        {/* ACÁ LLAMAMOS AL COMPONENTE QUE MUESTRA TODO EL RESTO DE LA INFO DEL PACIENTE */}
                        <PatientExtraInfo patientData={patientData} />
                    </Box>

                    {/* Mantener el mismo administrador de tratamientos, pero separado de la ficha. */}
                    <Box sx={{ px: { xs: 2.5, sm: 3.5 }, py: { xs: 3, sm: 4 }, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#FBFDFE' }}>
                        <TreatmentManager patientId={patientData.id_patient} refreshKey={treatmentsVersion} />
                    </Box>

                    {/* Acciones de atención: no alteramos su funcionamiento. */}
                    <Box sx={{ px: { xs: 2.5, sm: 3.5 }, py: { xs: 3, sm: 4 }, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>Atención médica</Typography>
                        {consultationSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setConsultationSuccess('')}>{consultationSuccess}</Alert>}
                        {/* Paso 1: botón para iniciar la consulta */}
                        {!showConsultationForm && (
                            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => { setShowConsultationForm(true); setConsultationSuccess(''); }}>
                                Registrar nueva consulta
                            </Button>
                        )}

                        {showConsultationForm && (
                            <Box component="form" onSubmit={handleStartConsultation} sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#F4F9FD', borderRadius: 3, border: '1px solid', borderColor: 'divider', mt: 2 }}>
                                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                                
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    1. Detalles de la atención
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 2, mb: 3 }}>
                                    <TextField fullWidth label="Lugar de atención" placeholder="Ej: Consultorio 3, Guardia" required value={location} onChange={(e) => setLocation(e.target.value)} />
                                    <TextField fullWidth label="Diagnóstico clínico" placeholder="Ej: Faringitis aguda. Se receta antibiótico." required multiline minRows={2} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
                                </Box>

                                <Divider sx={{ my: 3 }} />

                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    2. Recetar tratamiento (Opcional)
                                </Typography>
                                
                                {treatments.map((treatment, index) => (
                                    <Box key={index} sx={{ position: 'relative', display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.5fr 1fr 1fr 1fr' }, gap: 2, p: 2, mb: 2, bgcolor: '#fff', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                                        {treatments.length > 1 && (
                                            <IconButton 
                                                size="small" 
                                                onClick={() => removeTreatmentForm(index)} 
                                                sx={{ position: 'absolute', top: -12, right: -12, bgcolor: '#fff', border: '1px solid', borderColor: 'divider', color: 'error.main', '&:hover': { bgcolor: '#FEECEB' } }}
                                            >
                                                <DeleteOutlineRoundedIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                        <Autocomplete
                                            freeSolo
                                            options={catalog}
                                            groupBy={(option) => option.category}
                                            getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
                                            inputValue={treatment.medication}
                                            onInputChange={(e, value) => handleTreatmentChange(index, 'medication', value)}
                                            renderInput={(params) => <TextField {...params} label={`Medicamento ${index + 1}`} placeholder="Escribí o elegí" />}
                                        />
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <TextField 
                                                fullWidth label="Dosis" type="number" placeholder="Ej: 600" 
                                                value={treatment.doseAmount} onChange={(e) => handleTreatmentChange(index, 'doseAmount', e.target.value)}
                                                slotProps={{ htmlInput: { min: 0.1, step: "any" } }}
                                            />
                                            <TextField select value={treatment.doseUnit} onChange={(e) => handleTreatmentChange(index, 'doseUnit', e.target.value)} sx={{ minWidth: 80 }}>
                                                <MenuItem value="mg">mg</MenuItem>
                                                <MenuItem value="g">g</MenuItem>
                                            </TextField>
                                        </Box>
                                        <TextField fullWidth label="Cada (horas)" type="number" value={treatment.frequency} onChange={(e) => handleTreatmentChange(index, 'frequency', e.target.value)} slotProps={{ htmlInput: { min: 1 } }} placeholder="Ej: 8" />
                                        <TextField fullWidth label="Duración (días)" type="number" value={treatment.duration} onChange={(e) => handleTreatmentChange(index, 'duration', e.target.value)} slotProps={{ htmlInput: { min: 1 } }} placeholder="Ej: 7" />
                                    </Box>
                                ))}

                                <Button size="small" variant="text" startIcon={<AddRoundedIcon />} onClick={addTreatmentForm} sx={{ mt: 1, fontWeight: 700 }}>
                                    Añadir otro medicamento
                                </Button>

                                <Box sx={{ mt: 4, display: 'flex', gap: 1.5 }}>
                                    <Button type="submit" variant="contained" disabled={startingConsultation}>
                                        {startingConsultation ? 'Guardando...' : 'Guardar consulta y recetas'}
                                    </Button>
                                    <Button color="inherit" onClick={() => { resetConsultation(); setError(''); }}>
                                        Cancelar
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Box>

                    {analysisOpen && (
                        <Box sx={{ px: { xs: 2.5, sm: 3.5 }, py: { xs: 3, sm: 4 }, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#FBFDFE' }}>
                            <PatientClinicalAnalysis patientId={patientData.id_patient} refreshKey={treatmentsVersion} />
                        </Box>
                    )}
                </Paper>
            )}
        </Box>
    );
};

export default DoctorSearch;