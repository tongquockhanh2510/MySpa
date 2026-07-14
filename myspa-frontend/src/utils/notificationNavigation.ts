import { ROUTES } from '@constants/routes';
import type { NotificationItem } from '@/api/notifications';

export const getNotificationTargetPath = (item: NotificationItem): string | null => {
  const referenceType = item.referenceType?.toUpperCase();
  const referenceId = item.referenceId;

  if (!referenceType || !referenceId) return null;

  switch (referenceType) {
    case 'APPOINTMENT':
      return `${ROUTES.APPOINTMENTS}?appointmentId=${encodeURIComponent(referenceId)}`;
    case 'ORDER':
      return `${ROUTES.ORDERS}?orderId=${encodeURIComponent(referenceId)}`;
    case 'PRODUCT':
      return `${ROUTES.PRODUCTS}?productId=${encodeURIComponent(referenceId)}`;
    case 'CUSTOMER':
      return `${ROUTES.CUSTOMERS}?customerId=${encodeURIComponent(referenceId)}`;
    default:
      return null;
  }
};
