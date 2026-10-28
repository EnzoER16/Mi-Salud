import { useId, useState } from 'react';
import { Paper, Box, Typography, Button, Collapse, ButtonBase, Divider } from '@mui/material';
import LocalPhoneRoundedIcon from '@mui/icons-material/LocalPhoneRounded';
import EmergencyOutlinedIcon from '@mui/icons-material/EmergencyOutlined';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import IconBadge from './IconBadge';
import { cardSx } from '../theme';

// Números tomados de argentina.gob.ar/tema/emergencias (nacionales) y del sitio de noticias Mendoza Post (provinciales).
// Antes de la entrega final conviene volver a revisarlos: los números pueden cambiar.
const GROUPS = [
    {
        title: 'Urgencias',
        items: [
            { number: '911', label: 'Emergencias', hint: 'Policía o ambulancia' },
            { number: '100', label: 'Bomberos', hint: 'Incendios' },
            { number: '103', label: 'Defensa Civil', hint: 'Catástrofes: sismos, inundaciones, derrumbes' },
        ],
    },
    {
        title: 'Cuidado y apoyo',
        items: [
            { number: '135', label: 'Prevención del suicidio', hint: 'Si estás pasando una crisis emocional' },
            { number: '144', label: 'Violencia de género', hint: 'Atención y asesoramiento' },
            { number: '142', label: 'Niños perdidos', hint: 'Atención las 24 hs' },
        ],
    },
    {
        title: 'Mendoza',
        items: [
            { number: '148', label: 'Atención Ciudadana', hint: 'Trámites y algunas denuncias' },
            { number: '0800 333 3672', label: 'EDEMSA', hint: 'Emergencias eléctricas' },
            { number: '0800 999 1600', label: 'Ecogas', hint: 'Emergencias de gas' },
        ],
    },
];

const telHref = (n) => `tel:${n.replace(/\D/g, '')}`;

const NumberRow = ({ number, label, hint }) => (
    <Box
        component="a"
        href={telHref(number)}
        aria-label={`Llamar al ${number}: ${label}`}
        sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, py: 1, px: 1, mx: -1, borderRadius: 2,
            textDecoration: 'none', color: 'inherit',
            '&:hover, &:focus-visible': { bgcolor: '#FDF1F0', outline: 'none' },
        }}
    >
        <Typography sx={{ fontWeight: 800, color: '#C62828', fontSize: '1.05rem', minWidth: number.length > 4 ? 118 : 44, whiteSpace: 'nowrap' }}>
            {number}
        </Typography>
        <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.25 }}>{label}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>{hint}</Typography>
        </Box>
    </Box>
);

// Tarjeta del inicio del paciente: el 911 siempre a la vista y el resto en un desplegable
const EmergencyCard = () => {
    const [open, setOpen] = useState(false);
    const panelId = useId();

    return (
        <Paper data-tour="emergency" elevation={0} sx={{ ...cardSx, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <IconBadge tone="red" size={40}><EmergencyOutlinedIcon /></IconBadge>
                <Box>
                    <Typography variant="h6" sx={{ fontSize: '1.05rem', lineHeight: 1.2 }}>Números de emergencia</Typography>
                    <Typography variant="caption" color="text.secondary">Argentina · Mendoza</Typography>
                </Box>
            </Box>

            <Button
                component="a"
                href="tel:911"
                fullWidth
                variant="contained"
                startIcon={<LocalPhoneRoundedIcon />}
                aria-label="Llamar al 911, emergencias"
                sx={{ bgcolor: '#C62828', '&:hover': { bgcolor: '#A81F1F' }, py: 1.1, textTransform: 'none', letterSpacing: 0, fontSize: '1rem' }}
            >
                Llamar al 911
            </Button>

            <ButtonBase
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-controls={panelId}
                sx={{
                    mt: 1.5, width: '100%', justifyContent: 'space-between', px: 0.5, py: 0.75, borderRadius: 2,
                    color: 'primary.main', fontWeight: 700, fontSize: '0.9rem',
                }}
            >
                {open ? 'Ocultar números' : 'Ver todos los números'}
                <ExpandMoreRoundedIcon sx={{ transition: 'transform .25s', transform: open ? 'rotate(180deg)' : 'none' }} />
            </ButtonBase>

            <Collapse in={open} timeout="auto" unmountOnExit id={panelId}>
                <Box sx={{ pt: 0.5 }}>
                    {GROUPS.map((g, i) => (
                        <Box key={g.title} sx={{ mt: i === 0 ? 0 : 1 }}>
                            <Divider sx={{ mb: 1 }} />
                            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.08em' }}>{g.title}</Typography>
                            {g.items.map((it) => <NumberRow key={it.number} {...it} />)}
                        </Box>
                    ))}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                        Tocá un número para llamar desde tu celular. Ante una urgencia, llamá siempre primero al 911.
                    </Typography>
                </Box>
            </Collapse>
        </Paper>
    );
};

export default EmergencyCard;
