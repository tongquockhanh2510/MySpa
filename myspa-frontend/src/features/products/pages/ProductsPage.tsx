import React, { useEffect, useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import PageHeader from '@components/common/PageHeader';
import ConfirmDialog from '@components/common/ConfirmDialog';
import ExportButtons from '@components/common/ExportButtons';
import { createProduct, deleteProduct, getCategories, getProducts, updateProduct, uploadProductImage } from '@/api/catalog';
import { formatCurrency } from '@utils/formatters';
import { exportToExcel } from '@utils/exportExcel';
import type { Category, Product, ProductFormData } from '@/types';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ImageIcon from '@mui/icons-material/Image';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CategoryIcon from '@mui/icons-material/Category';
import PaidIcon from '@mui/icons-material/Paid';
import { useIsMobile } from '@hooks/useIsMobile';
import ProductsListMobile from './ProductsListMobile';
import './ProductsPage.css';

const DEFAULT_PRODUCT_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="12" fill="%23F3F4F6"/><path d="M24 65l14-18 12 13 8-10 14 15H24z" fill="%23D97706"/><circle cx="62" cy="32" r="8" fill="%23F59E0B"/></svg>';

const schema = z.object({
  name: z.string().min(2, 'Tên sản phẩm phải có ít nhất 2 ký tự'),
  sku: z.string().optional(),
  price: z.number().positive('Giá phải > 0'),
  costPrice: z.number().min(0).optional(),
  brand: z.string().min(1, 'Vui lòng nhập thương hiệu'),
  stockQuantity: z.number().min(0, 'Số lượng phải >= 0'),
  minStockLevel: z.number().min(0).optional(),
  unit: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().min(1, 'Vui lòng nhập mô tả'),
  image: z.string().optional(),
  categoryId: z.string().optional(),
});

const inputSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14 },
  '& .MuiInputLabel-root': { fontSize: 14 },
};

type StockFilter = 'all' | 'low' | 'out';

