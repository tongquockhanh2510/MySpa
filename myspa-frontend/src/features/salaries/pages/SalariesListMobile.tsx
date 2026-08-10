import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import { formatCurrency } from '@utils/formatters';
import type { EmployeeSalary } from '@/api/salaries';
import './SalariesListMobile.css';

const payrollStatusLabel = (status: string) => (status === 'PAID' ? 'Đã chi' : status === 'LOCKED' ? 'Đã chốt' : 'Nháp');

interface SalariesListMobileProps {
  rows: EmployeeSalary[];
  loading: boolean;
  emptyMessage: string;
  canViewCompanyPayroll: boolean;
  onOpenCommission: (row: EmployeeSalary) => void;
  onOpenPayroll: (row: EmployeeSalary) => void;
}

const SalariesListMobile: React.FC<SalariesListMobileProps> = ({
  rows, loading, emptyMessage, canViewCompanyPayroll, onOpenCommission, onOpenPayroll,
}) => {
  if (loading) {
    return (
      <div className="salaries-m-list" aria-busy="true" aria-label="Đang tải bảng lương">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={148} />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <p className="salaries-m-empty">{emptyMessage}</p>;
  }

  return (
    <div className="salaries-m-list">
      {rows.map((row) => (
        <div key={row.employeeId} className="salaries-m-card">
          <div className="salaries-m-card__top">
            <div className="salaries-m-card__identity">
              <strong title={row.employeeName}>{row.employeeName}</strong>
              <span>{row.position || '—'}</span>
            </div>
            <Button
              size="small"
              disabled={!canViewCompanyPayroll || row.payrollStatus === 'PAID'}
              onClick={() => onOpenPayroll(row)}
              sx={{ textTransform: 'none', fontSize: 11.5, fontWeight: 700, flexShrink: 0 }}
            >
              {payrollStatusLabel(row.payrollStatus)}
            </Button>
          </div>

          <div className="salaries-m-card__meta">
            <div>
              <span>Lương cơ bản</span>
              <strong>{formatCurrency(row.baseSalary || 0)}</strong>
            </div>
            <div>
              <span>Thưởng</span>
              <strong>{formatCurrency(row.bonus || 0)}</strong>
            </div>
            <div>
              <span>Phạt</span>
              <strong>{formatCurrency(row.penalty || 0)}</strong>
            </div>
            <div>
              <span>Đã ứng</span>
              <strong>{formatCurrency(row.salaryAdvance || 0)}</strong>
            </div>
          </div>

          <div className="salaries-m-card__bottom">
            <button
              type="button"
              className="salaries-m-commission-btn"
              disabled={!row.totalCommission}
              onClick={() => onOpenCommission(row)}
            >
              Hoa hồng: {formatCurrency(row.totalCommission || 0)}
              {row.commissionCount > 0 && <span> ({row.commissionCount})</span>}
            </button>
            <div className="salaries-m-total">
              <span>Tổng thực lĩnh</span>
              <strong>{formatCurrency(row.totalSalary || 0)}</strong>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SalariesListMobile;
