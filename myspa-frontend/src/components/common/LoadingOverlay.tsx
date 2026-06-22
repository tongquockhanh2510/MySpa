import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Đang tải...' }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 300,
      gap: 16,
    }}>
      <CircularProgress
        size={40}
        thickness={4}
        sx={{ color: 'var(--primary)' }}
      />
      <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>{message}</p>
    </div>
  );
};

export default LoadingOverlay;
