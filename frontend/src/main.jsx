import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Importaciones de Material UI
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'

// Opcional: Podés personalizar los colores principales de tu app acá
const theme = createTheme({
  palette: {
    primary: {
      main: '#00838F', // Un tono verde/azulado médico (podés cambiarlo)
    },
    secondary: {
      main: '#4DB6AC', 
    },
    background: {
      default: '#f5f5f5'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      {/* CssBaseline normaliza los estilos y aplica el color de fondo del tema */}
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)