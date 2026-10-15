import { useState, useEffect, useCallback } from 'react';
import { IconButton, Badge, Popover, Box, Typography, List, ListItemButton, ListItemText, Button, Divider } from '@mui/material';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
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
        return () => clearInterval(interval);
    }, [load]);

    const handleOpen = (e) => {
        setAnchorEl(e.currentTarget);
        load();
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

    // El backend guarda en UTC sin zona: agregamos 'Z' para mostrar en hora local
    const formatDate = (iso) => new Date(iso.endsWith('Z') ? iso : iso + 'Z').toLocaleString();

    return (
        <>
            <IconButton
                onClick={handleOpen}
                sx={{ color: 'text.secondary', '&:hover': { bgcolor: 'primary.light', color: 'primary.main' } }}
            >
                <Badge badgeContent={unread} color="error">
                    <NotificationsNoneOutlinedIcon />
                </Badge>
            </IconButton>

            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { sx: { mt: 1, borderRadius: 3 } } }}
            >
                <Box sx={{ width: 360, maxWidth: '90vw' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.25 }}>
                        <Typography variant="subtitle1" fontWeight="bold">Notificaciones</Typography>
                        {unread > 0 && (
                            <Button size="small" onClick={handleMarkAll} sx={{ letterSpacing: 0, textTransform: 'none' }}>
                                Marcar todas
                            </Button>
                        )}
                    </Box>
                    <Divider />

                    {notifications.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
                            No tenés notificaciones.
                        </Typography>
                    ) : (
                        <List disablePadding sx={{ maxHeight: 380, overflowY: 'auto' }}>
                            {notifications.map((n) => (
                                <ListItemButton
                                    key={n.id_notification}
                                    onClick={() => handleClickNotification(n)}
                                    sx={{
                                        bgcolor: n.is_read ? 'transparent' : 'primary.light',
                                        alignItems: 'flex-start',
                                        borderBottom: '1px solid',
                                        borderColor: 'divider',
                                    }}
                                >
                                    <ListItemText
                                        primary={n.message}
                                        slotProps={{
                                            primary: { variant: 'body2', sx: { fontWeight: n.is_read ? 500 : 700 } },
                                            secondary: { component: 'div' },
                                        }}
                                        secondary={
                                            <>
                                                {n.details && <Box component="span" sx={{ display: 'block' }}>{n.details}</Box>}
                                                <Box component="span" sx={{ display: 'block', mt: 0.5, fontSize: '0.75rem' }}>
                                                    {formatDate(n.created_at)}
                                                </Box>
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
