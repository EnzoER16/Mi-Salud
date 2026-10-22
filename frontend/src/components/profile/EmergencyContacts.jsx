import { useState, useEffect } from 'react';
import {
    Box, Typography, Button, IconButton, Tooltip, Chip, Alert, CircularProgress, Link,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete, Stack,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import ContactPhoneOutlinedIcon from '@mui/icons-material/ContactPhoneOutlined';
import {
    getEmergencyContacts, addEmergencyContact, updateEmergencyContact, deleteEmergencyContact,
} from '../../services/api';
import ConfirmDialog from '../appointments/ConfirmDialog';
import FormSection from './FormSection';
import { RELATIONSHIPS } from './format';

const MAX_CONTACTS = 5;
const EMPTY = { name: '', relationship: '', phone: '' };

const ContactDialog = ({ open, contact, onClose, onSaved }) => {
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setError('');
        setForm(contact ? { name: contact.name, relationship: contact.relationship || '', phone: contact.phone } : EMPTY);
    }, [open, contact]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            const payload = { name: form.name, relationship: form.relationship, phone: form.phone };
            const saved = contact
                ? await updateEmergencyContact(contact.id_contact, payload)
                : await addEmergencyContact(payload);
            onSaved(saved, Boolean(contact));
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>{contact ? 'Editar contacto' : 'Nuevo contacto de emergencia'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        <TextField
                            label="Nombre y apellido" required autoFocus value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            slotProps={{ htmlInput: { maxLength: 80 } }}
                        />
                        <Autocomplete
                            freeSolo options={RELATIONSHIPS} inputValue={form.relationship}
                            onInputChange={(_, value) => setForm((prev) => ({ ...prev, relationship: value }))}
                            renderInput={(params) => <TextField {...params} label="Parentesco" placeholder="Ej: Madre, Pareja, Amigo/a" />}
                        />
                        <TextField
                            label="Teléfono" required value={form.phone} type="tel"
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            slotProps={{ htmlInput: { maxLength: 25, inputMode: 'tel' } }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button color="inherit" onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

// "En caso de emergencia llamar a...": hasta 5 personas. `disabled` = todavía no hay perfil básico guardado.
const EmergencyContacts = ({ disabled = false, onFeedback }) => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(!disabled);
    const [error, setError] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [toDelete, setToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (disabled) { setLoading(false); return; }
        let cancelled = false;
        getEmergencyContacts()
            .then((list) => { if (!cancelled) setContacts(list); })
            .catch((err) => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [disabled]);

    const openNew = () => { setEditing(null); setDialogOpen(true); };
    const openEdit = (contact) => { setEditing(contact); setDialogOpen(true); };

    const handleSaved = (saved, wasEdit) => {
        setContacts((prev) => (wasEdit ? prev.map((c) => (c.id_contact === saved.id_contact ? saved : c)) : [...prev, saved]));
        setDialogOpen(false);
        onFeedback?.(wasEdit ? 'Contacto actualizado.' : 'Contacto agregado.');
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteEmergencyContact(toDelete.id_contact);
            setContacts((prev) => prev.filter((c) => c.id_contact !== toDelete.id_contact));
            setToDelete(null);
            onFeedback?.('Contacto eliminado.');
        } catch (err) {
            setError(err.message);
            setToDelete(null);
        } finally {
            setDeleting(false);
        }
    };

    const full = contacts.length >= MAX_CONTACTS;

    return (
        <FormSection
            icon={<ContactPhoneOutlinedIcon />}
            tone="amber"
            title="Contactos de emergencia"
            description="A quién llamar si te pasa algo. Lo ven los médicos que te atienden."
            columns={1}
            action={
                <Button
                    size="small" variant="outlined" startIcon={<AddRoundedIcon />} onClick={openNew}
                    disabled={disabled || full} sx={{ textTransform: 'none', letterSpacing: 0, whiteSpace: 'nowrap' }}
                >
                    Agregar
                </Button>
            }
        >
            {disabled && <Alert severity="info">Primero guardá tus datos personales para poder cargar contactos de emergencia.</Alert>}
            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
            {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box>}

            {!loading && !disabled && contacts.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                    Todavía no cargaste ningún contacto. Te recomendamos agregar al menos uno.
                </Typography>
            )}

            {contacts.map((contact) => (
                <Box
                    key={contact.id_contact}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5, bgcolor: '#FAFCFD' }}
                >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography sx={{ fontWeight: 700 }} noWrap>{contact.name}</Typography>
                            {contact.relationship && <Chip size="small" label={contact.relationship} sx={{ bgcolor: 'primary.light', color: 'primary.main' }} />}
                        </Box>
                        <Link href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.9rem' }}>
                            <PhoneOutlinedIcon sx={{ fontSize: 16 }} /> {contact.phone}
                        </Link>
                    </Box>
                    <Tooltip title="Editar">
                        <IconButton size="small" aria-label={`Editar contacto ${contact.name}`} onClick={() => openEdit(contact)}>
                            <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                        <IconButton size="small" aria-label={`Eliminar contacto ${contact.name}`} onClick={() => setToDelete(contact)}>
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ))}

            {full && <Typography variant="caption" color="text.secondary">Llegaste al máximo de {MAX_CONTACTS} contactos.</Typography>}

            <ContactDialog open={dialogOpen} contact={editing} onClose={() => setDialogOpen(false)} onSaved={handleSaved} />
            <ConfirmDialog
                open={Boolean(toDelete)} title="Eliminar contacto" loading={deleting}
                message={toDelete ? `Se va a eliminar a "${toDelete.name}" de tus contactos de emergencia.` : ''}
                onConfirm={handleDelete} onClose={() => setToDelete(null)}
            />
        </FormSection>
    );
};

export default EmergencyContacts;
