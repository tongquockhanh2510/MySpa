import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import StatusChip from '@components/common/StatusChip';
import type { Customer } from '@/types';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import './CustomersListMobile.css';

interface CustomersListMobileProps {
  rows: Customer[];
  loading: boolean;
  emptyMessage: string;
  onOpenEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onViewNote: (customer: Customer) => void;
}

const CustomersListMobile: React.FC<CustomersListMobileProps> = ({
  rows, loading, emptyMessage, onOpenEdit, onDelete, onViewNote,
}) => {
  if (loading) {
    return (
      <div className="customers-m-list" aria-busy="true" aria-label="Đang tải khách hàng">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={98} />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <p className="customers-m-empty">{emptyMessage}</p>;
  }

  return (
    <div className="customers-m-list">
      {rows.map((row) => (
        <div
          key={row.customerId}
          className="customers-m-card"
          role="button"
          tabIndex={0}
          onClick={() => onOpenEdit(row)}
          onKeyDown={(e) => { if (e.key === 'Enter') onOpenEdit(row); }}
        >
          <div className="customers-m-card__top">
            <div className="customers-m-card__identity">
              <strong title={row.name}>{row.name}</strong>
              <span>{row.phone || 'Chưa có SĐT'}</span>
            </div>
            <StatusChip status={row.gender} type="gender" />
          </div>

          <div className="customers-m-card__meta">
            <Chip label={`${row.loyaltyPoints || 0} điểm`} size="small" className="customers-m-points-chip" />
            {row.note ? (
              <button
                type="button"
                className="customers-m-note-btn"
                onClick={(e) => { e.stopPropagation(); onViewNote(row); }}
              >
                Xem ghi chú
              </button>
            ) : (
              <span className="customers-m-no-note">Không có ghi chú</span>
            )}
          </div>

          <div className="customers-m-card__actions" onClick={(e) => e.stopPropagation()}>
            <IconButton size="small" aria-label="Cập nhật khách hàng" onClick={() => onOpenEdit(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" aria-label="Xóa khách hàng" onClick={() => onDelete(row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CustomersListMobile;
