import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import type { User } from '@/types';
import ShieldIcon from '@mui/icons-material/Shield';
import LockResetIcon from '@mui/icons-material/LockReset';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import DeleteIcon from '@mui/icons-material/Delete';
import './UsersListMobile.css';

interface UsersListMobileProps {
  rows: User[];
  loading: boolean;
  emptyMessage: string;
  onOpenRoles: (user: User) => void;
  onResetPassword: (user: User) => void;
  onActivate: (user: User) => void;
  onDeactivate: (user: User) => void;
}

const UsersListMobile: React.FC<UsersListMobileProps> = ({
  rows, loading, emptyMessage, onOpenRoles, onResetPassword, onActivate, onDeactivate,
}) => {
  if (loading) {
    return (
      <div className="users-m-list" aria-busy="true" aria-label="Đang tải người dùng">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={128} />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <p className="users-m-empty">{emptyMessage}</p>;
  }

  return (
    <div className="users-m-list">
      {rows.map((row: any) => (
        <div key={row.userId} className="users-m-card">
          <div className="users-m-card__top">
            <div className="users-m-card__identity">
              <strong title={row.userName}>{row.userName}</strong>
              <span title={row.employeeName}>{row.employeeName}</span>
            </div>
            <Chip
              label={row.isActive === false ? 'Vô hiệu hóa' : 'Hoạt động'}
              size="small"
              className={row.isActive === false ? 'users-m-status users-m-status--off' : 'users-m-status users-m-status--active'}
            />
          </div>

          <div className="users-m-card__roles">
            {(row.roles || []).map((role: any) => (
              <Chip key={role.name} label={role.description || role.name} size="small" className="users-m-role-chip" />
            ))}
          </div>

          <div className="users-m-card__actions">
            <Tooltip title="Gán vai trò" arrow>
              <IconButton size="small" aria-label="Gán vai trò" onClick={() => onOpenRoles(row)} sx={{ color: 'var(--primary)' }}>
                <ShieldIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Đặt lại mật khẩu" arrow>
              <IconButton size="small" aria-label="Đặt lại mật khẩu" onClick={() => onResetPassword(row)} sx={{ color: '#2563EB' }}>
                <LockResetIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {row.isActive === false ? (
              <Tooltip title="Kích hoạt lại" arrow>
                <IconButton size="small" aria-label="Kích hoạt lại" onClick={() => onActivate(row)} sx={{ color: '#059669' }}>
                  <HowToRegIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Vô hiệu hóa" arrow>
                <IconButton size="small" aria-label="Vô hiệu hóa người dùng" onClick={() => onDeactivate(row)} sx={{ color: '#EF4444' }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UsersListMobile;
