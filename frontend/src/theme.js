import { createTheme } from '@mui/material/styles';

// Paleta tomada del logo de MiSalud+
export const colors = {
    navy: '#0B2A5C',
    blue: '#1A73D9',
    teal: '#0E8FA3',
    mint: '#2DB89A',
    green: '#7AB63F',
    bg: '#F3F8F9',
    border: '#E1EAEE',
    muted: '#5B6B82',
};

export const gradient = `linear-gradient(90deg, ${colors.blue} 0%, ${colors.teal} 55%, ${colors.mint} 100%)`;

// Estilo base de las "tarjetas" de toda la app
export const cardSx = {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 3,
    boxShadow: '0 1px 2px rgba(11, 42, 92, 0.04), 0 4px 16px rgba(11, 42, 92, 0.04)',
};

const theme = createTheme({
    palette: {
        primary: { main: colors.teal, dark: '#0A6F80', light: '#E6F5F7', contrastText: '#fff' },
        secondary: { main: colors.blue },
        success: { main: '#4C9A2A' },
        warning: { main: '#E39B1B' },
        background: { default: colors.bg, paper: '#fff' },
        text: { primary: colors.navy, secondary: colors.muted },
        divider: colors.border,
    },
    shape: { borderRadius: 12 },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: { fontWeight: 700, letterSpacing: '-0.02em' },
        h5: { fontWeight: 700 },
        h6: { fontWeight: 700 },
        subtitle1: { fontWeight: 600 },
        button: { fontWeight: 600, letterSpacing: '0.04em' },
    },
    components: {
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: { root: { borderRadius: 10, paddingInline: 20 } },
        },
        MuiOutlinedInput: {
            styleOverrides: { root: { borderRadius: 10, backgroundColor: '#fff' } },
        },
        MuiChip: {
            styleOverrides: { root: { fontWeight: 600 } },
        },
        MuiAlert: {
            styleOverrides: { root: { borderRadius: 10 } },
        },
        MuiDialog: {
            styleOverrides: { paper: { borderRadius: 16 } },
        },
        MuiTableCell: {
            styleOverrides: {
                root: { borderColor: colors.border },
                head: {
                    backgroundColor: '#F6FAFB',
                    color: colors.muted,
                    fontWeight: 600,
                    fontSize: '0.8rem',
                },
            },
        },
    },
});

export default theme;
