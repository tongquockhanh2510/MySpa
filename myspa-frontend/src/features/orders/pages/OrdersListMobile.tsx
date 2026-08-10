import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import StatusChip from '@components/common/StatusChip';
import { formatCurrency, formatDateTime } from '@utils/formatters';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import ReplayIcon from '@mui/icons-material/Replay';
import './OrdersListMobile.css';

interface OrdersListMobileProps {
  rows: any[];
  loading: boolean;
  emptyMessage: string;
  canRefund: boolean;
  refundingId: string | null;
  onViewDetail: (order: any) => void;
  onPay: (order: any) => void;
  onRefund: (order: any) => void;
}

const OrdersListMobile: React.FC<OrdersListMobileProps> = ({
  rows, loading, emptyMessage, canRefund, refundingId,
  onViewDetail, onPay, onRefund,
}) => {
  if (loading) {
    return (
      <div className="orders-m-list" aria-busy="true" aria-label="Đang tải đơn hàng">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={128} />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <p className="orders-m-empty">{emptyMessage}</p>;
  }

  return (
    <div className="orders-m-list">
      {rows.map((row) => {
        const canPay = Number(row.remainingAmount) > 0 && row.orderStatus !== 'CANCELLED';
        const canDoRefund = canRefund && ['PAID', 'COMPLETED', 'PARTIALLY_PAID'].includes(row.orderStatus);

        return (
          <div
            key={row.orderId}
            className="orders-m-card"
            role="button"
            tabIndex={0}
            onClick={() => onViewDetail(row)}
            onKeyDown={(e) => { if (e.key === 'Enter') onViewDetail(row); }}
          >
            <div className="orders-m-card__top">
              <strong>{row.displayCode || row.orderId}</strong>
              <StatusChip status={row.orderStatus} type="order" />
            </div>
            <div className="orders-m-card__customer" title={row.customerName || 'Khách lẻ'}>
              {row.customerName || 'Khách lẻ'}
            </div>

            <div className="orders-m-card__amounts">
              <div>
                <span>Tổng tiền</span>
                <strong>{formatCurrency(row.totalAmount || 0)}</strong>
              </div>
              <div>
                <span>Đã thanh toán</span>
                <strong className="orders-m-card__amount--paid">{formatCurrency(row.paidAmount || 0)}</strong>
              </div>
              <div>
                <span>Còn lại</span>
                <strong className={Number(row.remainingAmount) > 0 ? 'orders-m-card__amount--due' : 'orders-m-card__amount--paid'}>
                  {formatCurrency(row.remainingAmount || 0)}
                </strong>
              </div>
            </div>

            <div className="orders-m-card__date">{formatDateTime(row.createdAt)}</div>

            <div className="orders-m-card__actions" onClick={(e) => e.stopPropagation()}>
              <Button size="small" variant="outlined" startIcon={<ReceiptIcon fontSize="small" />}
                onClick={() => onViewDetail(row)}
                sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12, fontWeight: 700 }}>
                Chi tiết
              </Button>
              {canPay && (
                <Button size="small" variant="contained" startIcon={<PaymentIcon fontSize="small" />}
                  onClick={() => onPay(row)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12, fontWeight: 700, background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#fff' }}>
                  Thanh toán
                </Button>
              )}
              {canDoRefund && (
                <Button size="small" variant="outlined" color="error" disabled={refundingId === row.orderId}
                  startIcon={<ReplayIcon fontSize="small" />}
                  onClick={() => onRefund(row)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12, fontWeight: 700 }}>
                  {refundingId === row.orderId ? 'Đang hoàn...' : 'Hoàn đơn'}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrdersListMobile;
