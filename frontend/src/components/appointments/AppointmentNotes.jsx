import { useState } from 'react';
import { Box, Typography, Button, IconButton, Tooltip, Alert, TextField } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { addAppointmentNote, updateAppointmentNote, deleteAppointmentNote } from '../../services/api';
import ConfirmDialog from './ConfirmDialog';
import { formatShortDate } from './format';

const MAX_NOTE = 2000;

const AppointmentNotes = ({ appointment, onChanged, onFeedback }) => {
    const [editing, setEditing] = useState(null);   // null | 'new' | la nota que se está editando
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [toDelete, setToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const notes = appointment.notes || [];

    const startNew = () => {
        setEditing('new');
        setTitle('');
        setContent('');
        setError('');
    };

    const startEdit = (note) => {
        setEditing(note);
        setTitle(note.title);
        setContent(note.content);
        setError('');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!content.trim()) return setError('Escribí el contenido de la nota.');

        setSaving(true);
        setError('');
        try {
            const payload = { title, content };
            if (editing === 'new') await addAppointmentNote(appointment.id_appointment, payload);
            else await updateAppointmentNote(editing.id_note, payload);
            setEditing(null);
            onFeedback('Nota guardada.');
            await onChanged();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteAppointmentNote(toDelete.id_note);
            setToDelete(null);
            onFeedback('Nota eliminada.');
            await onChanged();
        } catch (err) {
            setToDelete(null);
            setError(err.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Revisiones y notas</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Anotá lo que querés revisar. No reemplaza las indicaciones médicas.
                    </Typography>
                </Box>
                {!editing && (
                    <Button size="small" startIcon={<AddRoundedIcon />} onClick={startNew} sx={{ textTransform: 'none', letterSpacing: 0 }}>
                        Agregar nota
                    </Button>
                )}
            </Box>

            {error && !editing && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            {editing && (
                <Box
                    component="form"
                    onSubmit={handleSave}
                    sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: '#FAFCFD' }}
                >
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <TextField
                        fullWidth size="small" label="Título" value={title} onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej: Para conversar en la consulta" sx={{ mb: 2 }}
                        slotProps={{ htmlInput: { maxLength: 100 } }}
                    />
                    <TextField
                        fullWidth multiline minRows={3} label="Nota" required value={content}
                        onChange={(e) => setContent(e.target.value)}
                        helperText={`${content.length}/${MAX_NOTE}`}
                        slotProps={{ htmlInput: { maxLength: MAX_NOTE } }}
                    />
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                        <Button type="submit" variant="contained" size="small" disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar nota'}
                        </Button>
                        <Button color="inherit" size="small" onClick={() => setEditing(null)} disabled={saving}>Cancelar</Button>
                    </Box>
                </Box>
            )}

            {notes.length === 0 && !editing ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    Todavía no escribiste notas para este turno.
                </Typography>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {notes.map((note) => (
                        <Box key={note.id_note} sx={{ p: 2, borderRadius: 3, bgcolor: '#F6FAFB', border: '1px solid', borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, flex: 1 }}>{note.title}</Typography>
                                <Tooltip title="Editar">
                                    <IconButton size="small" aria-label={`Editar nota ${note.title}`} onClick={() => startEdit(note)}>
                                        <EditOutlinedIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Eliminar">
                                    <IconButton size="small" aria-label={`Eliminar nota ${note.title}`} onClick={() => setToDelete(note)}>
                                        <DeleteOutlineOutlinedIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                                {note.content}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                Nota tuya · {formatShortDate(note.created_at)}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}

            <ConfirmDialog
                open={Boolean(toDelete)}
                title="¿Eliminar esta nota?"
                message="Esta acción no se puede deshacer."
                loading={deleting}
                onConfirm={handleDelete}
                onClose={() => setToDelete(null)}
            />
        </Box>
    );
};

export default AppointmentNotes;
