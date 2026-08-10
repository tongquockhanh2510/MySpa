import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import type { Role } from '@/types';
import './RolesListMobile.css';

interface RolesListMobileProps {
  rows: (Role & { permissionCount: number; userCount: number })[];
  loading: boolean;
  emptyMessage: string;
}

const RolesListMobile: React.FC<RolesListMobileProps> = ({ rows, loading, emptyMessage }) => {
  if (loading) {
    return (
      <div className="roles-m-list" aria-busy="true" aria-label="Đang tải vai trò">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={132} />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <p className="roles-m-empty">{emptyMessage}</p>;
  }

  return (
    <div className="roles-m-list">
      {rows.map((row) => (
        <div key={row.name} className="roles-m-card">
          <div className="roles-m-card__top">
            <strong>{row.name}</strong>
            <div className="roles-m-card__counts">
              <span>{row.userCount} người dùng</span>
              <span>{row.permissionCount} quyền</span>
            </div>
          </div>
          {row.description && <p className="roles-m-card__desc">{row.description}</p>}
          <div className="roles-m-card__permissions">
            {row.permissions.slice(0, 6).map((permission) => (
              <Chip key={permission.name} label={permission.name} size="small" className="roles-m-permission-chip" />
            ))}
            {row.permissions.length > 6 && (
              <Chip label={`+${row.permissions.length - 6}`} size="small" className="roles-m-permission-chip roles-m-permission-chip--more" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RolesListMobile;
