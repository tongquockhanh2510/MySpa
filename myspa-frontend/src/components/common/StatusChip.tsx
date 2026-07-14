import React from 'react';
import Chip from '@mui/material/Chip';
import {
  getAppointmentStatusLabel,
  getConversionTypeLabel,
  getEmployeeStatusLabel,
  getGenderLabel,
  getOrderStatusLabel,
  getOrderTypeLabel,
  getPackageStatusLabel,
  getServiceStatusLabel,
} from '@utils/formatters';

type StatusType =
  | 'appointment'
  | 'employee'
  | 'order'
  | 'service'
  | 'package'
  | 'gender'
  | 'orderType'
  | 'conversionType';

const appointmentColors: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: '#FEF3C7', color: '#D97706' },
  CONFIRMED: { bg: '#DBEAFE', color: '#2563EB' },
  CHECKED_IN: { bg: '#CCFBF1', color: '#0F766E' },
  WAITING: { bg: '#FDE68A', color: '#B45309' },
  IN_PROGRESS: { bg: '#EDE9FE', color: '#7C3AED' },
  COMPLETED: { bg: '#D1FAE5', color: '#059669' },
  CANCELLED: { bg: '#FEE2E2', color: '#DC2626' },
  NO_SHOW: { bg: '#F3F4F6', color: '#4B5563' },
  RESCHEDULED: { bg: '#E0E7FF', color: '#4338CA' },
};

const employeeColors: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: '#D1FAE5', color: '#059669' },
  INACTIVE: { bg: '#FEE2E2', color: '#DC2626' },
};

const orderColors: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: '#F3F4F6', color: '#6B7280' },
  UNPAID: { bg: '#FEE2E2', color: '#DC2626' },
  PENDING_PAYMENT: { bg: '#FEE2E2', color: '#DC2626' },
  PARTIALLY_PAID: { bg: '#FEF3C7', color: '#D97706' },
  PAID: { bg: '#D1FAE5', color: '#059669' },
  CANCELLED: { bg: '#F3F4F6', color: '#6B7280' },
};

const serviceColors: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: '#D1FAE5', color: '#059669' },
  INACTIVE: { bg: '#F3F4F6', color: '#6B7280' },
  NOT_STARTED: { bg: '#F3F4F6', color: '#6B7280' },
  IN_PROGRESS: { bg: '#EDE9FE', color: '#7C3AED' },
  COMPLETED: { bg: '#D1FAE5', color: '#059669' },
  EXPIRED: { bg: '#FEE2E2', color: '#DC2626' },
  CANCELLED: { bg: '#FEE2E2', color: '#DC2626' },
};

interface StatusChipProps {
  status: string;
  type: StatusType;
  size?: 'small' | 'medium';
}

const StatusChip: React.FC<StatusChipProps> = ({ status, type, size = 'small' }) => {
  let label = status;
  let style = { bg: '#F3F4F6', color: '#6B7280' };

  switch (type) {
    case 'appointment':
      label = getAppointmentStatusLabel(status);
      style = appointmentColors[status] ?? style;
      break;
    case 'employee':
      label = getEmployeeStatusLabel(status);
      style = employeeColors[status] ?? style;
      break;
    case 'order':
      label = getOrderStatusLabel(status);
      style = orderColors[status] ?? style;
      break;
    case 'service':
      label = getServiceStatusLabel(status);
      style = serviceColors[status] ?? style;
      break;
    case 'package':
      label = getPackageStatusLabel(status);
      style = serviceColors[status] ?? style;
      break;
    case 'gender':
      label = getGenderLabel(status);
      break;
    case 'orderType':
      label = getOrderTypeLabel(status);
      break;
    case 'conversionType':
      label = getConversionTypeLabel(status);
      break;
  }

  return (
    <Chip
      label={label}
      size={size}
      sx={{
        background: style.bg,
        color: style.color,
        fontWeight: 600,
        fontSize: size === 'small' ? 11.5 : 13,
        height: size === 'small' ? 24 : 28,
        borderRadius: '8px',
        border: 'none',
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
};

export default StatusChip;
