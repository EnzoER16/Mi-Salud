import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Box, CircularProgress, Alert, Typography } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { fetchAppointmentFile } from '../../services/api';

// Muestra un PDF o una imagen sin salir de la página.
// El archivo se pide con el token y se muestra desde un blob local (no hay URL pública).
const FilePreviewDialog = ({ file, onClose }) => {
    const [url, setUrl] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!file) return undefined;

        let objectUrl = null;
        let cancelled = false;
        setUrl(null);
        setError('');

        fetchAppointmentFile(file.id_file)
            .then((blob) => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(blob);
                setUrl(objectUrl);
            })
            .catch((err) => { if (!cancelled) setError(err.message); });

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [file]);

    const isPdf = file?.mime_type === 'application/pdf';

    return (
        <Dialog open={Boolean(file)} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1 }}>
                <Typography component="span" noWrap sx={{ flex: 1, fontWeight: 700, fontSize: '1.05rem' }}>
                    {file?.name}
                </Typography>
                <IconButton aria-label="Cerrar" onClick={onClose}><CloseRoundedIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ minHeight: 320, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#F6FAFB' }}>
                {error ? (
                    <Alert severity="error">{error}</Alert>
                ) : !url ? (
                    <CircularProgress />
                ) : isPdf ? (
                    <Box component="iframe" src={url} title={file?.name} sx={{ width: '100%', height: '70vh', border: 0, bgcolor: '#fff' }} />
                ) : (
                    <Box component="img" src={url} alt={file?.name} sx={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 1 }} />
                )}
            </DialogContent>
        </Dialog>
    );
};

export default FilePreviewDialog;
