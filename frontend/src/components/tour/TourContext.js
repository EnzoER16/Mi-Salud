import { createContext } from 'react';

// Permite que cualquier pantalla (por ejemplo el Inicio) le pida al Layout que arranque el recorrido guiado.
export const TourContext = createContext({ startTour: () => {} });
