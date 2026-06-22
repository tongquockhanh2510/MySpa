import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAppSelector } from '@hooks/useAppSelector';
import Sidebar from '@components/layout/Sidebar';
import Header from '@components/layout/Header';

const MainLayout: React.FC = () => {
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const sidebarWidth = collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)';

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
            padding: '24px',
            flex: 1,
            minHeight: 0,
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
