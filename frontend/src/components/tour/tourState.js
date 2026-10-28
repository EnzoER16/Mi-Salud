// Recuerda (en este navegador) si cada usuario ya vio o cerró el tutorial de bienvenida.
// Se guarda en localStorage y no en la base de datos a propósito: así no hace falta tocar tablas.
// Si el navegador no deja usar localStorage, el tutorial simplemente se muestra de nuevo (no se rompe nada).

const keyFor = (user) => `misalud_tour_seen_${user?.id_user || user?.email || user?.username || 'anon'}`;

export const hasSeenTour = (user) => {
    try {
        return localStorage.getItem(keyFor(user)) === '1';
    } catch {
        return true;   // sin almacenamiento no insistimos: evitaría que se pueda omitir de verdad
    }
};

export const markTourSeen = (user) => {
    try {
        localStorage.setItem(keyFor(user), '1');
    } catch {
        // sin almacenamiento: no pasa nada
    }
};
