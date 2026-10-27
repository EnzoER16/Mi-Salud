import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Box, Typography, Button, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import TouchAppRoundedIcon from '@mui/icons-material/TouchAppRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import IconBadge from '../IconBadge';
import { gradient } from '../../theme';
import { PATIENT_STEPS, DOCTOR_STEPS, getMock } from './tourSteps';

const PAD = 8;          // aire alrededor del elemento resaltado
const GAP = 16;         // separación entre el elemento y la tarjeta
const EDGE = 12;        // margen mínimo contra los bordes de la pantalla
const Z = 1500;         // por encima de menús y diálogos de MUI (1300)
const DIM = 'rgba(11, 42, 92, 0.62)';

const clamp = (v, min, max) => Math.min(Math.max(v, min), Math.max(min, max));
const sameRect = (a, b) =>
    (!a && !b) || (a && b && ['top', 'left', 'width', 'height'].every((k) => Math.round(a[k]) === Math.round(b[k])));

const readRect = (selector) => {
    const el = document.querySelector(`[data-tour="${selector}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return null;   // existe pero está oculto
    return { top: r.top, left: r.left, width: r.width, height: r.height, target: selector };
};

// Recorrido guiado: oscurece la pantalla y resalta, uno por uno, los elementos reales de la app.
// - Se puede omitir en cualquier momento (botón "Omitir", tecla Escape) y navegar con las flechas del teclado.
// - Los pasos con "probalo" interceptan el toque sobre el elemento resaltado: muestran una vista previa
//   en vez de ejecutar la acción real, así nadie sale de la pantalla por accidente.
// - Si un elemento no se encuentra (pantalla chica, datos todavía sin cargar), el paso se muestra centrado.
const OnboardingTour = ({ open, role, onClose }) => {
    const theme = useTheme();
    const compact = useMediaQuery(theme.breakpoints.down('sm'));
    const steps = role === 'Doctor' ? DOCTOR_STEPS : PATIENT_STEPS;

    const [index, setIndex] = useState(0);
    const [tried, setTried] = useState({});          // { [indice]: true } pasos "probados"
    const [rect, setRect] = useState(null);
    const [giveUp, setGiveUp] = useState(false);     // no apareció el elemento: se muestra centrado
    const [cardH, setCardH] = useState(260);
    const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });

    const cardRef = useRef(null);
    const scrolledFor = useRef(-1);
    const foundRef = useRef(false);   // ¿ya se encontró el elemento de este paso?

    const step = steps[index];
    const isFirst = index === 0;
    const isLast = index === steps.length - 1;
    const wasTried = Boolean(tried[index]);

    const next = useCallback(() => (isLast ? onClose() : setIndex((i) => i + 1)), [isLast, onClose]);
    const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

    // Cada vez que se abre, arranca desde cero
    useEffect(() => {
        if (open) {
            setIndex(0);
            setTried({});
            setRect(null);
            scrolledFor.current = -1;
        }
    }, [open]);

    // Cambio de paso: se vuelve a buscar el elemento
    useEffect(() => {
        setRect(null);
        setGiveUp(false);
        foundRef.current = false;
        scrolledFor.current = -1;
        if (!open || !step?.target) return undefined;
        // Solo se rinde si pasados 2,5 s el elemento TODAVÍA no apareció (antes se rendía siempre y el recuadro
        // desaparecía solo mientras la persona leía). Una vez encontrado, el recuadro se queda hasta que ella avance.
        const t = setTimeout(() => { if (!foundRef.current) setGiveUp(true); }, 2500);
        return () => clearTimeout(t);
    }, [open, index, step]);

    // Sigue al elemento mientras se hace scroll, se redimensiona la ventana o terminan de cargar los datos
    useEffect(() => {
        if (!open) return undefined;
        let frame;
        const tick = () => {
            setVp((v) => (v.w === window.innerWidth && v.h === window.innerHeight ? v : { w: window.innerWidth, h: window.innerHeight }));
            const r = step?.target ? readRect(step.target) : null;
            if (r) foundRef.current = true;
            setRect((prev) => (sameRect(prev, r) ? prev : r));
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [open, step]);

    // Mide la tarjeta para poder ubicarla
    useLayoutEffect(() => {
        if (open && cardRef.current) {
            const h = cardRef.current.offsetHeight;
            if (h && Math.abs(h - cardH) > 1) setCardH(h);
        }
    });

    // En celular la tarjeta tapa la parte baja de la pantalla: se agrega espacio al final de la página mientras
    // el recorrido está abierto, para que los elementos de abajo puedan subir y quedar visibles por encima de la hoja
    useEffect(() => {
        if (!open || !compact) return undefined;
        const prev = document.body.style.paddingBottom;
        document.body.style.paddingBottom = `${Math.round(window.innerHeight * 0.6)}px`;
        return () => { document.body.style.paddingBottom = prev; };
    }, [open, compact]);

    // Si el elemento queda fuera de la zona visible (o tapado por la tarjeta en celular), se hace scroll hasta él
    useEffect(() => {
        if (!open || !rect || rect.target !== step?.target || scrolledFor.current === index) return;   // espera a medir el elemento de ESTE paso
        scrolledFor.current = index;
        const top = 8;
        const bottom = vp.h - (compact ? cardH + 2 * EDGE : 0) - 8;
        const tall = rect.height + 2 * PAD > bottom - top;
        let delta = 0;
        if (tall) delta = rect.top - PAD - 80;
        else if (rect.top - PAD < top) delta = rect.top - PAD - top - 60;
        else if (rect.top + rect.height + PAD > bottom) delta = rect.top + rect.height + PAD - bottom + 12;
        if (Math.abs(delta) > 2) {
            const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
            window.scrollBy({ top: delta, behavior: reduce ? 'auto' : 'smooth' });
        }
    }, [open, rect, index, vp.h, compact, cardH]);

    // Pasos "probalo": el toque sobre el elemento resaltado no hace la acción real, solo muestra la vista previa
    useEffect(() => {
        if (!open || !step?.try || !step.target) return undefined;
        const el = document.querySelector(`[data-tour="${step.target}"]`);
        if (!el) return undefined;
        const intercept = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setTried((t) => ({ ...t, [index]: true }));
        };
        el.addEventListener('click', intercept, true);
        return () => el.removeEventListener('click', intercept, true);
    }, [open, step, index, rect === null]);   // eslint-disable-line react-hooks/exhaustive-deps

    // Teclado: flechas para navegar, Escape para omitir
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key === 'ArrowRight') next();
            else if (e.key === 'ArrowLeft') back();
            else if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, next, back, onClose]);

    if (!open || !step) return null;

    const spotlight = step.target && rect && !giveUp ? rect : null;
    const waiting = step.target && !rect && !giveUp;   // todavía buscando el elemento

    // ---- Geometría del recuadro resaltado (recortado a la pantalla) ----
    let hole = null;
    if (spotlight) {
        const top = Math.max(spotlight.top - PAD, 4);
        const left = Math.max(spotlight.left - PAD, 4);
        // En celular la tarjeta es una hoja inferior: si el elemento es más alto que el espacio libre, se resalta
        // solo la parte visible por encima de la hoja (el resto queda accesible con scroll al cerrar el paso)
        const limit = compact ? vp.h - cardH - 2 * EDGE - 4 : vp.h - 4;
        const bottom = Math.max(Math.min(spotlight.top + spotlight.height + PAD, limit), top + 40);
        const right = Math.min(spotlight.left + spotlight.width + PAD, vp.w - 4);
        hole = { top, left, width: Math.max(right - left, 0), height: Math.max(bottom - top, 0) };
    }

    // ---- Ubicación de la tarjeta ----
    const cardW = Math.min(380, vp.w - 2 * EDGE);
    let cardStyle;
    let arrow = null;   // 'up' (la tarjeta está debajo del elemento) | 'down' (arriba)
    if (compact) {
        cardStyle = { left: EDGE, right: EDGE, bottom: EDGE, width: 'auto' };
    } else if (!hole) {
        cardStyle = { top: Math.max((vp.h - cardH) / 2, EDGE), left: (vp.w - cardW) / 2, width: cardW };
    } else {
        const below = vp.h - (hole.top + hole.height);
        const above = hole.top;
        const centerX = hole.left + hole.width / 2;
        const leftPos = clamp(centerX - cardW / 2, EDGE, vp.w - cardW - EDGE);
        if (below >= cardH + GAP + EDGE) {
            cardStyle = { top: hole.top + hole.height + GAP, left: leftPos, width: cardW };
            arrow = { dir: 'up', x: clamp(centerX - leftPos, 24, cardW - 24) };
        } else if (above >= cardH + GAP + EDGE) {
            cardStyle = { top: hole.top - GAP - cardH, left: leftPos, width: cardW };
            arrow = { dir: 'down', x: clamp(centerX - leftPos, 24, cardW - 24) };
        } else if (vp.w - (hole.left + hole.width) >= cardW + GAP + EDGE) {
            cardStyle = { top: clamp(hole.top, EDGE, vp.h - cardH - EDGE), left: hole.left + hole.width + GAP, width: cardW };
        } else if (hole.left >= cardW + GAP + EDGE) {
            cardStyle = { top: clamp(hole.top, EDGE, vp.h - cardH - EDGE), left: hole.left - GAP - cardW, width: cardW };
        } else {
            cardStyle = { top: vp.h - cardH - EDGE, left: leftPos, width: cardW };   // el elemento es enorme: la tarjeta va encima, abajo
        }
    }

    const mock = step.mock ? getMock(step.mock) : null;
    const needsClickBlock = Boolean(hole) && !step.passThrough && !step.try;   // el hueco no deja pasar toques

    const content = (
        <Box
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-title"
            sx={{
                position: 'fixed', inset: 0, zIndex: Z, pointerEvents: 'none',   // el hueco deja pasar el toque; los bloqueadores y la tarjeta lo reciben
                '@keyframes tourPulse': { '0%': { transform: 'scale(1)', opacity: 0.9 }, '100%': { transform: 'scale(1.12)', opacity: 0 } },
                '@keyframes tourTap': { '0%,100%': { transform: 'translate(0,0)' }, '50%': { transform: 'translate(-6px,-8px)' } },
                '@keyframes tourIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'none' } },
                '@keyframes tourFade': { from: { opacity: 0 }, to: { opacity: 1 } },
                '@media (prefers-reduced-motion: reduce)': { '& *': { animation: 'none !important', transition: 'none !important' } },
            }}
        >
            {/* Oscurecido: sin recuadro es un fondo completo; con recuadro lo hace la sombra gigante del "hueco" */}
            {!hole && <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'auto', bgcolor: DIM, animation: 'tourFade .25s ease' }} />}

            {hole && (
                <>
                    {/* Cuatro bloqueadores transparentes: tapan toda la app menos el recuadro resaltado */}
                    <Box sx={{ position: 'absolute', pointerEvents: 'auto', left: 0, right: 0, top: 0, height: hole.top }} />
                    <Box sx={{ position: 'absolute', pointerEvents: 'auto', left: 0, right: 0, top: hole.top + hole.height, bottom: 0 }} />
                    <Box sx={{ position: 'absolute', pointerEvents: 'auto', left: 0, width: hole.left, top: hole.top, height: hole.height }} />
                    <Box sx={{ position: 'absolute', pointerEvents: 'auto', left: hole.left + hole.width, right: 0, top: hole.top, height: hole.height }} />
                    {needsClickBlock && <Box sx={{ position: 'absolute', pointerEvents: 'auto', left: hole.left, top: hole.top, width: hole.width, height: hole.height }} />}

                    {/* Recuadro con sombra que oscurece el resto + aro que late */}
                    <Box
                        sx={{
                            position: 'absolute', top: hole.top, left: hole.left, width: hole.width, height: hole.height,
                            borderRadius: '16px', pointerEvents: 'none',
                            boxShadow: `0 0 0 9999px ${DIM}`,
                            outline: '3px solid #2DB89A', outlineOffset: 0,
                            transition: 'top .35s ease, left .35s ease, width .35s ease, height .35s ease',
                        }}
                    >
                        {!wasTried && (
                            <Box sx={{ position: 'absolute', inset: -3, borderRadius: '18px', border: '3px solid #2DB89A', animation: 'tourPulse 1.6s ease-out infinite' }} />
                        )}
                        {step.try && !wasTried && (
                            <Box sx={{ position: 'absolute', right: 6, bottom: 6, color: '#fff', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))', animation: 'tourTap 1.2s ease-in-out infinite', display: 'grid' }}>
                                <TouchAppRoundedIcon sx={{ fontSize: 38 }} />
                            </Box>
                        )}
                    </Box>
                </>
            )}

            {/* Tarjeta explicativa */}
            <Box
                ref={cardRef}
                key={index}
                sx={{
                    position: 'absolute', pointerEvents: 'auto', ...cardStyle, maxHeight: `calc(100vh - ${2 * EDGE}px)`, overflowY: 'auto',
                    bgcolor: '#fff', borderRadius: 4, boxShadow: '0 20px 60px rgba(11,42,92,.35)',
                    animation: 'tourIn .3s ease', outline: 'none',
                }}
            >
                {arrow && (
                    <Box
                        aria-hidden
                        sx={{
                            position: 'absolute', left: arrow.x - 9, width: 18, height: 18, bgcolor: '#fff', transform: 'rotate(45deg)',
                            ...(arrow.dir === 'up' ? { top: -9, borderRadius: '4px 0 0 0' } : { bottom: -9, borderRadius: '0 0 4px 0' }),
                        }}
                    />
                )}

                <Box sx={{ height: 5, background: '#E6F0F2', borderRadius: '16px 16px 0 0', overflow: 'hidden' }} aria-hidden>
                    <Box sx={{ height: '100%', width: `${((index + 1) / steps.length) * 100}%`, background: gradient, transition: 'width .35s ease' }} />
                </Box>

                <Box sx={{ position: 'relative', p: { xs: 2.25, sm: 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Paso {index + 1} de {steps.length}
                        </Typography>
                        {!isLast && (
                            <Button color="inherit" onClick={onClose} sx={{ textTransform: 'none', letterSpacing: 0, color: 'text.secondary', fontSize: '0.9rem', minWidth: 0, px: 1 }}>
                                Omitir tutorial
                            </Button>
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: hole ? 'row' : 'column', alignItems: hole ? 'flex-start' : 'center', textAlign: hole ? 'left' : 'center', gap: 2 }}>
                        <IconBadge tone={step.tone} size={hole ? 48 : 76}>
                            <Box sx={{ fontSize: hole ? 26 : 40, display: 'grid', placeItems: 'center' }}>{step.icon}</Box>
                        </IconBadge>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography id="tour-title" component="h2" sx={{ fontWeight: 700, fontSize: hole ? '1.2rem' : '1.4rem', lineHeight: 1.25, mb: 0.75 }}>
                                {step.title}
                            </Typography>
                            <Typography sx={{ fontSize: '1rem', lineHeight: 1.55, color: 'text.secondary' }}>
                                {step.text}
                            </Typography>
                        </Box>
                    </Box>

                    {waiting && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                            Buscando el elemento en la pantalla…
                        </Typography>
                    )}

                    {mock && <Box sx={{ mt: 2, p: 1.5, borderRadius: 3, bgcolor: '#F3F8F9', animation: 'tourFade .4s ease' }}>{mock}</Box>}

                    {/* "Probalo": invitación o resultado */}
                    {step.try && hole && !wasTried && (
                        <Box sx={{ mt: 2, px: 1.5, py: 1, borderRadius: 3, bgcolor: '#E6F5F7', color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TouchAppRoundedIcon fontSize="small" />
                            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{step.try.hint}</Typography>
                        </Box>
                    )}
                    {step.try && wasTried && (
                        <Box sx={{ mt: 2, animation: 'tourIn .3s ease' }} aria-live="polite">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'success.main', mb: 1 }}>
                                <CheckCircleRoundedIcon fontSize="small" />
                                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>¡Muy bien! Esto es lo que pasaría:</Typography>
                            </Box>
                            <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: '#F3F8F9' }}>{step.try.demo}</Box>
                        </Box>
                    )}
                    {step.passThrough && hole && (
                        <Box sx={{ mt: 2, px: 1.5, py: 1, borderRadius: 3, bgcolor: '#E6F5F7', color: 'primary.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TouchAppRoundedIcon fontSize="small" />
                            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Podés usar el recuadro resaltado</Typography>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mt: 2.5 }}>
                        <Button
                            onClick={back} startIcon={<ArrowBackRoundedIcon />}
                            sx={{ textTransform: 'none', letterSpacing: 0, fontSize: '1rem', visibility: isFirst ? 'hidden' : 'visible' }}
                        >
                            Anterior
                        </Button>

                        <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 0.6 }} aria-hidden>
                            {steps.map((_, i) => (
                                <Box key={i} sx={{ width: i === index ? 18 : 7, height: 7, borderRadius: 4, bgcolor: i === index ? 'primary.main' : '#CFE3E8', transition: 'all .2s ease' }} />
                            ))}
                        </Box>

                        <Button
                            variant="contained" onClick={next} autoFocus size="large"
                            endIcon={isLast ? undefined : <ArrowForwardRoundedIcon />}
                            sx={{ textTransform: 'none', letterSpacing: 0, fontSize: '1rem', px: 3 }}
                        >
                            {isLast ? 'Empezar' : 'Siguiente'}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );

    return createPortal(content, document.body);
};

export default OnboardingTour;
