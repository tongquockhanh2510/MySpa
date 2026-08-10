import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import StatusChip from '@components/common/StatusChip';
import { formatCurrency, formatDuration } from '@utils/formatters';
import type { Service } from '@/types';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import './ServicesListMobile.css';

interface ServicesListMobileProps {
  rows: (Service & { categoryName?: string })[];
  loading: boolean;
  emptyMessage: string;
  canManage: boolean;
  onOpenEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}

const ServicesListMobile: React.FC<ServicesListMobileProps> = ({
  rows, loading, emptyMessage, canManage, onOpenEdit, onDelete,
}) => {
  if (loading) {
    return (
      <div className="services-m-list" aria-busy="true" aria-label="Đang tải dịch vụ">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={116} />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <p className="services-m-empty">{emptyMessage}</p>;
  }

  return (
    <div className="services-m-list">
      {rows.map((row: any) => {
        const cost = Number(row.costPrice || 0);
        const price = Number(row.price || 0);
        const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;

        return (
          <div
            key={row.serviceId}
            className="services-m-card"
            role="button"
            tabIndex={0}
            onClick={() => onOpenEdit(row)}
            onKeyDown={(e) => { if (e.key === 'Enter') onOpenEdit(row); }}
          >
            <div className="services-m-card__top">
              <div className="services-m-card__identity">
                <strong title={row.name}>{row.name}</strong>
                <span>{row.categoryName || 'Chưa phân loại'}</span>
              </div>
              <StatusChip status={row.statusOfService} type="service" />
            </div>

            <div className="services-m-card__meta">
              <div>
                <span>Giá bán</span>
                <strong className="services-m-card__price">{formatCurrency(price)}</strong>
              </div>
              <div>
                <span>Tiền vốn</span>
                <strong>{formatCurrency(cost)}{cost > 0 && <small style={{ color: margin >= 0 ? 'var(--success)' : 'var(--error)' }}> ({margin}%)</small>}</strong>
              </div>
              <div>
                <span>Thời lượng</span>
                <strong>{formatDuration(row.duration)}</strong>
              </div>
              <div>
                <span>Hoa hồng</span>
                <strong>{row.commissionRate}%</strong>
              </div>
            </div>

            {canManage && (
              <div className="services-m-card__actions" onClick={(e) => e.stopPropagation()}>
                <IconButton size="small" aria-label="Cập nhật dịch vụ" onClick={() => onOpenEdit(row)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" aria-label="Xóa dịch vụ" onClick={() => onDelete(row)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ServicesListMobile;
