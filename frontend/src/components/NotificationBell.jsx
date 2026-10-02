import { useState, useEffect, useCallback } from 'react';
import { IconButton, Badge, Popover, Box, Typography, List, ListItemButton, ListItemText, Button, Divider } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';

const POLL_MS = 30000; // consulta al backend cada 30 segundos

const NotificationBell = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unread, setUnread] = useState(0);

    const load = useCallback(async () => {
        try {
            const data = await getNotifications();
            if (data) {
                setNotifications(data.notifications);
                setUnread(data.unread_count);
            }
        } catch (err) {
            console.error('Error al cargar notificaciones:', err);
        }
    }, []);

    useEffect(() => {
        load();
        const interval = setInterval(load, POLL_MS);
        return () => clearInterval(interval); // limpiamos al desmontar
    }, [load]);

    const handleOpen = (e) => {
        setAnchorEl(e.currentTarget);
        load(); // al abrir, refrescamos para ver lo último
    };

    const handleClickNotification = async (n) => {
        if (n.is_read) return;
        await markNotificationRead(n.id_notification);
        load();
    };

    const handleMarkAll = async () => {
        await markAllNotificationsRead();
        load();
    };

    // Guardamos en UTC sin zona: agregamos 'Z' para mostrar en hora local
    const formatDate = (iso) => new Date(iso.endsWith('Z') ? iso : iso + 'Z').toLocaleString();

    return (
        <>
            <IconButton color="inherit" onClick={handleOpen}>
                <Badge badgeContent={unread} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Box sx={{ width: 340, maxWidth: '90vw' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">Notificaciones</Typography>
                        {unread > 0 && (
                            <Button size="small" onClick={handleMarkAll}>Marcar todas</Button>
                        )}
                    </Box>
                    <Divider />

                    {notifications.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                            No tenés notificaciones.
                        </Typography>
                    ) : (
                        <List disablePadding sx={{ maxHeight: 360, overflowY: 'auto' }}>
                            {notifications.map((n) => (
                                <ListItemButton
                                    key={n.id_notification}
                                    onClick={() => handleClickNotification(n)}
                                    sx={{ backgroundColor: n.is_read ? 'transparent' : '#e0f2f1', alignItems: 'flex-start' }}
                                >
                                    <ListItemText
                                        primary={n.message}
                                        primaryTypographyProps={{ fontWeight: n.is_read ? 'normal' : 'bold', variant: 'body2' }}
                                        secondary={
                                            <>
                                                {n.details && <Box component="span" sx={{ display: 'block' }}>{n.details}</Box>}
                                                <Box component="span" sx={{ display: 'block', mt: 0.5 }}>{formatDate(n.created_at)}</Box>
                                            </>
                                        }
                                    />
                                </ListItemButton>
                            ))}
                        </List>
                    )}
                </Box>
            </Popover>
        </>
    );
};

export default NotificationBell;