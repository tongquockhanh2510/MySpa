import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import StatusChip from '@components/common/StatusChip';
import { formatCurrency } from '@utils/formatters';
import type { Employee } from '@/types';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyIcon from '@mui/icons-material/Key';
import './EmployeesListMobile.css';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Chủ spa',
  MANAGER: 'Quản lý',
  RECEPTIONIST: 'Lễ tân',
  THERAPIST: 'Kỹ thuật viên',
  STAFF: 'Nhân viên',
};

interface EmployeesListMobileProps {
  rows: Employee[];
  loading: boolean;
  emptyMessage: string;
  canManage: boolean;
  isAdmin: boolean;
  onOpenEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onCreateAccount: (employee: Employee) => void;
}

const EmployeesListMobile: React.FC<EmployeesListMobileProps> = ({
  rows, loading, emptyMessage, canManage, isAdmin, onOpenEdit, onDelete, onCreateAccount,
}) => {
  if (loading) {
    return (
      <div className="employees-m-list" aria-busy="true" aria-label="Đang tải nhân viên">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={120} />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <p className="employees-m-empty">{emptyMessage}</p>;
  }

  return (
    <div className="employees-m-list">
      {rows.map((row: any) => (
        <div
          key={row.employeeId}
          className="employees-m-card"
          role="button"
          tabIndex={0}
          onClick={() => onOpenEdit(row)}
          onKeyDown={(e) => { if (e.key === 'Enter') onOpenEdit(row); }}
        >
          <div className="employees-m-card__top">
            <div className="employees-m-card__identity">
              <strong title={row.name}>{row.name}</strong>
              <span>{row.phone}</span>
            </div>
            <StatusChip status={row.statusOfEmployee} type="employee" />
          </div>

          <div className="employees-m-card__meta">
            <span title={row.email}>{row.email}</span>
            <span>{row.position}</span>
            <strong>{formatCurrency(row.baseSalary || 0)}</strong>
          </div>

          <div className="employees-m-card__account">
            {row.accountUserName ? (
              <div className="employees-m-account-info">
                <strong>{row.accountUserName}{row.accountActive === false ? ' (khóa)' : ''}</strong>
                <span>{(row.accountRoles || []).map((role: string) => ROLE_LABELS[role] || role).join(', ')}</span>
              </div>
            ) : isAdmin ? (
              <Button
                size="small"
                startIcon={<KeyIcon fontSize="small" />}
                onClick={(e) => { e.stopPropagation(); onCreateAccount(row); }}
                sx={{ borderRadius: '8px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 700, fontSize: 12 }}
              >
                Cấp tài khoản
              </Button>
            ) : (
              <span className="employees-m-no-account">Chưa có tài khoản</span>
            )}

            {canManage && (
              <div className="employees-m-card__actions" onClick={(e) => e.stopPropagation()}>
                <IconButton size="small" aria-label="Cập nhật nhân viên" onClick={() => onOpenEdit(row)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" aria-label="Xóa nhân viên" onClick={() => onDelete(row)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmployeesListMobile;
