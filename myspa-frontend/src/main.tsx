import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'sonner';
import { store } from '@store/index';
import './index.css';
import App from './App.tsx';

// Apply stored dark mode on initial load
const storedDarkMode = localStorage.getItem('spa_dark_mode') === 'true';
if (storedDarkMode) {
  document.documentElement.setAttribute('data-theme', 'dark');
}

const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#D97706',
      light: '#F59E0B',
      dark: '#B45309',
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontFamily: "'Inter', sans-serif",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <App />
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: "'Inter', sans-serif",
              fontSize: '13.5px',
              borderRadius: '12px',
            },
          }}
        />
      </ThemeProvider>
    </Provider>
  </StrictMode>
);
