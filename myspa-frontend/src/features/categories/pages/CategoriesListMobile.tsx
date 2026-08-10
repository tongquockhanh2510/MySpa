import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import type { Category } from '@/types';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import './CategoriesListMobile.css';

interface CategoriesListMobileProps {
  rows: Category[];
  loading: boolean;
  emptyMessage: string;
  onOpenEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

const CategoriesListMobile: React.FC<CategoriesListMobileProps> = ({
  rows, loading, emptyMessage, onOpenEdit, onDelete,
}) => {
  if (loading) {
    return (
      <div className="categories-m-list" aria-busy="true" aria-label="Đang tải danh mục">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={72} />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <p className="categories-m-empty">{emptyMessage}</p>;
  }

  return (
    <div className="categories-m-list">
      {rows.map((row: any) => (
        <div
          key={row.categoryId}
          className="categories-m-card"
          role="button"
          tabIndex={0}
          onClick={() => onOpenEdit(row)}
          onKeyDown={(e) => { if (e.key === 'Enter') onOpenEdit(row); }}
        >
          <div className="categories-m-card__identity">
            <strong title={row.name}>{row.name}</strong>
            <span>{row.type === 'SERVICE' ? 'Dịch vụ' : 'Sản phẩm'} · {row.type === 'SERVICE' ? (row.serviceCount || 0) : (row.productCount || 0)} mục</span>
          </div>
          <div className="categories-m-card__actions" onClick={(e) => e.stopPropagation()}>
            <IconButton size="small" aria-label="Cập nhật danh mục" onClick={() => onOpenEdit(row)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" aria-label="Xóa danh mục" onClick={() => onDelete(row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoriesListMobile;
