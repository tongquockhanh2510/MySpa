import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import Chip from '@mui/material/Chip';
import './PermissionsListMobile.css';

interface PermissionsListMobileProps {
  rows: { name: string; module: string; action: string; description?: string }[];
  loading: boolean;
  emptyMessage: string;
}

const PermissionsListMobile: React.FC<PermissionsListMobileProps> = ({ rows, loading, emptyMessage }) => {
  if (loading) {
    return (
      <div className="permissions-m-list" aria-busy="true" aria-label="Đang tải quyền hạn">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={80} />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <p className="permissions-m-empty">{emptyMessage}</p>;
  }

  return (
    <div className="permissions-m-list">
      {rows.map((row) => (
        <div key={row.name} className="permissions-m-card">
          <div className="permissions-m-card__top">
            <strong>{row.name}</strong>
            <Chip label={row.module} size="small" className="permissions-m-chip" />
          </div>
          <span className="permissions-m-action">{row.action}</span>
          {row.description && <p className="permissions-m-desc">{row.description}</p>}
        </div>
      ))}
    </div>
  );
};

export default PermissionsListMobile;
