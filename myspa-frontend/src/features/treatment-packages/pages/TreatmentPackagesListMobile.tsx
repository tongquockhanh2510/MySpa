import React from 'react';
import IconButton from '@mui/material/IconButton';
import StatusChip from '@components/common/StatusChip';
import { formatCurrency } from '@utils/formatters';
import type { TreatmentPackage } from '@/types';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import './TreatmentPackagesListMobile.css';

interface TreatmentPackagesListMobileProps {
  rows: TreatmentPackage[];
  emptyMessage: string;
  onOpenEdit: (pack: TreatmentPackage) => void;
  onDelete: (pack: TreatmentPackage) => void;
}

const TreatmentPackagesListMobile: React.FC<TreatmentPackagesListMobileProps> = ({
  rows, emptyMessage, onOpenEdit, onDelete,
}) => {
  if (!rows.length) {
    return <p className="packages-m-empty">{emptyMessage}</p>;
  }

  return (
    <div className="packages-m-list">
      {rows.map((row) => (
        <div
          key={row.treatmentPackageId}
          className="packages-m-card"
          role="button"
          tabIndex={0}
          onClick={() => onOpenEdit(row)}
          onKeyDown={(e) => { if (e.key === 'Enter') onOpenEdit(row); }}
        >
          <div className="packages-m-card__top">
            <strong title={row.packageName}>{row.packageName}</strong>
            <StatusChip status={row.statusOfPakage} type="package" />
          </div>

          {row.description && <p className="packages-m-card__desc">{row.description}</p>}

          <div className="packages-m-card__meta">
            <div>
              <span>Số buổi</span>
              <strong>{row.totalSessions}</strong>
            </div>
            <div>
              <span>Giá gói</span>
              <strong className="packages-m-card__price">{formatCurrency(row.packagePrice)}</strong>
            </div>
          </div>

          <div className="packages-m-card__actions" onClick={(e) => e.stopPropagation()}>
            <IconButton size="small" aria-label="Cập nhật gói liệu trình" onClick={() => onOpenEdit(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" aria-label="Xóa gói liệu trình" onClick={() => onDelete(row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TreatmentPackagesListMobile;
