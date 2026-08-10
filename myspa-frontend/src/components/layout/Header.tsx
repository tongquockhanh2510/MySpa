import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  type NotificationItem,
} from '@/api/notifications';
import { useAppDispatch } from '@hooks/useAppDispatch';
import { useAppSelector } from '@hooks/useAppSelector';
import { logout } from '@store/authSlice';
import { toggleDarkMode, toggleMobileSidebar } from '@store/uiSlice';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ROUTES } from '@constants/routes';
import { getInitials } from '@utils/formatters';
import { getNotificationTargetPath } from '@utils/notificationNavigation';
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
import MenuIcon from '@mui/icons-material/Menu';
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
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width:768px)');

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      getUnreadNotificationCount()
        .then((count) => { if (!cancelled) setUnreadCount(count); })
        .catch(() => { /* backend chua san sang thi giu badge cu */ });
    };
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [location.pathname]);

  const sidebarWidth = isMobile ? '0px' : (sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)');

  const handleLogout = async () => {
    setAnchorEl(null);
    await dispatch(logout());
    toast.success('Đã đăng xuất thành công');
    navigate(ROUTES.LOGIN);
  };

  const openNotifications = async (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
    setNotificationsLoading(true);
    try {
      const data = await getNotifications(false, 8);
      setNotifications(data);
      setUnreadCount(data.filter((item) => !(item.read ?? item.isRead)).length);
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải thông báo');
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    setNotificationAnchor(null);
    if (!(item.read ?? item.isRead)) {
      try {
        await markNotificationRead(item.notificationId);
        setNotifications((prev) => prev.map((n) => (
          n.notificationId === item.notificationId ? { ...n, read: true, isRead: true } : n
        )));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error(error);
      }
    }
    const path = getNotificationTargetPath(item);
    navigate(path || ROUTES.DASHBOARD);
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
      padding: isMobile ? '0 12px' : '0 24px',
      zIndex: 'var(--z-header)',
      transition: 'left var(--transition-slow)',
      boxShadow: 'var(--shadow-xs)',
    }}>
      {/* Hamburger menu - mobile only */}
      {isMobile && (
        <IconButton
          onClick={() => dispatch(toggleMobileSidebar())}
          size="small"
          sx={{ color: 'var(--text-secondary)', mr: 1, '&:hover': { background: 'var(--bg-tertiary)', color: 'var(--primary)' } }}
          aria-label="Mở menu điều hướng"
        >
          <MenuIcon fontSize="small" />
        </IconButton>
      )}

      {/* Left - Breadcrumb area */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Xin chào, <strong style={{ color: 'var(--primary)' }}>{userName}</strong> 👋
        </div>
      </div>

      {/* Right - Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0 : 4 }}>
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
            onClick={openNotifications}
            sx={{
              color: 'var(--text-secondary)',
              '&:hover': { background: 'var(--bg-tertiary)', color: 'var(--primary)' },
            }}
            aria-label="Thông báo"
          >
            <Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 16, height: 16 } }}>
              <NotificationsIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={() => setNotificationAnchor(null)}
          slotProps={{
            paper: {
              elevation: 0,
              sx: {
                mt: 1.5,
                borderRadius: '12px',
                width: 340,
                maxWidth: 'calc(100vw - 32px)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.16)',
                overflow: 'hidden',
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>Thông báo</strong>
            <button
              type="button"
              onClick={() => { setNotificationAnchor(null); navigate(ROUTES.NOTIFICATIONS); }}
              style={{ border: 0, background: 'none', color: 'var(--primary)', font: 'inherit', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
            >
              Xem tất cả
            </button>
          </div>
          {notificationsLoading ? (
            <MenuItem disabled>Đang tải thông báo...</MenuItem>
          ) : notifications.length ? (
            notifications.map((item) => {
              const unread = !(item.read ?? item.isRead);
              return (
                <MenuItem
                  key={item.notificationId}
                  onClick={() => handleNotificationClick(item)}
                  sx={{
                    alignItems: 'flex-start',
                    gap: 1,
                    py: 1.25,
                    whiteSpace: 'normal',
                    borderLeft: unread ? '3px solid var(--primary)' : '3px solid transparent',
                  }}
                >
                  <NotificationsIcon fontSize="small" sx={{ color: unread ? 'var(--primary)' : 'var(--text-tertiary)', mt: 0.25 }} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', color: 'var(--text-primary)', fontSize: 13, fontWeight: 800, lineHeight: 1.35 }}>{item.title}</span>
                    {item.message && <span style={{ display: 'block', color: 'var(--text-tertiary)', fontSize: 12, lineHeight: 1.4, marginTop: 2 }}>{item.message}</span>}
                  </span>
                </MenuItem>
              );
            })
          ) : (
            <MenuItem disabled>Chưa có thông báo</MenuItem>
          )}
        </Menu>

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

            <MenuItem onClick={handleLogout} sx={{ color: '#EF4444 !important', '&:hover': { background: 'var(--error-light) !important' } }}>
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
