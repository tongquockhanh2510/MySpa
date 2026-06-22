import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, IconButton } from '@mui/material';
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

const schema = z.object({ name: z.string().min(2, 'Tên danh mục phải có ít nhất 2 ký tự') });

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const { control, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormData>({ resolver: zodResolver(schema), defaultValues: { name: '' } });
  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14 }, '& .MuiInputLabel-root': { fontSize: 14 } };

  const columns: GridColDef[] = [
    { field: 'categoryId', headerName: 'Mã danh mục', width: 140 },
    { field: 'name', headerName: 'Tên danh mục', flex: 1 },
    { field: 'productCount', headerName: 'Số sản phẩm', width: 140, align: 'center', headerAlign: 'center' },
    { field: 'actions', headerName: 'Thao tác', width: 120, sortable: false, renderCell: ({ row }) => (<div style={{ display: 'flex', gap: 4 }}><IconButton size="small" onClick={() => { setEditing(row); reset({ name: row.name }); setDialogOpen(true); }} sx={{ color: 'var(--primary)', '&:hover': { background: '#FEF3C7' } }}><EditIcon fontSize="small" /></IconButton><IconButton size="small" onClick={() => setDeleteTarget(row)} sx={{ color: '#EF4444', '&:hover': { background: '#FEE2E2' } }}><DeleteIcon fontSize="small" /></IconButton></div>) },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Danh mục sản phẩm" subtitle={`${categories.length} danh mục`} action={{ label: 'Thêm danh mục', onClick: () => { setEditing(null); reset({ name: '' }); setDialogOpen(true); } }} />
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <DataGrid rows={categories} columns={columns} getRowId={r => r.categoryId} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10, 20]} autoHeight disableRowSelectionOnClick
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }}
          localeText={{ MuiTablePagination: { labelRowsPerPage: 'Hàng mỗi trang:', labelDisplayedRows: ({ from, to, count }: any) => `${from}–${to} / ${count}` }, noRowsLabel: 'Không có dữ liệu' } as any} />
      </div>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', minWidth: 400, background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17, pb: 0 }}>{editing ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Controller name="name" control={control} render={({ field }) => (<TextField {...field} label="Tên danh mục *" error={!!errors.name} helperText={errors.name?.message} fullWidth size="small" sx={inputSx} />)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Hủy</Button>
          <Button onClick={handleSubmit((data) => { if (editing) { setCategories(prev => prev.map(c => c.categoryId === editing.categoryId ? { ...c, ...data } : c)); toast.success('Cập nhật danh mục thành công'); } else { setCategories(prev => [{ ...data, categoryId: `CAT${Date.now()}`, productCount: 0 }, ...prev]); toast.success('Thêm danh mục thành công'); } setDialogOpen(false); })} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 600, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>{editing ? 'Lưu' : 'Thêm danh mục'}</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={!!deleteTarget} title="Xóa danh mục" message={`Bạn có chắc muốn xóa danh mục "${deleteTarget?.name}"?`} confirmLabel="Xóa" severity="error"
        onConfirm={() => { setCategories(prev => prev.filter(c => c.categoryId !== deleteTarget!.categoryId)); toast.success('Đã xóa danh mục'); setDeleteTarget(null); }} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
};

export default CategoriesPage;
