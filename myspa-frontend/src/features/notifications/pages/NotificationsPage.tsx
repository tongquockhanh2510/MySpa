import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Chip, Skeleton, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { toast } from 'sonner';
import PageHeader from '@components/common/PageHeader';
import {
  getNotifications, markAllNotificationsRead, markNotificationRead,
  type NotificationItem,
} from '@/api/notifications';
import { getNotificationTargetPath } from '@utils/notificationNavigation';
import { formatDateTime } from '@utils/formatters';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PaymentIcon from '@mui/icons-material/Payment';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import InfoIcon from '@mui/icons-material/Info';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import './NotificationsPage.css';

const typeMeta: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  APPOINTMENT_REMINDER: { label: 'Lịch hẹn', icon: <CalendarMonthIcon fontSize="small" />, color: '#2563EB' },
  APPOINTMENT_CONFIRMED: { label: 'Lịch hẹn', icon: <CalendarMonthIcon fontSize="small" />, color: '#2563EB' },
  APPOINTMENT_CANCELLED: { label: 'Hủy lịch', icon: <CalendarMonthIcon fontSize="small" />, color: '#DC2626' },
  APPOINTMENT_RESCHEDULED: { label: 'Dời lịch', icon: <CalendarMonthIcon fontSize="small" />, color: '#B45309' },
  PAYMENT_SUCCESS: { label: 'Thanh toán', icon: <PaymentIcon fontSize="small" />, color: '#059669' },
  PAYMENT_REMINDER: { label: 'Thanh toán', icon: <PaymentIcon fontSize="small" />, color: '#D97706' },
  LOW_STOCK_ALERT: { label: 'Tồn kho', icon: <Inventory2Icon fontSize="small" />, color: '#DC2626' },
  LOYALTY_POINTS_EARNED: { label: 'Tích điểm', icon: <LoyaltyIcon fontSize="small" />, color: '#7C3AED' },
  LOYALTY_POINTS_REDEEMED: { label: 'Đổi điểm', icon: <LoyaltyIcon fontSize="small" />, color: '#7C3AED' },
  SYSTEM: { label: 'Hệ thống', icon: <InfoIcon fontSize="small" />, color: '#64748B' },
};

const isRead = (item: NotificationItem) => Boolean(item.read ?? item.isRead);

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getNotifications(false, 100);
      setNotifications(data);
    } catch (err) {
      console.error(err);
      setLoadError('Không thể tải danh sách thông báo. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(
    () => (filter === 'unread' ? notifications.filter((item) => !isRead(item)) : notifications),
    [notifications, filter],
  );
  const unreadCount = useMemo(() => notifications.filter((item) => !isRead(item)).length, [notifications]);

  const handleOpen = async (item: NotificationItem) => {
    if (!isRead(item)) {
      try {
        await markNotificationRead(item.notificationId);
        setNotifications((prev) => prev.map((n) => (
          n.notificationId === item.notificationId ? { ...n, read: true, isRead: true } : n
        )));
      } catch (err) {
        console.error(err);
      }
    }
    const path = getNotificationTargetPath(item);
    if (path) navigate(path);
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (err) {
      console.error(err);
      toast.error('Không thể đánh dấu đã đọc');
    }
  };

  return (
    <main className="notifications-page animate-fadeIn">
      <PageHeader
        title="Thông báo"
        subtitle={loading ? 'Đang tải...' : `${unreadCount} thông báo chưa đọc`}
        extra={
          <div className="notifications-page__actions">
            <ToggleButtonGroup
              value={filter}
              exclusive
              size="small"
              onChange={(_, value) => value && setFilter(value)}
              className="notifications-page__filter"
            >
              <ToggleButton value="all">Tất cả</ToggleButton>
              <ToggleButton value="unread">Chưa đọc</ToggleButton>
            </ToggleButtonGroup>
            <Button
              startIcon={<DoneAllIcon fontSize="small" />}
              onClick={handleMarkAll}
              disabled={unreadCount === 0}
              sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 700 }}
            >
              Đọc tất cả
            </Button>
          </div>
        }
      />

      {loadError && <Alert severity="warning" sx={{ mb: 2, borderRadius: '12px' }}>{loadError}</Alert>}

      <section className="notifications-page__list" aria-label="Danh sách thông báo">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={76} sx={{ borderRadius: '12px' }} />
          ))
        ) : visible.length ? (
          visible.map((item) => {
            const meta = typeMeta[item.notificationType] ?? typeMeta.SYSTEM;
            const read = isRead(item);
            return (
              <button
                key={item.notificationId}
                type="button"
                className={`notifications-page__item${read ? '' : ' notifications-page__item--unread'}`}
                onClick={() => handleOpen(item)}
              >
                <span className="notifications-page__icon" style={{ background: `${meta.color}18`, color: meta.color }} aria-hidden="true">
                  {meta.icon}
                </span>
                <span className="notifications-page__content">
                  <span className="notifications-page__title-row">
                    <strong>{item.title}</strong>
                    <Chip label={meta.label} size="small" sx={{ background: `${meta.color}18`, color: meta.color, fontWeight: 700, fontSize: 11 }} />
                  </span>
                  {item.message && <span className="notifications-page__message">{item.message}</span>}
                  <span className="notifications-page__time">{formatDateTime(item.createdAt)}</span>
                </span>
                {!read && <span className="notifications-page__dot" aria-label="Chưa đọc" />}
              </button>
            );
          })
        ) : (
          <div className="notifications-page__empty" role="status">
            <NotificationsIcon />
            <strong>{filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}</strong>
            <p>Thông báo về lịch hẹn, thanh toán và tồn kho sẽ hiển thị tại đây.</p>
          </div>
        )}
      </section>
    </main>
  );
};

export default NotificationsPage;
