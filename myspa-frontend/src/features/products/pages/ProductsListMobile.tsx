import React from 'react';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import { formatCurrency } from '@utils/formatters';
import type { Product } from '@/types';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import './ProductsListMobile.css';

const DEFAULT_PRODUCT_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="12" fill="%23F3F4F6"/><path d="M24 65l14-18 12 13 8-10 14 15H24z" fill="%23D97706"/><circle cx="62" cy="32" r="8" fill="%23F59E0B"/></svg>';

interface ProductsListMobileProps {
  rows: (Product & { categoryName?: string })[];
  emptyMessage: string;
  onOpenEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const ProductsListMobile: React.FC<ProductsListMobileProps> = ({ rows, emptyMessage, onOpenEdit, onDelete }) => {
  if (!rows.length) {
    return <p className="products-m-empty">{emptyMessage}</p>;
  }

  return (
    <div className="products-m-list">
      {rows.map((row: any) => {
        const stock = Number(row.stockQuantity || 0);
        const minLevel = Number(row.minStockLevel || 0);
        const stockTone = stock <= 3 ? 'danger' : stock <= minLevel ? 'warning' : 'ok';

        return (
          <div
            key={row.productId}
            className="products-m-card"
            role="button"
            tabIndex={0}
            onClick={() => onOpenEdit(row)}
            onKeyDown={(e) => { if (e.key === 'Enter') onOpenEdit(row); }}
          >
            <img src={row.image || DEFAULT_PRODUCT_IMAGE} alt="" className="products-m-card__image" />
            <div className="products-m-card__body">
              <div className="products-m-card__top">
                <div className="products-m-card__identity">
                  <strong title={row.name}>{row.name}</strong>
                  <span>{row.sku || row.barcode || 'Chưa có SKU'} · {row.brand}</span>
                </div>
                <strong className="products-m-card__price">{formatCurrency(row.price)}</strong>
              </div>

              <div className="products-m-card__meta">
                <span>{row.categoryName || 'Chưa phân loại'}</span>
                <Chip
                  icon={stockTone !== 'ok' ? <WarningAmberIcon fontSize="small" /> : undefined}
                  label={`Tồn ${stock}`}
                  size="small"
                  className={`products-m-stock-chip products-m-stock-chip--${stockTone}`}
                />
              </div>

              <div className="products-m-card__actions" onClick={(e) => e.stopPropagation()}>
                <IconButton size="small" aria-label="Cập nhật sản phẩm" onClick={() => onOpenEdit(row)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" aria-label="Xóa sản phẩm" onClick={() => onDelete(row)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductsListMobile;
