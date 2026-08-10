import React, { useEffect, useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import PageHeader from '@components/common/PageHeader';
import ConfirmDialog from '@components/common/ConfirmDialog';
import { createCategory, deleteCategory, getCategories, updateCategory } from '@/api/catalog';
import type { Category, CategoryFormData } from '@/types';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CategoryIcon from '@mui/icons-material/Category';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import { useIsMobile } from '@hooks/useIsMobile';
import CategoriesListMobile from './CategoriesListMobile';
import './CategoriesPage.css';

const schema = z.object({
  name: z.string().min(2, 'Tên danh mục phải có ít nhất 2 ký tự'),
  type: z.enum(['PRODUCT', 'SERVICE']),
});

const inputSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14 },
  '& .MuiInputLabel-root': { fontSize: 14 },
};

const CategoriesPage: React.FC = () => {
  const isMobile = useIsMobile();
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', type: 'PRODUCT' },
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return categories.filter((category) => !query
      || category.name.toLowerCase().includes(query)
      || category.categoryId.toLowerCase().includes(query));
  }, [categories, search]);

  const totalProducts = useMemo(() => categories.reduce((sum, category) => sum + Number(category.productCount || 0), 0), [categories]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
      toast.error('Loi khi tai danh muc tu database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', type: 'PRODUCT' });
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    reset({ name: category.name, type: category.type });
    setDialogOpen(true);
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      const saved = editing
        ? await updateCategory(editing.categoryId, data)
        : await createCategory(data);
      setCategories((prev) => editing
        ? prev.map((category) => category.categoryId === editing.categoryId ? saved : category)
        : [saved, ...prev]);
      toast.success(editing ? 'Cap nhat danh muc thanh cong' : 'Them danh muc thanh cong');
      setDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || (editing ? 'Cap nhat danh muc that bai' : 'Them danh muc that bai'));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.categoryId);
      setCategories((prev) => prev.filter((category) => category.categoryId !== deleteTarget.categoryId));
      toast.success('Da xoa danh muc');
      setDeleteTarget(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Xoa danh muc that bai');
    }
  };

  const columns: GridColDef[] = [
    { field: 'categoryId', headerName: 'Mã danh mục', width: 150 },
    {
      field: 'name',
      headerName: 'Tên danh mục',
      flex: 1,
      minWidth: 220,
      renderCell: ({ value }) => <span className="categories-name-cell">{value}</span>,
    },
    {
      field: 'type',
      headerName: 'Loại danh mục',
      width: 150,
      renderCell: ({ value }) => value === 'SERVICE' ? 'Dịch vụ' : 'Sản phẩm',
    },
    {
      field: 'productCount',
      headerName: 'Số mục',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) => <span className="categories-count-pill">{row.type === 'SERVICE' ? (row.serviceCount || 0) : (row.productCount || 0)} {row.type === 'SERVICE' ? 'dịch vụ' : 'sản phẩm'}</span>,
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 120,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) => (
        <div className="categories-actions">
          <IconButton size="small" aria-label="Cập nhật danh mục" onClick={() => openEdit(row)} className="categories-icon-button categories-icon-button--edit">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label="Xóa danh mục" onClick={() => setDeleteTarget(row)} className="categories-icon-button categories-icon-button--delete">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <main className="categories-page animate-fadeIn">
      <PageHeader title="Danh mục sản phẩm & dịch vụ" subtitle={`${categories.length} danh mục`} action={{ label: 'Thêm danh mục', onClick: openCreate }} />

      <section className="categories-summary" aria-label="Tóm tắt danh mục">
        <div className="categories-summary-card"><span><CategoryIcon /></span><div><strong>{categories.length}</strong><p>Tổng danh mục</p></div></div>
        <div className="categories-summary-card"><span><Inventory2Icon /></span><div><strong>{totalProducts}</strong><p>Sản phẩm được phân loại</p></div></div>
      </section>

      <section className="categories-toolbar" aria-label="Bộ lọc danh mục">
        <TextField
          placeholder="Tìm theo tên hoặc mã danh mục..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          size="small"
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'var(--text-tertiary)' }} /></InputAdornment> } }}
          sx={{ flex: '1 1 320px', ...inputSx }}
        />
      </section>

      <section className="categories-panel">
        {isMobile ? (
          <CategoriesListMobile
            rows={filtered}
            loading={loading}
            emptyMessage={search ? 'Không tìm thấy danh mục phù hợp' : 'Không có dữ liệu'}
            onOpenEdit={openEdit}
            onDelete={(category) => setDeleteTarget(category)}
          />
        ) : (
          <DataGrid
            rows={filtered}
            columns={columns}
            getRowId={(row) => row.categoryId}
            loading={loading}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[10, 20]}
            autoHeight
            disableRowSelectionOnClick
            sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }}
            localeText={{
              MuiTablePagination: {
                labelRowsPerPage: 'Hàng mỗi trang:',
                labelDisplayedRows: ({ from, to, count }: any) => `${from}-${to} / ${count}`,
              },
              noRowsLabel: search ? 'Không tìm thấy danh mục phù hợp' : 'Không có dữ liệu',
            } as any}
          />
        )}
      </section>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', width: 'min(420px, calc(100vw - 32px))', background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 0 }}>
          {editing ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Controller name="name" control={control} render={({ field }) => (
            <TextField {...field} label="Tên danh mục *" error={!!errors.name} helperText={errors.name?.message} fullWidth size="small" sx={inputSx} />
          )} />
          <Controller name="type" control={control} render={({ field }) => (
            <FormControl fullWidth size="small" sx={{ mt: 2, ...inputSx }}>
              <InputLabel>Loại danh mục</InputLabel>
              <Select {...field} label="Loại danh mục">
                <MenuItem value="PRODUCT">Sản phẩm</MenuItem>
                <MenuItem value="SERVICE">Dịch vụ</MenuItem>
              </Select>
            </FormControl>
          )} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            Hủy
          </Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 700, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>
            {editing ? 'Lưu' : 'Thêm danh mục'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa danh mục"
        message={`Bạn có chắc muốn xóa danh mục "${deleteTarget?.name}"?`}
        confirmLabel="Xóa"
        severity="error"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
};

export default CategoriesPage;
