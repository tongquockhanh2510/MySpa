import React, { useState, useMemo, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Select, MenuItem, FormControl, InputLabel, InputAdornment, IconButton, Chip } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import PageHeader from '@components/common/PageHeader';
import ConfirmDialog from '@components/common/ConfirmDialog';
import ExportButtons from '@components/common/ExportButtons';
import { getProducts, getCategories } from '@/api/catalog';
import { formatCurrency } from '@utils/formatters';
import { exportToExcel } from '@utils/exportExcel';
import type { Product, ProductFormData, Category } from '@/types';
import { LOW_STOCK_THRESHOLD } from '@constants/config';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const schema = z.object({
  name: z.string().min(2, 'Tên sản phẩm phải có ít nhất 2 ký tự'),
  price: z.number().positive('Giá phải > 0'),
  brand: z.string().min(1, 'Vui lòng nhập thương hiệu'),
  stockQuantity: z.number().min(0, 'Số lượng phải >= 0'),
  description: z.string().min(1, 'Vui lòng nhập mô tả'),
  categoryId: z.string().optional(),
});

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const fetchProductsAndCategories = async () => {
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
    fetchProductsAndCategories();
  }, []);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', price: 0, brand: '', stockQuantity: 0, description: '', categoryId: '' },
  });

  const filtered = useMemo(() => products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  ), [products, search]);

  const lowStockCount = products.filter(p => p.stockQuantity <= LOW_STOCK_THRESHOLD).length;

  const openCreate = () => { setEditing(null); reset({ name: '', price: 0, brand: '', stockQuantity: 0, description: '', categoryId: '' }); setDialogOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); reset(p); setDialogOpen(true); };
  const onSubmit = (data: ProductFormData) => {
    if (editing) { setProducts(prev => prev.map(p => p.productId === editing.productId ? { ...p, ...data, categoryName: categories.find(c => c.categoryId === data.categoryId)?.name } : p)); toast.success('Cập nhật sản phẩm thành công'); }
    else { setProducts(prev => [{ ...data, productId: `P${Date.now()}`, categoryName: categories.find(c => c.categoryId === data.categoryId)?.name }, ...prev]); toast.success('Thêm sản phẩm thành công'); }
    setDialogOpen(false);
  };

  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14 }, '& .MuiInputLabel-root': { fontSize: 14 } };

  const columns: GridColDef[] = [
    { field: 'productId', headerName: 'Mã SP', width: 100 },
    { field: 'name', headerName: 'Tên sản phẩm', flex: 1, minWidth: 180 },
    { field: 'brand', headerName: 'Thương hiệu', width: 130 },
    { field: 'categoryName', headerName: 'Danh mục', width: 160 },
    { field: 'price', headerName: 'Giá', width: 130, renderCell: ({ value }) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(value)}</span> },
    {
      field: 'stockQuantity', headerName: 'Tồn kho', width: 120,
      renderCell: ({ value }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {value <= LOW_STOCK_THRESHOLD && <WarningAmberIcon sx={{ fontSize: 14, color: value <= 3 ? '#EF4444' : '#F59E0B' }} />}
          <Chip label={`${value}`} size="small" sx={{
            background: value <= 3 ? '#FEE2E2' : value <= LOW_STOCK_THRESHOLD ? '#FEF3C7' : '#D1FAE5',
            color: value <= 3 ? '#DC2626' : value <= LOW_STOCK_THRESHOLD ? '#D97706' : '#059669',
            fontWeight: 600, fontSize: 11, borderRadius: 1,
          }} />
        </div>
      ),
    },
    { field: 'actions', headerName: 'Thao tác', width: 120, sortable: false, renderCell: ({ row }) => (<div style={{ display: 'flex', gap: 4 }}><IconButton size="small" onClick={() => openEdit(row)} sx={{ color: 'var(--primary)', '&:hover': { background: '#FEF3C7' } }}><EditIcon fontSize="small" /></IconButton><IconButton size="small" onClick={() => setDeleteTarget(row)} sx={{ color: '#EF4444', '&:hover': { background: '#FEE2E2' } }}><DeleteIcon fontSize="small" /></IconButton></div>) },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Quản lý sản phẩm" subtitle={`${products.length} sản phẩm · ${lowStockCount} sản phẩm sắp hết hàng`}
        action={{ label: 'Thêm sản phẩm', onClick: openCreate }}
        extra={<ExportButtons onExportExcel={() => { exportToExcel(products.map(p => ({ 'Mã SP': p.productId, 'Tên': p.name, 'Thương hiệu': p.brand, 'Giá': p.price, 'Tồn kho': p.stockQuantity })), 'Danh_sach_san_pham', 'Sản phẩm'); toast.success('Xuất Excel thành công'); }} />} />
      <div style={{ marginBottom: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '16px 20px', boxShadow: 'var(--shadow-card)' }}>
        <TextField placeholder="Tìm kiếm sản phẩm, thương hiệu..." value={search} onChange={e => setSearch(e.target.value)} size="small"
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'var(--text-tertiary)' }} /></InputAdornment> } }} sx={{ width: 360, ...inputSx }} />
      </div>
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <DataGrid rows={filtered} columns={columns} getRowId={r => r.productId}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10, 20]} autoHeight disableRowSelectionOnClick
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }}
          localeText={{ MuiTablePagination: { labelRowsPerPage: 'Hàng mỗi trang:', labelDisplayedRows: ({ from, to, count }: any) => `${from}–${to} / ${count}` }, noRowsLabel: 'Không có dữ liệu' } as any} />
      </div>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', minWidth: 520, background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17, pb: 0 }}>{editing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <form noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Controller name="name" control={control} render={({ field }) => (<TextField {...field} label="Tên sản phẩm *" error={!!errors.name} helperText={errors.name?.message} fullWidth size="small" sx={inputSx} />)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Controller name="brand" control={control} render={({ field }) => (<TextField {...field} label="Thương hiệu *" error={!!errors.brand} helperText={errors.brand?.message} fullWidth size="small" sx={inputSx} />)} />
              <Controller name="categoryId" control={control} render={({ field }) => (<FormControl fullWidth size="small" sx={inputSx}><InputLabel>Danh mục</InputLabel><Select {...field} label="Danh mục" sx={{ borderRadius: '10px' }}><MenuItem value="">-- Không có --</MenuItem>{categories.map(c => <MenuItem key={c.categoryId} value={c.categoryId}>{c.name}</MenuItem>)}</Select></FormControl>)} />
              <Controller name="price" control={control} render={({ field }) => (<TextField {...field} onChange={e => field.onChange(Number(e.target.value))} label="Giá (VNĐ) *" type="number" error={!!errors.price} helperText={errors.price?.message} fullWidth size="small" sx={inputSx} />)} />
              <Controller name="stockQuantity" control={control} render={({ field }) => (<TextField {...field} onChange={e => field.onChange(Number(e.target.value))} label="Số lượng tồn kho *" type="number" error={!!errors.stockQuantity} helperText={errors.stockQuantity?.message} fullWidth size="small" sx={inputSx} />)} />
            </div>
            <Controller name="description" control={control} render={({ field }) => (<TextField {...field} label="Mô tả *" multiline rows={3} error={!!errors.description} helperText={errors.description?.message} fullWidth size="small" sx={inputSx} />)} />
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 600, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>{editing ? 'Lưu' : 'Thêm sản phẩm'}</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={!!deleteTarget} title="Xóa sản phẩm" message={`Bạn có chắc muốn xóa sản phẩm "${deleteTarget?.name}"?`} confirmLabel="Xóa" severity="error"
        onConfirm={() => { setProducts(prev => prev.filter(p => p.productId !== deleteTarget!.productId)); toast.success('Đã xóa sản phẩm'); setDeleteTarget(null); }} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
};

export default ProductsPage;
