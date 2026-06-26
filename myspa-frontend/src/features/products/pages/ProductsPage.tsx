import React, { useEffect, useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select, TextField } from '@mui/material';
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
import { LOW_STOCK_THRESHOLD } from '@constants/config';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ImageIcon from '@mui/icons-material/Image';

const DEFAULT_PRODUCT_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="12" fill="%23F3F4F6"/><path d="M24 65l14-18 12 13 8-10 14 15H24z" fill="%23D97706"/><circle cx="62" cy="32" r="8" fill="%23F59E0B"/></svg>';

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

const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14 }, '& .MuiInputLabel-root': { fontSize: 14 } };

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', sku: '', price: 0, costPrice: 0, brand: '', stockQuantity: 0, minStockLevel: 5, unit: '', barcode: '', description: '', image: '', categoryId: '' },
  });

  const image = watch('image');

  const loadData = async () => {
    try {
      const [prodData, catData] = await Promise.all([getProducts(), getCategories()]);
      setProducts(prodData);
      setCategories(catData);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách sản phẩm và danh mục');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand || '').toLowerCase().includes(search.toLowerCase())
  ), [products, search]);

  const lowStockCount = products.filter(p => p.stockQuantity <= LOW_STOCK_THRESHOLD).length;

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', sku: '', price: 0, costPrice: 0, brand: '', stockQuantity: 0, minStockLevel: 5, unit: '', barcode: '', description: '', image: '', categoryId: '' });
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
      setProducts(prev => editing
        ? prev.map(product => product.productId === editing.productId ? saved : product)
        : [saved, ...prev]);
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
      setProducts(prev => prev.filter(product => product.productId !== deleteTarget.productId));
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
      renderCell: ({ value }) => <img src={value || DEFAULT_PRODUCT_IMAGE} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-color)' }} />,
    },
    { field: 'productId', headerName: 'Mã SP', width: 110 },
    { field: 'name', headerName: 'Tên sản phẩm', flex: 1, minWidth: 180 },
    { field: 'barcode', headerName: 'Mã vạch', width: 140 },
    { field: 'brand', headerName: 'Thương hiệu', width: 130 },
    { field: 'categoryName', headerName: 'Danh mục', width: 160 },
    { field: 'price', headerName: 'Giá', width: 130, renderCell: ({ value }) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(value)}</span> },
    {
      field: 'stockQuantity',
      headerName: 'Tồn kho',
      width: 120,
      renderCell: ({ value }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {value <= LOW_STOCK_THRESHOLD && <WarningAmberIcon sx={{ fontSize: 14, color: value <= 3 ? '#EF4444' : '#F59E0B' }} />}
          <Chip label={`${value}`} size="small" sx={{ background: value <= 3 ? '#FEE2E2' : value <= LOW_STOCK_THRESHOLD ? '#FEF3C7' : '#D1FAE5', color: value <= 3 ? '#DC2626' : value <= LOW_STOCK_THRESHOLD ? '#D97706' : '#059669', fontWeight: 600, fontSize: 11, borderRadius: 1 }} />
        </div>
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 120,
      sortable: false,
      renderCell: ({ row }) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <IconButton size="small" onClick={() => openEdit(row)} sx={{ color: 'var(--primary)' }}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => setDeleteTarget(row)} sx={{ color: '#EF4444' }}><DeleteIcon fontSize="small" /></IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Quản lý sản phẩm"
        subtitle={`${products.length} sản phẩm · ${lowStockCount} sản phẩm sắp hết hàng`}
        action={{ label: 'Thêm sản phẩm', onClick: openCreate }}
        extra={<ExportButtons onExportExcel={() => { exportToExcel(products.map(p => ({ 'Mã SP': p.productId, 'Tên': p.name, 'Thương hiệu': p.brand, 'Giá': p.price, 'Tồn kho': p.stockQuantity })), 'Danh_sach_san_pham', 'Sản phẩm'); toast.success('Xuất Excel thành công'); }} />}
      />
      <div style={{ marginBottom: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '16px 20px', boxShadow: 'var(--shadow-card)' }}>
        <TextField placeholder="Tìm kiếm sản phẩm, thương hiệu..." value={search} onChange={e => setSearch(e.target.value)} size="small"
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'var(--text-tertiary)' }} /></InputAdornment> } }} sx={{ width: 360, ...inputSx }} />
      </div>
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <DataGrid rows={filtered} columns={columns} getRowId={r => r.productId} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10, 20]} autoHeight disableRowSelectionOnClick sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }} />
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', minWidth: 620, background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17, pb: 0 }}>{editing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <form noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <img src={image || DEFAULT_PRODUCT_IMAGE} alt="" style={{ width: 82, height: 82, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-color)' }} />
              <Button component="label" variant="outlined" startIcon={<ImageIcon />} disabled={uploading} sx={{ borderRadius: '10px', textTransform: 'none' }}>
                {uploading ? 'Đang upload...' : 'Chọn ảnh sản phẩm'}
                <input hidden type="file" accept="image/*" onChange={event => handleImageFile(event.target.files?.[0])} />
              </Button>
            </div>
            <Controller name="name" control={control} render={({ field }) => <TextField {...field} label="Tên sản phẩm *" error={!!errors.name} helperText={errors.name?.message} fullWidth size="small" sx={inputSx} />} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Controller name="sku" control={control} render={({ field }) => <TextField {...field} label="SKU" fullWidth size="small" sx={inputSx} />} />
              <Controller name="brand" control={control} render={({ field }) => <TextField {...field} label="Thương hiệu *" error={!!errors.brand} helperText={errors.brand?.message} fullWidth size="small" sx={inputSx} />} />
              <Controller name="categoryId" control={control} render={({ field }) => <FormControl fullWidth size="small" sx={inputSx}><InputLabel>Danh mục</InputLabel><Select {...field} label="Danh mục" sx={{ borderRadius: '10px' }}><MenuItem value="">-- Không có --</MenuItem>{categories.map(c => <MenuItem key={c.categoryId} value={c.categoryId}>{c.name}</MenuItem>)}</Select></FormControl>} />
              <Controller name="unit" control={control} render={({ field }) => <TextField {...field} label="Đơn vị" fullWidth size="small" sx={inputSx} />} />
              <Controller name="barcode" control={control} render={({ field }) => <TextField {...field} label="Mã vạch" fullWidth size="small" sx={inputSx} />} />
              <Controller name="price" control={control} render={({ field }) => <TextField {...field} onChange={e => field.onChange(Number(e.target.value))} label="Giá (VNĐ) *" type="number" error={!!errors.price} helperText={errors.price?.message} fullWidth size="small" sx={inputSx} />} />
              <Controller name="costPrice" control={control} render={({ field }) => <TextField {...field} onChange={e => field.onChange(Number(e.target.value))} label="Giá vốn" type="number" fullWidth size="small" sx={inputSx} />} />
              <Controller name="stockQuantity" control={control} render={({ field }) => <TextField {...field} onChange={e => field.onChange(Number(e.target.value))} label="Số lượng tồn kho *" type="number" error={!!errors.stockQuantity} helperText={errors.stockQuantity?.message} fullWidth size="small" sx={inputSx} />} />
              <Controller name="minStockLevel" control={control} render={({ field }) => <TextField {...field} onChange={e => field.onChange(Number(e.target.value))} label="Tồn tối thiểu" type="number" fullWidth size="small" sx={inputSx} />} />
            </div>
            <Controller name="description" control={control} render={({ field }) => <TextField {...field} label="Mô tả *" multiline rows={3} error={!!errors.description} helperText={errors.description?.message} fullWidth size="small" sx={inputSx} />} />
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>{editing ? 'Lưu' : 'Thêm sản phẩm'}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} title="Xóa sản phẩm" message={`Bạn có chắc muốn ngừng hiển thị sản phẩm "${deleteTarget?.name}"?`} confirmLabel="Xóa" severity="error" onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
};

export default ProductsPage;
