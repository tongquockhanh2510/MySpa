import React from 'react';
import Chip from '@mui/material/Chip';
import {
  getAppointmentStatusLabel,
  getEmployeeStatusLabel,
  getOrderStatusLabel,
  getServiceStatusLabel,
  getPackageStatusLabel,
  getGenderLabel,
  getOrderTypeLabel,
  getConversionTypeLabel,
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
  IN_PROGRESS: { bg: '#EDE9FE', color: '#7C3AED' },
  COMPLETED: { bg: '#D1FAE5', color: '#059669' },
  CANCELLED: { bg: '#FEE2E2', color: '#DC2626' },
};

const employeeColors: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: '#D1FAE5', color: '#059669' },
  INACTIVE: { bg: '#FEE2E2', color: '#DC2626' },
};

const orderColors: Record<string, { bg: string; color: string }> = {
  UNPAID: { bg: '#FEE2E2', color: '#DC2626' },
  PARTIALLY_PAIN: { bg: '#FEF3C7', color: '#D97706' },
  PAIN: { bg: '#D1FAE5', color: '#059669' },
  CANCELLED: { bg: '#F3F4F6', color: '#6B7280' },
};

const serviceColors: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: '#D1FAE5', color: '#059669' },
  INACTIVE: { bg: '#F3F4F6', color: '#6B7280' },
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
