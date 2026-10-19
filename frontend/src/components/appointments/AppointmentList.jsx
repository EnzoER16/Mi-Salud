import { Box, Typography, ButtonBase } from '@mui/material';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import { colors } from '../../theme';
import { formatShortDateTime, pluralFiles } from './format';

const SectionLabel = ({ children }) => (
    <Typography
        sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: 'text.secondary', textTransform: 'uppercase', mt: 2, mb: 1 }}
    >
        {children}
    </Typography>
);

const AppointmentItem = ({ appointment, selected, status, onSelect }) => (
    <ButtonBase
        onClick={() => onSelect(appointment.id_appointment)}
        aria-current={selected ? 'true' : undefined}
        sx={{
            display: 'block', width: '100%', textAlign: 'left', p: 1.75, mb: 1.25, borderRadius: 3,
            border: '1px solid', borderColor: selected ? colors.teal : 'divider',
            bgcolor: selected ? '#E9F6F8' : '#fff',
            boxShadow: selected ? '0 0 0 1px rgba(14,143,163,0.25)' : 'none',
            transition: 'all .12s ease',
            '&:hover': { borderColor: colors.teal },
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: colors.navy }}>
                {formatShortDateTime(appointment.scheduled_at)}
            </Typography>
            {selected
                ? <CheckCircleOutlineRoundedIcon sx={{ fontSize: 18, color: colors.teal }} />
                : <ChevronRightRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />}
        </Box>
        <Typography sx={{ fontWeight: 700, mt: 0.5 }} noWrap>{appointment.title}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap display="block">
            {[appointment.doctor_name, appointment.location].filter(Boolean).join(' · ') || appointment.modality}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: selected ? colors.teal : 'text.secondary' }}>
                {selected ? 'Seleccionado' : status}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <AttachFileRoundedIcon sx={{ fontSize: 14 }} />
                {pluralFiles(appointment.file_count)}
            </Typography>
        </Box>
    </ButtonBase>
);

const AppointmentList = ({ upcoming, past, selectedId, onSelect }) => (
    <Box>
        {upcoming.length > 0 && (
            <>
                <SectionLabel>Próximos · {upcoming.length}</SectionLabel>
                {upcoming.map((a) => (
                    <AppointmentItem key={a.id_appointment} appointment={a} status="Próximo"
                        selected={a.id_appointment === selectedId} onSelect={onSelect} />
                ))}
            </>
        )}
        {past.length > 0 && (
            <>
                <SectionLabel>Anteriores · {past.length}</SectionLabel>
                {past.map((a) => (
                    <AppointmentItem key={a.id_appointment} appointment={a} status="Anterior"
                        selected={a.id_appointment === selectedId} onSelect={onSelect} />
                ))}
            </>
        )}
    </Box>
);

export default AppointmentList;
