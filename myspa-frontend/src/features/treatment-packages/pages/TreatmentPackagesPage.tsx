import React, { useState, useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Select, MenuItem, FormControl, InputLabel, InputAdornment, IconButton } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import PageHeader from '@components/common/PageHeader';
import StatusChip from '@components/common/StatusChip';
import ConfirmDialog from '@components/common/ConfirmDialog';
import { getTreatmentPackages } from '@/api/catalog';
import { formatCurrency } from '@utils/formatters';
import { StatusOfPackage } from '@/types';
import type { TreatmentPackage, TreatmentPackageFormData } from '@/types';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const schema = z.object({
  packageName: z.string().min(2, 'Tên gói phải có ít nhất 2 ký tự'),
  totalSessions: z.number().int().positive('Số buổi phải > 0'),
  packagePrice: z.number().positive('Giá phải > 0'),
  description: z.string().min(1, 'Vui lòng nhập mô tả'),
  statusOfPakage: z.nativeEnum(StatusOfPackage),
});

const TreatmentPackagesPage: React.FC = () => {
  const [packages, setPackages] = useState<TreatmentPackage[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TreatmentPackage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TreatmentPackage | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await getTreatmentPackages();
        setPackages(data);
      } catch (err) {
        console.error(err);
        toast.error('Lỗi khi tải danh sách gói liệu trình từ database');
      }
    };
    fetchPackages();
  }, []);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<TreatmentPackageFormData>({
    resolver: zodResolver(schema),
    defaultValues: { packageName: '', totalSessions: 10, packagePrice: 0, description: '', statusOfPakage: StatusOfPackage.ACTIVE },
  });

  const filtered = useMemo(() => packages.filter(p => p.packageName.toLowerCase().includes(search.toLowerCase())), [packages, search]);

  const openCreate = () => { setEditing(null); reset({ packageName: '', totalSessions: 10, packagePrice: 0, description: '', statusOfPakage: StatusOfPackage.ACTIVE }); setDialogOpen(true); };
  const openEdit = (p: TreatmentPackage) => { setEditing(p); reset(p); setDialogOpen(true); };
  const onSubmit = (data: TreatmentPackageFormData) => {
    if (editing) { setPackages(prev => prev.map(p => p.treatmentPackageId === editing.treatmentPackageId ? { ...p, ...data } : p)); toast.success('Cập nhật gói liệu trình thành công'); }
    else { setPackages(prev => [{ ...data, treatmentPackageId: `TP${Date.now()}` }, ...prev]); toast.success('Thêm gói liệu trình thành công'); }
    setDialogOpen(false);
  };

  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14 }, '& .MuiInputLabel-root': { fontSize: 14 } };

  const columns: GridColDef[] = [
    { field: 'treatmentPackageId', headerName: 'Mã gói', width: 100 },
    { field: 'packageName', headerName: 'Tên gói liệu trình', flex: 1, minWidth: 220 },
    { field: 'totalSessions', headerName: 'Số buổi', width: 100, align: 'center', headerAlign: 'center' },
    { field: 'packagePrice', headerName: 'Giá gói', width: 140, renderCell: ({ value }) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(value)}</span> },
    { field: 'statusOfPakage', headerName: 'Trạng thái', width: 140, renderCell: ({ value }) => <StatusChip status={value} type="package" /> },
    { field: 'description', headerName: 'Mô tả', flex: 1 },
    { field: 'actions', headerName: 'Thao tác', width: 120, sortable: false, renderCell: ({ row }) => (<div style={{ display: 'flex', gap: 4 }}><IconButton size="small" onClick={() => openEdit(row)} sx={{ color: 'var(--primary)', '&:hover': { background: '#FEF3C7' } }}><EditIcon fontSize="small" /></IconButton><IconButton size="small" onClick={() => setDeleteTarget(row)} sx={{ color: '#EF4444', '&:hover': { background: '#FEE2E2' } }}><DeleteIcon fontSize="small" /></IconButton></div>) },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Gói liệu trình" subtitle={`${packages.length} gói`} action={{ label: 'Thêm gói liệu trình', onClick: openCreate }} />
      <div style={{ marginBottom: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '16px 20px', boxShadow: 'var(--shadow-card)' }}>
        <TextField placeholder="Tìm kiếm gói liệu trình..." value={search} onChange={e => setSearch(e.target.value)} size="small"
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'var(--text-tertiary)' }} /></InputAdornment> } }} sx={{ width: 360, ...inputSx }} />
      </div>
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <DataGrid rows={filtered} columns={columns} getRowId={r => r.treatmentPackageId} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10, 20]} autoHeight disableRowSelectionOnClick
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }}
          localeText={{ MuiTablePagination: { labelRowsPerPage: 'Hàng mỗi trang:', labelDisplayedRows: ({ from, to, count }: any) => `${from}–${to} / ${count}` }, noRowsLabel: 'Không có dữ liệu' } as any} />
      </div>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', minWidth: 500, background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17, pb: 0 }}>{editing ? 'Cập nhật gói liệu trình' : 'Thêm gói liệu trình mới'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <form noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Controller name="packageName" control={control} render={({ field }) => (<TextField {...field} label="Tên gói *" error={!!errors.packageName} helperText={errors.packageName?.message} fullWidth size="small" sx={inputSx} />)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Controller name="totalSessions" control={control} render={({ field }) => (<TextField {...field} onChange={e => field.onChange(Number(e.target.value))} label="Số buổi *" type="number" error={!!errors.totalSessions} helperText={errors.totalSessions?.message} fullWidth size="small" sx={inputSx} />)} />
              <Controller name="packagePrice" control={control} render={({ field }) => (<TextField {...field} onChange={e => field.onChange(Number(e.target.value))} label="Giá gói (VNĐ) *" type="number" error={!!errors.packagePrice} helperText={errors.packagePrice?.message} fullWidth size="small" sx={inputSx} />)} />
            </div>
            <Controller name="statusOfPakage" control={control} render={({ field }) => (<FormControl fullWidth size="small" sx={inputSx}><InputLabel>Trạng thái</InputLabel><Select {...field} label="Trạng thái" sx={{ borderRadius: '10px' }}><MenuItem value={StatusOfPackage.ACTIVE}>Đang áp dụng</MenuItem><MenuItem value={StatusOfPackage.INACTIVE}>Ngừng áp dụng</MenuItem></Select></FormControl>)} />
            <Controller name="description" control={control} render={({ field }) => (<TextField {...field} label="Mô tả *" multiline rows={3} error={!!errors.description} helperText={errors.description?.message} fullWidth size="small" sx={inputSx} />)} />
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 600, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>{editing ? 'Lưu thay đổi' : 'Thêm gói'}</Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog open={!!deleteTarget} title="Xóa gói liệu trình" message={`Bạn có chắc muốn xóa gói "${deleteTarget?.packageName}"?`} confirmLabel="Xóa" severity="error"
        onConfirm={() => { setPackages(prev => prev.filter(p => p.treatmentPackageId !== deleteTarget!.treatmentPackageId)); toast.success('Đã xóa gói liệu trình'); setDeleteTarget(null); }} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
};

export default TreatmentPackagesPage;