const ProductsPage: React.FC = () => {
  const isMobile = useIsMobile();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      sku: '',
      price: 0,
      costPrice: 0,
      brand: '',
      stockQuantity: 0,
      minStockLevel: 5,
      unit: '',
      barcode: '',
      description: '',
      image: '',
      categoryId: '',
    },
  });

  const image = watch('image');

  const loadData = async () => {
    try {
      const [prodData, catData] = await Promise.all([getProducts(), getCategories()]);
      setProducts(prodData);
      setCategories(catData.filter((category: Category) => category.type === 'PRODUCT'));
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách sản phẩm và danh mục');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        [product.name, product.brand, product.productId, product.sku, product.barcode]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter;
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && product.stockQuantity > 0 && product.stockQuantity <= (product.minStockLevel ?? 0)) ||
        (stockFilter === 'out' && product.stockQuantity === 0);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [categoryFilter, products, search, stockFilter]);

  const lowStockCount = products.filter((product) => product.stockQuantity <= (product.minStockLevel ?? 0)).length;
  const outOfStockCount = products.filter((product) => product.stockQuantity === 0).length;
  const inventoryValue = products.reduce((total, product) => total + (product.costPrice ?? 0) * product.stockQuantity, 0);

  const openCreate = () => {
    setEditing(null);
    reset({
      name: '',
      sku: '',
      price: 0,
      costPrice: 0,
      brand: '',
      stockQuantity: 0,
      minStockLevel: 5,
      unit: '',
      barcode: '',
      description: '',
      image: '',
      categoryId: '',
    });
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    reset({ ...product, categoryId: product.categoryId || '', image: product.image || '' });
    setDialogOpen(true);
  };

  const handleImageFile = async (file?: File) => {
    if (!file) return;
    try {
      setUploading(true);
      const imagePath = await uploadProductImage(file);
      setValue('image', imagePath, { shouldDirty: true });
      toast.success('Upload ảnh thành công');
    } catch (err) {
      console.error(err);
      toast.error('Upload ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      const saved = editing ? await updateProduct(editing.productId, data) : await createProduct(data);
      setProducts((prev) =>
        editing ? prev.map((product) => (product.productId === editing.productId ? saved : product)) : [saved, ...prev]
      );
      toast.success(editing ? 'Cập nhật sản phẩm thành công' : 'Thêm sản phẩm thành công');
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(editing ? 'Cập nhật sản phẩm thất bại' : 'Thêm sản phẩm thất bại');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget.productId);
      setProducts((prev) => prev.filter((product) => product.productId !== deleteTarget.productId));
      toast.success('Đã ngừng hiển thị sản phẩm');
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      toast.error('Xóa sản phẩm thất bại');
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'image',
      headerName: 'Ảnh',
      width: 76,
      sortable: false,
      renderCell: ({ value, row }) => (
        <img src={value || DEFAULT_PRODUCT_IMAGE} alt="" className="products-page__product-image" />
      ),
    },
    { field: 'productId', headerName: 'Mã SP', width: 110 },
    {
      field: 'name',
      headerName: 'Tên sản phẩm',
      flex: 1,
      minWidth: 210,
      renderCell: ({ row }) => (
        <div className="products-page__name-cell">
          <strong>{row.name}</strong>
          <span>{row.sku || row.barcode || 'Chưa có SKU'}</span>
        </div>
      ),
    },
    { field: 'brand', headerName: 'Thương hiệu', width: 140 },
    { field: 'categoryName', headerName: 'Danh mục', width: 170 },
    {
      field: 'price',
      headerName: 'Giá',
      width: 140,
      renderCell: ({ value }) => <strong className="products-page__price">{formatCurrency(value)}</strong>,
    },
    {
      field: 'stockQuantity',
      headerName: 'Tồn kho',
      width: 130,
      renderCell: ({ value, row }) => (
        <div className="products-page__stock-cell">
          {value <= (row.minStockLevel ?? 0) && (
            <WarningAmberIcon sx={{ fontSize: 14, color: value <= 3 ? '#EF4444' : '#F59E0B' }} />
          )}
          <Chip
            label={`${value}`}
            size="small"
            className={
              value <= 3
                ? 'products-page__stock-chip products-page__stock-chip--danger'
                : value <= (row.minStockLevel ?? 0)
                  ? 'products-page__stock-chip products-page__stock-chip--warning'
                  : 'products-page__stock-chip products-page__stock-chip--ok'
            }
          />
        </div>
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 120,
      sortable: false,
      renderCell: ({ row }) => (
        <div className="products-page__actions">
          <IconButton size="small" onClick={() => openEdit(row)} sx={{ color: 'var(--primary)' }}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => setDeleteTarget(row)} sx={{ color: '#EF4444' }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <main className="products-page animate-fadeIn">
      <PageHeader
        title="Quản lý sản phẩm"
        subtitle={`${products.length} sản phẩm · ${lowStockCount} sản phẩm cần theo dõi tồn kho`}
        action={{ label: 'Thêm sản phẩm', onClick: openCreate }}
        extra={
          <ExportButtons
            onExportExcel={() => {
              exportToExcel(
                products.map((product) => ({
                  'Mã SP': product.productId,
                  Tên: product.name,
                  'Thương hiệu': product.brand,
                  Giá: product.price,
                  'Tồn kho': product.stockQuantity,
                })),
                'Danh_sach_san_pham',
                'Sản phẩm'
              );
              toast.success('Xuất Excel thành công');
            }}
          />
        }
      />

      <section className="products-page__summary" aria-label="Tổng quan sản phẩm">
        <article className="products-page__summary-card">
          <Inventory2Icon />
          <div>
            <span>Tổng sản phẩm</span>
            <strong>{products.length}</strong>
          </div>
        </article>
        <article className="products-page__summary-card">
          <CategoryIcon />
          <div>
            <span>Danh mục</span>
            <strong>{categories.length}</strong>
          </div>
        </article>
        <article className="products-page__summary-card">
          <WarningAmberIcon />
          <div>
            <span>Sắp hết hàng</span>
            <strong>{lowStockCount}</strong>
          </div>
        </article>
        <article className="products-page__summary-card">
          <PaidIcon />
          <div>
            <span>Giá trị tồn</span>
            <strong>{formatCurrency(inventoryValue)}</strong>
          </div>
        </article>
      </section>

      <section className="products-page__toolbar" aria-label="Bộ lọc sản phẩm">
        <TextField
          placeholder="Tìm sản phẩm, thương hiệu, SKU..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          size="small"
          className="products-page__search"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'var(--text-tertiary)' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={inputSx}
        />
        <FormControl size="small" className="products-page__filter" sx={inputSx}>
          <InputLabel>Danh mục</InputLabel>
          <Select value={categoryFilter} label="Danh mục" onChange={(event) => setCategoryFilter(event.target.value)}>
            <MenuItem value="all">Tất cả danh mục</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.categoryId} value={category.categoryId}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" className="products-page__filter" sx={inputSx}>
          <InputLabel>Tồn kho</InputLabel>
          <Select value={stockFilter} label="Tồn kho" onChange={(event) => setStockFilter(event.target.value as StockFilter)}>
            <MenuItem value="all">Tất cả trạng thái</MenuItem>
            <MenuItem value="low">Sắp hết hàng</MenuItem>
            <MenuItem value="out">Hết hàng</MenuItem>
          </Select>
        </FormControl>
        <span>{filtered.length} kết quả</span>
      </section>

      {isMobile ? (
        <ProductsListMobile
          rows={filtered}
          emptyMessage="Không có sản phẩm phù hợp"
          onOpenEdit={openEdit}
          onDelete={(product) => setDeleteTarget(product)}
        />
      ) : (
        <div className="products-page__panel">
          <DataGrid
            rows={filtered}
            columns={columns}
            getRowId={(row) => row.productId}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[10, 20]}
            autoHeight
            disableRowSelectionOnClick
            sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }}
            localeText={{ noRowsLabel: 'Không có sản phẩm phù hợp' }}
          />
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '16px',
              width: 'min(640px, calc(100vw - 32px))',
              background: 'var(--bg-secondary)',
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17, pb: 0 }}>
          {editing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <form noValidate className="products-page__form">
            <div className="products-page__image-field">
              <img src={image || DEFAULT_PRODUCT_IMAGE} alt="" className="products-page__preview-image" />
              <Button
                component="label"
                variant="outlined"
                startIcon={<ImageIcon />}
                disabled={uploading}
                sx={{ borderRadius: '10px', textTransform: 'none' }}
              >
                {uploading ? 'Đang upload...' : 'Chọn ảnh sản phẩm'}
                <input hidden type="file" accept="image/*" onChange={(event) => handleImageFile(event.target.files?.[0])} />
              </Button>
            </div>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Tên sản phẩm *"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  fullWidth
                  size="small"
                  sx={inputSx}
                />
              )}
            />
            <div className="products-page__form-grid">
              <Controller name="sku" control={control} render={({ field }) => <TextField {...field} label="SKU" fullWidth size="small" sx={inputSx} />} />
              <Controller
                name="brand"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Thương hiệu *"
                    error={!!errors.brand}
                    helperText={errors.brand?.message}
                    fullWidth
                    size="small"
                    sx={inputSx}
                  />
                )}
              />
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small" sx={inputSx}>
                    <InputLabel>Danh mục</InputLabel>
                    <Select {...field} label="Danh mục" sx={{ borderRadius: '10px' }}>
                      <MenuItem value="">-- Không có --</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.categoryId} value={category.categoryId}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              <Controller name="unit" control={control} render={({ field }) => <TextField {...field} label="Đơn vị" fullWidth size="small" sx={inputSx} />} />
              <Controller name="barcode" control={control} render={({ field }) => <TextField {...field} label="Mã vạch" fullWidth size="small" sx={inputSx} />} />
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    onChange={(event) => field.onChange(Number(event.target.value))}
                    label="Giá (VNĐ) *"
                    type="number"
                    error={!!errors.price}
                    helperText={errors.price?.message}
                    fullWidth
                    size="small"
                    sx={inputSx}
                  />
                )}
              />
              <Controller
                name="costPrice"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    onChange={(event) => field.onChange(Number(event.target.value))}
                    label="Giá vốn"
                    type="number"
                    fullWidth
                    size="small"
                    sx={inputSx}
                  />
                )}
              />
              <Controller
                name="stockQuantity"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    onChange={(event) => field.onChange(Number(event.target.value))}
                    label="Số lượng tồn kho *"
                    type="number"
                    error={!!errors.stockQuantity}
                    helperText={errors.stockQuantity?.message}
                    fullWidth
                    size="small"
                    sx={inputSx}
                  />
                )}
              />
              <Controller
                name="minStockLevel"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    onChange={(event) => field.onChange(Number(event.target.value))}
                    label="Tồn tối thiểu"
                    type="number"
                    fullWidth
                    size="small"
                    sx={inputSx}
                  />
                )}
              />
            </div>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Mô tả *"
                  multiline
                  rows={3}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  fullWidth
                  size="small"
                  sx={inputSx}
                />
              )}
            />
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
          >
            {editing ? 'Lưu' : 'Thêm sản phẩm'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa sản phẩm"
        message={`Bạn có chắc muốn ngừng hiển thị sản phẩm "${deleteTarget?.name}"?`}
        confirmLabel="Xóa"
        severity="error"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
};

export default ProductsPage;
