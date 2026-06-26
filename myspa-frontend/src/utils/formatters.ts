import { CURRENCY } from '@constants/config';

// ===== Currency Formatter =====
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('vi-VN').format(value);
};

// ===== Date Formatters =====
export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatMonth = (month: number, year: number): string => {
  return `Tháng ${month}/${year}`;
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
};

// ===== Status Labels =====
export const getAppointmentStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    IN_PROGRESS: 'Đang thực hiện',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  };
  return map[status] ?? status;
};

export const getEmployeeStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    ACTIVE: 'Đang làm việc',
    INACTIVE: 'Đã nghỉ việc',
  };
  return map[status] ?? status;
};

export const getOrderStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    UNPAID: 'Chưa thanh toán',
    PARTIALLY_PAIN: 'Thanh toán một phần',
    PAIN: 'Đã thanh toán',
    CANCELLED: 'Đã hủy',
  };
  return map[status] ?? status;
};

export const getOrderTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    PRODUCT_ORDER: 'Bán sản phẩm',
    SERVICE_ORDER: 'Dịch vụ',
    CONVERT_FROM_PACKAGE: 'Chuyển đổi gói',
  };
  return map[type] ?? type;
};

export const getServiceStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    ACTIVE: 'Đang hoạt động',
    INACTIVE: 'Ngừng hoạt động',
  };
  return map[status] ?? status;
};

export const getPackageStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    ACTIVE: 'Đang áp dụng',
    INACTIVE: 'Ngừng áp dụng',
  };
  return map[status] ?? status;
};

export const getGenderLabel = (gender: string): string => {
  const map: Record<string, string> = {
    MALE: 'Nam',
    FEMALE: 'Nữ',
    OTHER: 'Khác',
  };
  return map[gender] ?? gender;
};

export const getConversionTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    TO_SERVICE: 'Chuyển sang dịch vụ',
    TO_PRODUCT: 'Chuyển sang sản phẩm',
    TO_DISCOUNT: 'Chuyển thành tiền giảm đơn hàng',
    TO_PACKAGE: 'Chuyển sang gói liệu trình khác',
  };
  return map[type] ?? type;
};

// ===== Misc =====
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
