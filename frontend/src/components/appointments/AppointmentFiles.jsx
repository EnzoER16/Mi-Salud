import { useRef, useState } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, Alert, LinearProgress } from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { uploadAppointmentFile, fetchAppointmentFile, deleteAppointmentFile } from '../../services/api';
import { colors } from '../../theme';
import IconBadge from '../IconBadge';
import ConfirmDialog from './ConfirmDialog';
import { ACCEPT_ATTR, MAX_FILE_MB, validateFile, formatSize, fileKind, formatShortDate } from './format';

const AppointmentFiles = ({ appointment, onChanged, onFeedback, onPreview }) => {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(null);   // { done, total } mientras sube
    const [problems, setProblems] = useState([]);       // archivos que no se pudieron subir
    const [actionError, setActionError] = useState('');
    const [toDelete, setToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const files = appointment.files || [];

    const handleFiles = async (fileList) => {
        const selected = Array.from(fileList || []);
        if (selected.length === 0 || uploading) return;

        setActionError('');
        const failed = [];
        const valid = [];
        selected.forEach((file) => {
            const message = validateFile(file);
            if (message) failed.push({ name: file.name, message });
            else valid.push(file);
        });

        let uploaded = 0;
        let processed = 0;
        setUploading({ done: 0, total: valid.length });
        for (const file of valid) {
            try {
                await uploadAppointmentFile(appointment.id_appointment, file);
                uploaded += 1;
            } catch (err) {
                failed.push({ name: file.name, message: err.message });
            }
            processed += 1;
            setUploading({ done: processed, total: valid.length });
        }
        setUploading(null);
        setProblems(failed);

        if (uploaded > 0) {
            onFeedback(uploaded === 1 ? 'Archivo subido.' : `${uploaded} archivos subidos.`);
            await onChanged();
        }
    };

    const handleDownload = async (file) => {
        setActionError('');
        try {
            const blob = await fetchAppointmentFile(file.id_file, { download: true });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            setActionError(err.message);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteAppointmentFile(toDelete.id_file);
            setToDelete(null);
            onFeedback('Archivo eliminado.');
            await onChanged();
        } catch (err) {
            setToDelete(null);
            setActionError(err.message);
        } finally {
            setDeleting(false);
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    return (
        <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Archivos y fotos de este turno</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Agregá documentos o fotos que quieras tener a mano o mostrar en la consulta.
            </Typography>

            {/* Zona para arrastrar archivos */}
            <Box
                role="group"
                aria-label="Subir archivos"
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                sx={{
                    border: '2px dashed',
                    borderColor: dragging ? 'primary.main' : '#B9DDE3',
                    bgcolor: dragging ? 'primary.light' : '#F6FBFC',
                    borderRadius: 3,
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    transition: 'all .15s ease',
                }}
            >
                <CloudUploadOutlinedIcon sx={{ color: colors.teal, fontSize: 30 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, mb: 1.5 }}>
                    Arrastrá tus archivos acá o elegilos desde tu equipo
                </Typography>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    hidden
                    aria-label="Elegir archivos"
                    accept={ACCEPT_ATTR}
                    onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
                />
                <Button
                    variant="contained"
                    startIcon={<AddRoundedIcon />}
                    disabled={Boolean(uploading)}
                    onClick={() => inputRef.current?.click()}
                >
                    Subir archivos o fotos
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
                    PDF, JPG o PNG · Hasta {MAX_FILE_MB} MB por archivo
                </Typography>

                {uploading && (
                    <Box sx={{ mt: 2 }} role="status">
                        <LinearProgress
                            variant="determinate"
                            value={uploading.total ? (uploading.done / uploading.total) * 100 : 0}
                            sx={{ height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            Subiendo {Math.min(uploading.done + 1, uploading.total)} de {uploading.total}...
                        </Typography>
                    </Box>
                )}
            </Box>

            {problems.length > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }} onClose={() => setProblems([])}>
                    {problems.length === 1 ? 'No se pudo subir un archivo:' : 'No se pudieron subir estos archivos:'}
                    <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                        {problems.map((p, i) => (
                            <li key={`${p.name}-${i}`}><strong>{p.name}</strong>: {p.message}</li>
                        ))}
                    </Box>
                </Alert>
            )}
            {actionError && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setActionError('')}>{actionError}</Alert>}

            {/* Lista de adjuntos */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 3, mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Adjuntos · {files.length}</Typography>
                <Typography variant="caption" color="text.secondary">Agregados por vos</Typography>
            </Box>

            {files.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    Todavía no agregaste archivos a este turno.
                </Typography>
            ) : (
                <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
                    {files.map((file) => (
                        <Box
                            component="li"
                            key={file.id_file}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, py: 1.5,
                                borderBottom: '1px solid', borderColor: 'divider',
                                '&:last-child': { borderBottom: 0 },
                            }}
                        >
                            <IconBadge tone="blue" size={40}>
                                {file.mime_type === 'application/pdf' ? <DescriptionOutlinedIcon /> : <ImageOutlinedIcon />}
                            </IconBadge>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" noWrap sx={{ fontWeight: 600 }} title={file.name}>{file.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {fileKind(file.mime_type)} · {formatSize(file.size_bytes)} · {formatShortDate(file.created_at)}
                                </Typography>
                            </Box>
                            <Button
                                size="small"
                                startIcon={<VisibilityOutlinedIcon />}
                                onClick={() => onPreview(file)}
                                aria-label={`Ver ${file.name}`}
                                sx={{
                                    textTransform: 'none', letterSpacing: 0, minWidth: 0,
                                    '& .MuiButton-startIcon': { mr: { xs: 0, sm: 0.5 }, ml: 0 },
                                }}
                            >
                                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Ver</Box>
                            </Button>
                            <Tooltip title="Descargar">
                                <IconButton size="small" aria-label={`Descargar ${file.name}`} onClick={() => handleDownload(file)}>
                                    <FileDownloadOutlinedIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                                <IconButton size="small" aria-label={`Eliminar ${file.name}`} onClick={() => setToDelete(file)}>
                                    <DeleteOutlineOutlinedIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    ))}
                </Box>
            )}

            <ConfirmDialog
                open={Boolean(toDelete)}
                title="¿Eliminar este archivo?"
                message={toDelete ? `Se va a eliminar "${toDelete.name}". Esta acción no se puede deshacer.` : ''}
                loading={deleting}
                onConfirm={handleDelete}
                onClose={() => setToDelete(null)}
            />
        </Box>
    );
};

export default AppointmentFiles;
