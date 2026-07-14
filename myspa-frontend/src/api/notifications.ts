import axiosInstance from './axiosInstance';

export interface NotificationItem {
  notificationId: string;
  notificationType: string;
  title: string;
  message?: string;
  referenceId?: string;
  referenceType?: string;
  read: boolean;
  isRead?: boolean;
  readAt?: string;
  createdAt: string;
  customerName?: string;
  employeeName?: string;
}

export const getNotifications = async (unreadOnly = false, size = 50): Promise<NotificationItem[]> => {
  const response = await axiosInstance.get('/notifications', { params: { unreadOnly, size } });
  return response.data.result || [];
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const response = await axiosInstance.get('/notifications/unread-count');
  return Number(response.data.result?.count || 0);
};

export const markNotificationRead = async (id: string) => {
  const response = await axiosInstance.put(`/notifications/${id}/read`);
  return response.data.result;
};

export const markAllNotificationsRead = async () => {
  const response = await axiosInstance.put('/notifications/read-all');
  return response.data.result;
};
