import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import { formatDate } from '@utils/formatters';
import './CustomerTreatmentsListMobile.css';

interface CustomerTreatmentsListMobileProps {
  rows: any[];
  loading: boolean;
  emptyMessage: string;
  onOpenDetail: (row: any) => void;
}

const CustomerTreatmentsListMobile: React.FC<CustomerTreatmentsListMobileProps> = ({
  rows, loading, emptyMessage, onOpenDetail,
}) => {
  if (loading) {
    return (
      <div className="treatments-m-list" aria-busy="true" aria-label="Đang tải liệu trình">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={140} />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <p className="treatments-m-empty">{emptyMessage}</p>;
  }

  return (
    <div className="treatments-m-list">
      {rows.map((row) => {
        const total = row.totalSessions || 10;
        const remaining = row.remainingSessions;
        const used = row.consumedSessions ?? (total - remaining);
        const reserved = row.reservedSessions ?? 0;
        const available = row.availableSessions ?? Math.max(0, remaining - reserved);
        const pct = Math.max(0, Math.min(100, (used / total) * 100));

        return (
          <div key={`${row.customerId}-${row.packageId}`} className="treatments-m-card">
            <div className="treatments-m-card__top">
              <strong title={row.customerName}>{row.customerName}</strong>
              <span>{row.customerPhone || 'Chưa có SĐT'}</span>
            </div>
            <p className="treatments-m-card__package">{row.packageName}</p>

            <div className="treatments-m-card__progress">
              <span>Đã dùng {used}/{total} · Đã đặt {reserved} · Còn tự do {available}</span>
              <LinearProgress variant="determinate" value={pct} className="treatments-m-progress-bar" />
            </div>

            <div className="treatments-m-card__dates">
              <span>Mua: {formatDate(row.purchaseDate)}</span>
              <span>Hết hạn: {formatDate(row.expiryDate)}</span>
            </div>

            <Button
              size="small"
              fullWidth
              variant="outlined"
              onClick={() => onOpenDetail(row)}
              sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12.5, fontWeight: 700, mt: 1.25 }}
            >
              Lịch trình
            </Button>
          </div>
        );
      })}
    </div>
  );
};

export default CustomerTreatmentsListMobile;
