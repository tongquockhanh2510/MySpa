import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAppSelector } from '@hooks/useAppSelector';
import Sidebar from '@components/layout/Sidebar';
import Header from '@components/layout/Header';
import useMediaQuery from '@mui/material/useMediaQuery';

const MainLayout: React.FC = () => {
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const isMobile = useMediaQuery('(max-width:768px)');
  const sidebarWidth = isMobile ? '0px' : (collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Sidebar />
      <div
        style={{
          marginLeft: sidebarWidth,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          transition: 'margin-left var(--transition-slow)',
          minWidth: 0,
        }}
      >
        <Header />
        <main
          style={{
            marginTop: 'var(--header-height)',
            padding: isMobile ? '14px' : '24px',
            flex: 1,
            minHeight: 0,
            minWidth: 0,
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
