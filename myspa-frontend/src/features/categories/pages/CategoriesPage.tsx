import React, { useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, TextField } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import PageHeader from '@components/common/PageHeader';
import ConfirmDialog from '@components/common/ConfirmDialog';
import { mockCategories } from '@utils/mockData';
import type { Category, CategoryFormData } from '@/types';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CategoryIcon from '@mui/icons-material/Category';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import './CategoriesPage.css';

const schema = z.object({
  name: z.string().min(2, 'Tên danh mục phải có ít nhất 2 ký tự'),
});

const inputSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14 },
  '& .MuiInputLabel-root': { fontSize: 14 },
};

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return categories.filter((category) => !query
      || category.name.toLowerCase().includes(query)
      || category.categoryId.toLowerCase().includes(query));
  }, [categories, search]);

  const totalProducts = useMemo(() => categories.reduce((sum, category) => sum + Number(category.productCount || 0), 0), [categories]);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '' });
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    reset({ name: category.name });
    setDialogOpen(true);
  };

  const onSubmit = (data: CategoryFormData) => {
    if (editing) {
      setCategories((prev) => prev.map((category) => category.categoryId === editing.categoryId ? { ...category, ...data } : category));
      toast.success('Cập nhật danh mục thành công');
    } else {
      setCategories((prev) => [{ ...data, categoryId: `CAT${Date.now()}`, productCount: 0 }, ...prev]);
      toast.success('Thêm danh mục thành công');
    }
    setDialogOpen(false);
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
      field: 'productCount',
      headerName: 'Số sản phẩm',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ value }) => <span className="categories-count-pill">{value || 0} sản phẩm</span>,
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
      <PageHeader title="Danh mục sản phẩm" subtitle={`${categories.length} danh mục`} action={{ label: 'Thêm danh mục', onClick: openCreate }} />

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
        <DataGrid
          rows={filtered}
          columns={columns}
          getRowId={(row) => row.categoryId}
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
      </section>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', width: 'min(420px, calc(100vw - 32px))', background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 0 }}>
          {editing ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Controller name="name" control={control} render={({ field }) => (
            <TextField {...field} label="Tên danh mục *" error={!!errors.name} helperText={errors.name?.message} fullWidth size="small" sx={inputSx} />
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
        onConfirm={() => {
          setCategories((prev) => prev.filter((category) => category.categoryId !== deleteTarget!.categoryId));
          toast.success('Đã xóa danh mục');
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
};

export default CategoriesPage;
