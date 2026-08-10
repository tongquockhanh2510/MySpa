import React from 'react';
import { Outlet } from 'react-router-dom';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const AuthLayout: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1C1917 0%, #292524 50%, #1C1917 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflowX: 'hidden',
      overflowY: 'auto',
      padding: '80px 0 24px',
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: -100,
        right: -100,
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(217,119,6,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: -150,
        left: -100,
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Animated dots */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'rgba(217,119,6,0.4)',
            top: `${20 + i * 15}%`,
            left: `${5 + i * 16}%`,
            animation: `pulse 2s ease-in-out ${i * 0.3}s infinite`,
          }}
        />
      ))}

      {/* Brand header */}
      <div style={{
        position: 'absolute',
        top: 32,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #D97706, #F59E0B)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(217,119,6,0.4)',
        }}>
          <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 22 }} />
        </div>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 22, letterSpacing: '-0.5px' }}>
          MY SPA
        </span>
      </div>

      {/* Auth content */}
      <div style={{ width: '100%', maxWidth: 440, padding: '0 16px', position: 'relative', zIndex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
