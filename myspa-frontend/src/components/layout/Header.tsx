import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@hooks/useAppDispatch';
import { useAppSelector } from '@hooks/useAppSelector';
import { logout } from '@store/authSlice';
import { toggleDarkMode } from '@store/uiSlice';
import { ROUTES } from '@constants/routes';
import { getInitials } from '@utils/formatters';
import { toast } from 'sonner';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';
import LogoutIcon from '@mui/icons-material/Logout';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { darkMode, sidebarCollapsed } = useAppSelector((s) => s.ui);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const sidebarWidth = sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)';

  const handleLogout = async () => {
    setAnchorEl(null);
    await dispatch(logout());
    toast.success('Đã đăng xuất thành công');
    navigate(ROUTES.LOGIN);
  };

  const userName = user?.userName ?? 'Admin';

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: sidebarWidth,
      right: 0,
      height: 'var(--header-height)',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      zIndex: 'var(--z-header)',
      transition: 'left var(--transition-slow)',
      boxShadow: 'var(--shadow-xs)',
    }}>
      {/* Left - Breadcrumb area */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
          Xin chào, <strong style={{ color: 'var(--primary)' }}>{userName}</strong> 👋
        </div>
      </div>

      {/* Right - Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Dark mode toggle */}
        <Tooltip title={darkMode ? 'Chế độ sáng' : 'Chế độ tối'}>
          <IconButton
            onClick={() => dispatch(toggleDarkMode())}
            size="small"
            sx={{
              color: 'var(--text-secondary)',
              '&:hover': { background: 'var(--bg-tertiary)', color: 'var(--primary)' },
            }}
            aria-label="Chuyển chế độ tối/sáng"
          >
            {darkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        {/* Notifications */}
        <Tooltip title="Thông báo">
          <IconButton
            size="small"
            sx={{
              color: 'var(--text-secondary)',
              '&:hover': { background: 'var(--bg-tertiary)', color: 'var(--primary)' },
            }}
            aria-label="Thông báo"
          >
            <Badge badgeContent={3} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 16, height: 16 } }}>
              <NotificationsIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* User Avatar */}
        <div style={{ marginLeft: 8 }}>
          <Tooltip title="Tài khoản">
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              size="small"
              aria-label="Menu tài khoản"
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl)}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  background: 'linear-gradient(135deg, #D97706, #F59E0B)',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {getInitials(userName)}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 4px 20px rgba(0,0,0,0.12))',
                  mt: 1.5,
                  borderRadius: '12px',
                  minWidth: 200,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  '& .MuiMenuItem-root': {
                    fontSize: 13.5,
                    color: 'var(--text-primary)',
                    borderRadius: '8px',
                    mx: 0.5,
                    px: 1.5,
                    '&:hover': { background: 'var(--bg-tertiary)' },
                  },
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {/* User info header */}
            <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid var(--border-color)', marginBottom: 4 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{userName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                {user?.roles?.[0]?.description ?? 'Quản trị viên'}
              </div>
            </div>

            <MenuItem onClick={() => { setAnchorEl(null); navigate(ROUTES.PROFILE); }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <AccountCircleIcon fontSize="small" sx={{ color: 'var(--text-secondary)' }} />
              </ListItemIcon>
              <ListItemText>Thông tin cá nhân</ListItemText>
            </MenuItem>

            <MenuItem onClick={() => { setAnchorEl(null); navigate(ROUTES.CHANGE_PASSWORD); }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <LockIcon fontSize="small" sx={{ color: 'var(--text-secondary)' }} />
              </ListItemIcon>
              <ListItemText>Đổi mật khẩu</ListItemText>
            </MenuItem>

            <Divider sx={{ my: 0.5, borderColor: 'var(--border-color)' }} />

            <MenuItem onClick={handleLogout} sx={{ color: '#EF4444 !important', '&:hover': { background: '#FEE2E2 !important' } }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <LogoutIcon fontSize="small" sx={{ color: '#EF4444' }} />
              </ListItemIcon>
              <ListItemText>Đăng xuất</ListItemText>
            </MenuItem>
          </Menu>
        </div>
      </div>
    </header>
  );
};

export default Header;
