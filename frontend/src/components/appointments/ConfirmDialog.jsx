import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

// Confirmación genérica para acciones que no se pueden deshacer
const ConfirmDialog = ({ open, title, message, confirmLabel = 'Eliminar', loading = false, onConfirm, onClose }) => (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
            <DialogContentText>{message}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button color="inherit" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button color="error" variant="contained" onClick={onConfirm} disabled={loading}>
                {loading ? 'Eliminando...' : confirmLabel}
            </Button>
        </DialogActions>
    </Dialog>
);

export default ConfirmDialog;
