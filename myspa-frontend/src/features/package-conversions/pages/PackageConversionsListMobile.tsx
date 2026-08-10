import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import { formatCurrency, formatDate, getConversionTypeLabel } from '@utils/formatters';
import { ConversionType } from '@/types';
import type { PackageConversion } from '@/types';
import './PackageConversionsListMobile.css';

const conversionLabels: Record<ConversionType, string> = {
  [ConversionType.TO_SERVICE]: 'Đổi sang dịch vụ',
  [ConversionType.TO_PRODUCT]: 'Đổi sang sản phẩm',
  [ConversionType.TO_DISCOUNT]: 'Đổi thành tiền giảm đơn hàng',
  [ConversionType.TO_PACKAGE]: 'Đổi sang gói liệu trình khác',
};

interface PackageConversionsListMobileProps {
  rows: PackageConversion[];
  loading: boolean;
  emptyMessage: string;
}

const outcomeLabel = (row: any) => {
  if (row.targetPackageName) return `${row.targetPackageName}${row.convertedSessions ? ` - ${row.convertedSessions} buổi` : ''}`;
  if (row.targetProductName) return row.targetProductName;
  if (row.voucherCode) return row.voucherCode;
  return '—';
};

const PackageConversionsListMobile: React.FC<PackageConversionsListMobileProps> = ({ rows, loading, emptyMessage }) => {
  if (loading) {
    return (
      <div className="conversions-m-list" aria-busy="true" aria-label="Đang tải chuyển đổi">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={128} />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <p className="conversions-m-empty">{emptyMessage}</p>;
  }

  return (
    <div className="conversions-m-list">
      {rows.map((row: any) => {
        const isProduct = row.conversionType === ConversionType.TO_PRODUCT;
        const topUp = Number(row.topUpAmount || 0);

        return (
          <div key={row.conversionId} className="conversions-m-card">
            <div className="conversions-m-card__top">
              <strong title={row.customerName}>{row.customerName}</strong>
              <Chip
                label={conversionLabels[row.conversionType as ConversionType] || getConversionTypeLabel(row.conversionType)}
                size="small"
                className={isProduct ? 'conversions-m-chip conversions-m-chip--green' : 'conversions-m-chip'}
              />
            </div>
            <p className="conversions-m-card__package">{row.packageName}</p>

            <div className="conversions-m-card__meta">
              <div>
                <span>Giá trị</span>
                <strong>{formatCurrency(row.conversionValue || 0)}</strong>
              </div>
              <div>
                <span>Kết quả</span>
                <strong title={outcomeLabel(row)}>{outcomeLabel(row)}</strong>
              </div>
              {row.orderId != null && (
                <div>
                  <span>Tiền bù</span>
                  {topUp > 0 ? <strong>{formatCurrency(topUp)}</strong> : <Chip label="Đã trừ đủ" size="small" className="conversions-m-chip conversions-m-chip--green" />}
                </div>
              )}
              <div>
                <span>Ngày chuyển đổi</span>
                <strong>{formatDate(row.conversionDate)}</strong>
              </div>
            </div>

            {row.note && <p className="conversions-m-card__note">{row.note}</p>}
          </div>
        );
      })}
    </div>
  );
};

export default PackageConversionsListMobile;
