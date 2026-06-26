import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@hooks/useAppDispatch';
import { useAppSelector } from '@hooks/useAppSelector';
import { logout } from '@store/authSlice';
import { toggleSidebar } from '@store/uiSlice';
import { ROUTES } from '@constants/routes';
import { toast } from 'sonner';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BadgeIcon from '@mui/icons-material/Badge';
import SpaIcon from '@mui/icons-material/Spa';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PaymentsIcon from '@mui/icons-material/Payments';
import BarChartIcon from '@mui/icons-material/BarChart';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import ShieldIcon from '@mui/icons-material/Shield';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Tooltip from '@mui/material/Tooltip';

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

const menuGroups: MenuGroup[] = [
  {
    title: 'Tổng quan',
    items: [
      { label: 'Bảng điều khiển', icon: <DashboardIcon fontSize="small" />, path: ROUTES.DASHBOARD },
    ],
  },
  {
    title: 'Khách hàng & Dịch vụ',
    items: [
      { label: 'Khách hàng', icon: <PeopleIcon fontSize="small" />, path: ROUTES.CUSTOMERS },
      { label: 'Nhân viên', icon: <BadgeIcon fontSize="small" />, path: ROUTES.EMPLOYEES },
      { label: 'Dịch vụ', icon: <SpaIcon fontSize="small" />, path: ROUTES.SERVICES },
      { label: 'Lịch hẹn', icon: <CalendarMonthIcon fontSize="small" />, path: ROUTES.APPOINTMENTS },
      { label: 'Gói liệu trình', icon: <FolderSpecialIcon fontSize="small" />, path: ROUTES.TREATMENT_PACKAGES },
      { label: 'Liệu trình khách hàng', icon: <MedicalServicesIcon fontSize="small" />, path: ROUTES.CUSTOMER_TREATMENTS },
      { label: 'Chuyển đổi liệu trình', icon: <CompareArrowsIcon fontSize="small" />, path: ROUTES.PACKAGE_CONVERSIONS },
    ],
  },
  {
    title: 'Tài chính & Kho',
    items: [
      { label: 'Đơn hàng', icon: <ReceiptLongIcon fontSize="small" />, path: ROUTES.ORDERS },
      { label: 'Sản phẩm', icon: <InventoryIcon fontSize="small" />, path: ROUTES.PRODUCTS },
      { label: 'Danh mục', icon: <CategoryIcon fontSize="small" />, path: ROUTES.CATEGORIES },
      { label: 'Khuyến mãi', icon: <LocalOfferIcon fontSize="small" />, path: ROUTES.PROMOTIONS },
      { label: 'Lương nhân viên', icon: <PaymentsIcon fontSize="small" />, path: ROUTES.SALARIES },
      { label: 'Báo cáo', icon: <BarChartIcon fontSize="small" />, path: ROUTES.REPORTS },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { label: 'Người dùng', icon: <ManageAccountsIcon fontSize="small" />, path: ROUTES.USERS },
      { label: 'Vai trò', icon: <ShieldIcon fontSize="small" />, path: ROUTES.ROLES },
      { label: 'Phân quyền', icon: <VpnKeyIcon fontSize="small" />, path: ROUTES.PERMISSIONS },
    ],
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Đã đăng xuất thành công');
    navigate(ROUTES.LOGIN);
  };

  return (
    <aside
      style={{
        width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        height: '100vh',
        background: 'linear-gradient(180deg, #1C1917 0%, #0A0908 100%)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width var(--transition-slow)',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 'var(--z-sidebar)',
        boxShadow: '4px 0 20px rgba(0,0,0,0.25)',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 16px' : '20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minHeight: 'var(--header-height)',
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #D97706, #F59E0B)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(217,119,6,0.4)',
        }}>
          <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 20 }} />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
              MY SPA
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, whiteSpace: 'nowrap' }}>
              Quản lý spa chuyên nghiệp
            </div>
          </div>
        )}
        <button
          onClick={() => dispatch(toggleSidebar())}
          style={{
            marginLeft: 'auto',
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all var(--transition-base)',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
          aria-label="Thu gọn sidebar"
        >
          <ChevronLeftIcon fontSize="small" style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-slow)' }} />
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 0' }}>
        {menuGroups.map((group) => (
          <div key={group.title} style={{ marginBottom: 4 }}>
            {!collapsed && (
              <div style={{
                padding: '8px 20px 4px',
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.3)',
              }}>
                {group.title}
              </div>
            )}
            {group.items.map((item) => {
              const active = isActive(item.path);
              const menuItem = (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: collapsed ? '10px 18px' : '9px 16px 9px 20px',
                    margin: '1px 0',
                    color: active ? '#F59E0B' : 'rgba(255,255,255,0.75)',
                    background: active
                      ? 'linear-gradient(90deg, rgba(217,119,6,0.25) 0%, rgba(217,119,6,0.05) 100%)'
                      : 'transparent',
                    borderLeft: active ? '3px solid #F59E0B' : '3px solid transparent',
                    fontWeight: active ? 600 : 400,
                    fontSize: 13.5,
                    borderRadius: 0,
                    transition: 'all var(--transition-fast)',
                    whiteSpace: 'nowrap',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                      (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)';
                    }
                  }}
                >
                  <span style={{ flexShrink: 0, opacity: active ? 1 : 0.8 }}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );

              return collapsed ? (
                <Tooltip key={item.path} title={item.label} placement="right" arrow>
                  <span>{menuItem}</span>
                </Tooltip>
              ) : menuItem;
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {collapsed ? (
          <Tooltip title="Đăng xuất" placement="right" arrow>
            <button
              onClick={handleLogout}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '10px', color: '#EF4444', background: 'transparent',
                transition: 'all var(--transition-fast)', cursor: 'pointer',
              }}
            >
              <LogoutIcon fontSize="small" />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 20px', color: '#EF4444', background: 'transparent',
              fontSize: 13.5, fontWeight: 500, transition: 'all var(--transition-fast)', cursor: 'pointer',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <LogoutIcon fontSize="small" />
            <span>Đăng xuất</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
