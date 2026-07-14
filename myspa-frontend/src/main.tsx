import { StrictMode, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider, useSelector } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'sonner';
import { store, type RootState } from '@store/index';
import './index.css';
import App from './App.tsx';

// Apply stored dark mode on initial load
const storedDarkMode = localStorage.getItem('spa_dark_mode') === 'true';
if (storedDarkMode) {
  document.documentElement.setAttribute('data-theme', 'dark');
}

const buildTheme = (darkMode: boolean) => createTheme({
  palette: {
    mode: darkMode ? 'dark' : 'light',
    primary: {
      main: '#D97706',
      light: '#F59E0B',
      dark: '#B45309',
    },
    ...(darkMode
      ? {
          background: { default: '#0F172A', paper: '#1E293B' },
          text: { primary: '#F8FAFC', secondary: '#CBD5E1' },
          divider: '#334155',
        }
      : {
          background: { default: '#F8FAFC', paper: '#FFFFFF' },
          text: { primary: '#0F172A', secondary: '#475569' },
          divider: '#E2E8F0',
        }),
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

const ThemedApp = () => {
  const darkMode = useSelector((state: RootState) => state.ui.darkMode);
  const theme = useMemo(() => buildTheme(darkMode), [darkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
      <Toaster
        position="top-right"
        richColors
        theme={darkMode ? 'dark' : 'light'}
        toastOptions={{
          style: {
            fontFamily: "'Inter', sans-serif",
            fontSize: '13.5px',
            borderRadius: '12px',
          },
        }}
      />
    </ThemeProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemedApp />
    </Provider>
  </StrictMode>
);
