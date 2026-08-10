import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import StatusChip from '@components/common/StatusChip';
import { formatDateTime } from '@utils/formatters';
import { StatusOfAppointment } from '@/types';
import type { Appointment } from '@/types';
import { lifecycleTargets, type LifecycleAction } from './AppointmentsPage';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import './AppointmentsListMobile.css';

interface AppointmentsListMobileProps {
  rows: Appointment[];
  loading: boolean;
  emptyMessage: string;
  activeAction: string | null;
  onOpenDetail: (appointmentId: string) => void;
  onOpenMore: (event: React.MouseEvent<HTMLElement>, appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
  canCancel: (appointment: Appointment) => boolean;
  canTransition: (appointment: Appointment, target: StatusOfAppointment) => boolean;
  invalidTransitionMessage: (appointment: Appointment, target: StatusOfAppointment) => string;
  onLifecycleAction: (appointment: Appointment, action: LifecycleAction) => void;
}

// Chi 1 hanh dong "tiep theo" chinh duoc goi y tren the mobile (cac hanh dong con lai
// nam trong menu "Them thao tac" de tranh the qua nhieu nut).
const nextActionByStatus: Partial<Record<StatusOfAppointment, LifecycleAction>> = {
  [StatusOfAppointment.PENDING]: 'confirm',
  [StatusOfAppointment.CONFIRMED]: 'checkIn',
  [StatusOfAppointment.CHECKED_IN]: 'start',
  [StatusOfAppointment.WAITING]: 'start',
  [StatusOfAppointment.IN_PROGRESS]: 'complete',
};

const nextActionLabel: Record<LifecycleAction, string> = {
  confirm: 'Xác nhận',
  checkIn: 'Check-in',
  wait: 'Chuyển sang đang chờ',
  start: 'Bắt đầu',
  complete: 'Hoàn thành',
  noShow: 'Không đến',
  reschedule: 'Dời lịch',
};

const isPastOrDone = (row: Appointment) => {
  const isDone = row.statusOfAppointment === StatusOfAppointment.COMPLETED;
  const isPast = new Date(row.dateTime).getTime() < Date.now()
    && ![StatusOfAppointment.CANCELLED, StatusOfAppointment.NO_SHOW].includes(row.statusOfAppointment);
  return isDone || isPast;
};

const AppointmentsListMobile: React.FC<AppointmentsListMobileProps> = ({
  rows, loading, emptyMessage, activeAction,
  onOpenDetail, onOpenMore, onDelete, canCancel,
  canTransition, invalidTransitionMessage, onLifecycleAction,
}) => {
  if (loading) {
    return (
      <div className="appointments-m-list" aria-busy="true" aria-label="Đang tải lịch hẹn">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={104} />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <p className="appointments-m-empty">{emptyMessage}</p>;
  }

  return (
    <div className="appointments-m-list">
      {rows.map((row) => {
        const serviceNames = (row.details || []).map((d: any) => d.serviceName).filter(Boolean);
        const serviceLabel = serviceNames.length > 1
          ? `${serviceNames[0]} +${serviceNames.length - 1}`
          : (serviceNames[0] || '—');
        const nextAction = nextActionByStatus[row.statusOfAppointment];
        const target = nextAction ? lifecycleTargets[nextAction] : null;
        const allowed = nextAction && target ? canTransition(row, target) : false;
        const disabled = !allowed || activeAction !== null;

        return (
          <div
            key={row.appointmentId}
            className={`appointments-m-card${isPastOrDone(row) ? ' appointments-m-card--past' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => onOpenDetail(row.appointmentId)}
            onKeyDown={(e) => { if (e.key === 'Enter') onOpenDetail(row.appointmentId); }}
          >
            <div className="appointments-m-card__top">
              <div className="appointments-m-card__customer">
                <strong title={row.customerName}>{row.customerName}</strong>
                <span>{row.customerPhone}</span>
              </div>
              <StatusChip status={row.statusOfAppointment} type="appointment" />
            </div>

            <div className="appointments-m-card__meta">
              <span>{formatDateTime(row.dateTime)}</span>
              <span title={serviceNames.join(', ')}>{serviceLabel}</span>
            </div>

            <div className="appointments-m-card__actions" onClick={(e) => e.stopPropagation()}>
              {nextAction && target && (
                <Tooltip title={allowed ? nextActionLabel[nextAction] : invalidTransitionMessage(row, target)} arrow>
                  <span>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={disabled}
                      onClick={() => onLifecycleAction(row, nextAction)}
                      sx={{ borderRadius: '8px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 700, fontSize: 12 }}
                    >
                      {nextActionLabel[nextAction]}
                    </Button>
                  </span>
                </Tooltip>
              )}
              <Tooltip title="Hủy lịch hẹn" arrow>
                <span>
                  <IconButton
                    size="small"
                    aria-label="Hủy lịch hẹn"
                    disabled={!canCancel(row) || activeAction !== null}
                    onClick={() => onDelete(row)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <IconButton size="small" aria-label="Thêm thao tác" onClick={(event) => onOpenMore(event, row)}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AppointmentsListMobile;
