import { useContext, useState } from 'react';
import {
    AppBar, Box, Toolbar, Typography, Container, Menu, MenuItem, Divider,
    Avatar, Button, ButtonBase, ListItemIcon,
} from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Brand from './Brand';
import NotificationBell from './NotificationBell';
import { gradient } from '../theme';

const initials = (name = '') =>
    name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

const Layout = ({ children }) => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [anchorEl, setAnchorEl] = useState(null);

    const go = (path) => {
        setAnchorEl(null);
        navigate(path);
    };

    const handleLogout = () => {
        setAnchorEl(null);
        logout();
        navigate('/login');
    };

    const isDoctor = user?.role === 'Doctor';

    const menuItems = [
        <MenuItem key="datos" onClick={() => go('/complete-profile')}>
            <ListItemIcon><PersonOutlineIcon fontSize="small" /></ListItemIcon>
            {isDoctor ? 'Datos profesionales' : 'Datos personales'}
        </MenuItem>,
    ];
    if (!isDoctor) {
        menuItems.push(
            <MenuItem key="ficha" onClick={() => go('/medical-record')}>
                <ListItemIcon><AssignmentOutlinedIcon fontSize="small" /></ListItemIcon>
                Mi ficha médica
            </MenuItem>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            <Box sx={{ position: 'sticky', top: 0, zIndex: (t) => t.zIndex.appBar }}>
                {/* Barrita de color del logo */}
                <Box sx={{ height: 4, background: gradient }} />

                <AppBar
                    position="static"
                    color="inherit"
                    elevation={0}
                    sx={{ bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'divider' }}
                >
                    <Container maxWidth="lg">
                        <Toolbar disableGutters sx={{ minHeight: 68, gap: 1 }}>
                            <Brand
                                size={40}
                                subtitle={isDoctor ? 'Portal médico' : 'Portal del paciente'}
                                onClick={() => navigate('/dashboard')}
                            />

                            <Box sx={{ flexGrow: 1 }} />

                            {user && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 } }}>

                                    {/* <Button
                                        color="inherit"
                                        onClick={() => go('/dashboard')}
                                        sx={{
                                            display: { xs: 'none', sm: 'inline-flex' },
                                            textTransform: 'none',
                                            letterSpacing: 0,
                                            fontSize: '0.95rem',
                                            color: pathname === '/dashboard' ? 'primary.main' : 'text.secondary',
                                        }}
                                    >
                                        Inicio
                                    </Button> */}

                                    {user.role === 'Paciente' && <NotificationBell />}

                                    <ButtonBase
                                        onClick={(e) => setAnchorEl(e.currentTarget)}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.25,
                                            pl: 0.75,
                                            pr: { xs: 0.75, sm: 1.5 },
                                            py: 0.75,
                                            borderRadius: 3,
                                            '&:hover': { bgcolor: 'primary.light' },
                                        }}
                                    >
                                        <Avatar
                                            variant="rounded"
                                            sx={{
                                                width: 34,
                                                height: 34,
                                                bgcolor: 'primary.light',
                                                color: 'primary.main',
                                                fontWeight: 700,
                                                fontSize: '0.85rem',
                                                borderRadius: 2,
                                            }}
                                        >
                                            {initials(user.username)}
                                        </Avatar>
                                        <Typography sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 600, fontSize: '0.9rem' }}>
                                            {user.username}
                                        </Typography>
                                        <KeyboardArrowDownRoundedIcon
                                            fontSize="small"
                                            sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.secondary' }}
                                        />
                                    </ButtonBase>

                                    <Menu
                                        anchorEl={anchorEl}
                                        open={Boolean(anchorEl)}
                                        onClose={() => setAnchorEl(null)}
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                        slotProps={{ paper: { sx: { mt: 1, minWidth: 220, borderRadius: 3 } } }}
                                    >
                                        <Box sx={{ px: 2, py: 1 }}>
                                            <Typography variant="body2" fontWeight={700}>{user.username}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {isDoctor ? 'Médico/a' : 'Paciente'}
                                            </Typography>
                                        </Box>
                                        <Divider />
                                        {menuItems}
                                        <Divider />
                                        <MenuItem onClick={handleLogout} sx={{ color: 'error.main', fontWeight: 600 }}>
                                            <ListItemIcon><LogoutRoundedIcon fontSize="small" color="error" /></ListItemIcon>
                                            Cerrar sesión
                                        </MenuItem>
                                    </Menu>
                                </Box>
                            )}
                        </Toolbar>
                    </Container>
                </AppBar>
            </Box>

            <Container component="main" maxWidth="lg" sx={{ flexGrow: 1, py: { xs: 3, md: 5 }, display: 'flex', flexDirection: 'column' }}>
                {children}
            </Container>
        </Box>
    );
};

export default Layout;
