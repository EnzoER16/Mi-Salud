import { useState, useEffect } from 'react';
import { 
    Box, Typography, Button, TextField, Paper, Alert, Avatar, 
    InputAdornment, Autocomplete, Divider, Select, MenuItem 
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
import { Scanner } from '@yudiel/react-qr-scanner';
import { getPatientByDni, getPatientByQr, createConsultation, getMedications } from '../services/api';
import TreatmentManager from './TreatmentManager';
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

const DoctorSearch = ({ onConsultationCreated }) => {
    const [dniInput, setDniInput] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [patientData, setPatientData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Estados para el formulario unificado
    const [showConsultationForm, setShowConsultationForm] = useState(false);
    const [location, setLocation] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [startingConsultation, setStartingConsultation] = useState(false);
    const [consultationSuccess, setConsultationSuccess] = useState('');
    const [treatmentsVersion, setTreatmentsVersion] = useState(0);

    // Estados para el tratamiento
    const [medication, setMedication] = useState('');
    const [doseAmount, setDoseAmount] = useState('');
    const [doseUnit, setDoseUnit] = useState('mg');
    const [frequency, setFrequency] = useState('');
    const [duration, setDuration] = useState('');
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
        setMedication('');
        setDoseAmount('');
        setDoseUnit('mg');
        setFrequency('');
        setDuration('');
    };

    const handleSearch = async (searchValue, isQr = false) => {
        if (!searchValue) return;

        setLoading(true);
        setError('');
        setPatientData(null);
        setIsScanning(false);
        resetConsultation();
        setConsultationSuccess('');

        try {
            // Si escaneamos, llamamos al endpoint del QR. Si tipeamos, al del DNI.
            const data = isQr 
                ? await getPatientByQr(searchValue) 
                : await getPatientByDni(searchValue);

            if (!data) {
                setError(isQr ? 'Código QR inválido.' : 'No se encontró ningún paciente con ese DNI.');
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

    const handleStartConsultation = async (e) => {
        e.preventDefault();

        if (medication || doseAmount || frequency || duration) {
            if (!medication || !doseAmount || !frequency || !duration) {
                return setError('Para recetar un tratamiento, completá todos sus campos (medicamento, dosis, frecuencia y duración).');
            }
            if (Number(doseAmount) <= 0 || Number(frequency) <= 0 || Number(duration) <= 0) {
                return setError('La dosis, frecuencia y duración deben ser mayores a 0.');
            }
        }

        setStartingConsultation(true);
        setError('');

        try {
            const data = await createConsultation(patientData.id_patient, { location, diagnosis });
            const newConsultationId = data.consultation.id_consultation;

            if (medication) {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5000/api/treatment/${newConsultationId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        medication: medication.trim(),
                        dose: `${doseAmount}${doseUnit}`,
                        frequency_hours: parseInt(frequency),
                        duration_days: parseInt(duration)
                    })
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || 'Error al guardar el tratamiento');
                }
            }

            setConsultationSuccess(
                medication 
                    ? 'Consulta y tratamiento registrados exitosamente.' 
                    : 'Consulta médica registrada exitosamente.'
            );
            
            if (onConsultationCreated) onConsultationCreated();
            setTreatmentsVersion((v) => v + 1);
            resetConsultation();

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
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </Paper>

            {patientData && (
                <Paper elevation={0} sx={{ ...cardSx, mt: 3, overflow: 'hidden' }}>
                    <Box sx={{ p: { xs: 2.5, sm: 3 }, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid', borderColor: 'divider', background: 'linear-gradient(90deg, #F1F7FD 0%, #F0FAF7 100%)' }}>
                        <Avatar sx={{ width: 52, height: 52, bgcolor: '#fff', color: colors.teal, fontWeight: 700, border: '1px solid', borderColor: 'divider' }}>
                            {initials(patientData.name)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="h6" noWrap>{patientData.name || 'Paciente'}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                DNI {patientData.dni}
                                {patientData.health_insurance ? ` · ${patientData.health_insurance}${patientData.plan ? ` ${patientData.plan}` : ''}` : ''}
                            </Typography>
                        </Box>
                        <Button size="small" color="inherit" onClick={() => { setPatientData(null); resetConsultation(); setConsultationSuccess(''); }} sx={{ letterSpacing: 0, textTransform: 'none', color: 'text.secondary' }}>
                            Cerrar ficha
                        </Button>
                    </Box>

                    <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Ficha médica</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
                            <InfoTile icon={<BloodtypeOutlinedIcon fontSize="small" />} label="Grupo sanguíneo" value={record?.blood_group || 'No especificado'} />
                            <InfoTile icon={<WarningAmberRoundedIcon fontSize="small" />} label="Alergias" value={hasAllergies ? allergies : 'Ninguna'} warn={hasAllergies} />
                            <InfoTile icon={<AssignmentOutlinedIcon fontSize="small" />} label="Antecedentes" value={record?.antecedents || 'Ninguno'} />
                        </Box>

                        <TreatmentManager patientId={patientData.id_patient} refreshKey={treatmentsVersion} />

                        {consultationSuccess && <Alert severity="success" sx={{ mt: 2, mb: 2 }} onClose={() => setConsultationSuccess('')}>{consultationSuccess}</Alert>}

                        {!showConsultationForm && (
                            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => { setShowConsultationForm(true); setConsultationSuccess(''); }}>
                                Registrar nueva consulta
                            </Button>
                        )}

                        {showConsultationForm && (
                            <Box component="form" onSubmit={handleStartConsultation} sx={{ p: 3, bgcolor: '#F4F9FD', borderRadius: 3, border: '1px solid', borderColor: 'divider', mt: 2 }}>
                                
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
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                    <Autocomplete
                                        freeSolo
                                        options={catalog}
                                        groupBy={(option) => option.category}
                                        getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
                                        inputValue={medication}
                                        onInputChange={(e, value) => setMedication(value)}
                                        renderInput={(params) => <TextField {...params} label="Medicamento" placeholder="Escribí o elegí de la lista" />}
                                    />
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <TextField 
                                            fullWidth 
                                            label="Dosis" 
                                            type="number" 
                                            placeholder="Ej: 600" 
                                            value={doseAmount} 
                                            onChange={(e) => setDoseAmount(e.target.value)}
                                            slotProps={{ htmlInput: { min: 0.1, step: "any" } }}
                                        />
                                        <TextField 
                                            select 
                                            value={doseUnit} 
                                            onChange={(e) => setDoseUnit(e.target.value)}
                                            sx={{ minWidth: 80 }}
                                        >
                                            <MenuItem value="mg">mg</MenuItem>
                                            <MenuItem value="g">g</MenuItem>
                                        </TextField>
                                    </Box>
                                    <TextField fullWidth label="Frecuencia (horas)" type="number" value={frequency} onChange={(e) => setFrequency(e.target.value)} slotProps={{ htmlInput: { min: 1 } }} placeholder="Ej: 8" />
                                    <TextField fullWidth label="Duración (días)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} slotProps={{ htmlInput: { min: 1 } }} placeholder="Ej: 7" />
                                </Box>

                                <Box sx={{ mt: 3.5, display: 'flex', gap: 1.5 }}>
                                    <Button type="submit" variant="contained" disabled={startingConsultation}>
                                        {startingConsultation ? 'Guardando...' : 'Guardar y finalizar'}
                                    </Button>
                                    <Button color="inherit" onClick={() => { resetConsultation(); setError(''); }}>
                                        Cancelar
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

export default DoctorSearch;