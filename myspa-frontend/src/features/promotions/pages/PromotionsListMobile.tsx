import React from 'react';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import { formatCurrency, formatDateTime } from '@utils/formatters';
import type { Promotion } from '@/types';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import './PromotionsListMobile.css';

const isLivePromotion = (promotion: Promotion) => {
  const now = Date.now();
  const startsAt = promotion.effective ? new Date(promotion.effective).getTime() : 0;
  const endsAt = promotion.expiration ? new Date(promotion.expiration).getTime() : Number.POSITIVE_INFINITY;
  return promotion.isActive && startsAt <= now && now <= endsAt;
};

interface PromotionsListMobileProps {
  rows: (Promotion & { usedCount?: number; initialQuantity?: number | null })[];
  mode: 'AMOUNT' | 'PERCENT';
  emptyMessage: string;
  onDelete: (promotion: Promotion) => void;
}

const PromotionsListMobile: React.FC<PromotionsListMobileProps> = ({ rows, mode, emptyMessage, onDelete }) => {
  if (!rows.length) {
    return <p className="promotions-m-empty">{emptyMessage}</p>;
  }

  return (
    <div className="promotions-m-list">
      {rows.map((row: any) => {
        const isLive = isLivePromotion(row);
        return (
          <div key={row.promotionId} className="promotions-m-card">
            <div className="promotions-m-card__top">
              <div className="promotions-m-card__identity">
                <strong title={row.name}>{row.name}</strong>
                {row.code && <code className="promotions-m-code">{row.code}</code>}
              </div>
              <Chip
                icon={row.isActive ? <CheckCircleIcon sx={{ fontSize: 14, color: '#059669 !important' }} /> : <CancelIcon sx={{ fontSize: 14, color: '#DC2626 !important' }} />}
                label={row.isActive ? (isLive ? 'Đang chạy' : 'Đã bật') : 'Đã tắt'}
                size="small"
                className={row.isActive ? 'promotions-m-status promotions-m-status--active' : 'promotions-m-status promotions-m-status--off'}
              />
            </div>

            <div className="promotions-m-card__meta">
              <div>
                <span>Mức giảm</span>
                <strong className="promotions-m-discount">
                  {mode === 'AMOUNT' ? `-${formatCurrency(row.discount || 0)}` : `-${row.percent || 0}%`}
                </strong>
              </div>
              <div>
                <span>Đơn tối thiểu</span>
                <strong>{formatCurrency(row.minOrderValue || 0)}</strong>
              </div>
              {mode === 'PERCENT' && (
                <div>
                  <span>Giảm tối đa</span>
                  <strong>{formatCurrency(row.maxDiscount || 0)}</strong>
                </div>
              )}
              <div>
                <span>Đã dùng</span>
                <strong>{row.usedCount || 0}/{row.initialQuantity == null ? '∞' : row.initialQuantity}</strong>
              </div>
            </div>

            {(row.effective || row.expiration) && (
              <div className="promotions-m-card__dates">
                {row.effective && <span>Từ {formatDateTime(row.effective)}</span>}
                {row.expiration && <span>Đến {formatDateTime(row.expiration)}</span>}
              </div>
            )}

            <div className="promotions-m-card__actions">
              <IconButton size="small" aria-label="Xóa khuyến mãi" onClick={() => onDelete(row)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PromotionsListMobile;
