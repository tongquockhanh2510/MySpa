import React, { useState, useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Select, MenuItem, FormControl,
  InputLabel, InputAdornment, IconButton,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import PageHeader from '@components/common/PageHeader';
import StatusChip from '@components/common/StatusChip';
import ConfirmDialog from '@components/common/ConfirmDialog';
import { mockServices } from '@utils/mockData';
import { formatCurrency, formatDuration } from '@utils/formatters';
import { StatusOfService } from '@/types';
import type { Service, ServiceFormData } from '@/types';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const schema = z.object({
  name: z.string().min(2, 'Tên dịch vụ phải có ít nhất 2 ký tự'),
  price: z.number().positive('Giá phải > 0'),
  duration: z.number().positive('Thời lượng phải > 0'),
  description: z.string().min(1, 'Vui lòng nhập mô tả'),
  commissionRate: z.number().min(0).max(100, 'Hoa hồng từ 0-100%'),
  statusOfService: z.nativeEnum(StatusOfService),
});

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>(mockServices);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ServiceFormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', price: 0, duration: 60, description: '', commissionRate: 15, statusOfService: StatusOfService.ACTIVE },
  });

  const filtered = useMemo(() =>
    services.filter(s => s.name.toLowerCase().includes(search.toLowerCase())),
    [services, search]);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', price: 0, duration: 60, description: '', commissionRate: 15, statusOfService: StatusOfService.ACTIVE });
    setDialogOpen(true);
  };
  const openEdit = (s: Service) => { setEditing(s); reset(s); setDialogOpen(true); };

  const onSubmit = (data: ServiceFormData) => {
    if (editing) {
      setServices(prev => prev.map(s => s.serviceId === editing.serviceId ? { ...s, ...data } : s));
      toast.success('Cập nhật dịch vụ thành công');
    } else {
      setServices(prev => [{ ...data, serviceId: `SV${Date.now()}` }, ...prev]);
      toast.success('Thêm dịch vụ thành công');
    }
    setDialogOpen(false);
  };

  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14 }, '& .MuiInputLabel-root': { fontSize: 14 } };

  const columns: GridColDef[] = [
    { field: 'serviceId', headerName: 'Mã DV', width: 100 },
    { field: 'name', headerName: 'Tên dịch vụ', flex: 1, minWidth: 200 },
    { field: 'price', headerName: 'Giá', width: 130, renderCell: ({ value }) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(value)}</span> },
    { field: 'duration', headerName: 'Thời lượng', width: 120, renderCell: ({ value }) => formatDuration(value) },
    { field: 'commissionRate', headerName: 'Hoa hồng', width: 110, renderCell: ({ value }) => `${value}%` },
    { field: 'statusOfService', headerName: 'Trạng thái', width: 140, renderCell: ({ value }) => <StatusChip status={value} type="service" /> },
    {
      field: 'actions', headerName: 'Thao tác', width: 120, sortable: false,
      renderCell: ({ row }) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <IconButton size="small" onClick={() => openEdit(row)} sx={{ color: 'var(--primary)', '&:hover': { background: '#FEF3C7' } }}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => setDeleteTarget(row)} sx={{ color: '#EF4444', '&:hover': { background: '#FEE2E2' } }}><DeleteIcon fontSize="small" /></IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Quản lý dịch vụ" subtitle={`${services.length} dịch vụ`} action={{ label: 'Thêm dịch vụ', onClick: openCreate }} />
      <div style={{ marginBottom: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '16px 20px', boxShadow: 'var(--shadow-card)' }}>
        <TextField placeholder="Tìm kiếm dịch vụ..." value={search} onChange={e => setSearch(e.target.value)} size="small"
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'var(--text-tertiary)' }} /></InputAdornment> } }}
          sx={{ width: 360, ...inputSx }} />
      </div>
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <DataGrid rows={filtered} columns={columns} getRowId={r => r.serviceId} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 20]} autoHeight disableRowSelectionOnClick
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }}
          localeText={{ MuiTablePagination: { labelRowsPerPage: 'Hàng mỗi trang:', labelDisplayedRows: ({ from, to, count }: any) => `${from}–${to} / ${count}` }, noRowsLabel: 'Không có dữ liệu' } as any} />
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', minWidth: 520, background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17, pb: 0 }}>{editing ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <form noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Controller name="name" control={control} render={({ field }) => (
              <TextField {...field} label="Tên dịch vụ *" error={!!errors.name} helperText={errors.name?.message} fullWidth size="small" sx={inputSx} />
            )} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Controller name="price" control={control} render={({ field }) => (
                <TextField {...field} onChange={e => field.onChange(Number(e.target.value))} label="Giá (VNĐ) *" type="number" error={!!errors.price} helperText={errors.price?.message} fullWidth size="small" sx={inputSx} />
              )} />
              <Controller name="duration" control={control} render={({ field }) => (
                <TextField {...field} onChange={e => field.onChange(Number(e.target.value))} label="Thời lượng (phút) *" type="number" error={!!errors.duration} helperText={errors.duration?.message} fullWidth size="small" sx={inputSx} />
              )} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Controller name="commissionRate" control={control} render={({ field }) => (
                <TextField {...field} onChange={e => field.onChange(Number(e.target.value))} label="Hoa hồng (%)" type="number" error={!!errors.commissionRate} helperText={errors.commissionRate?.message} fullWidth size="small" sx={inputSx} />
              )} />
              <Controller name="statusOfService" control={control} render={({ field }) => (
                <FormControl fullWidth size="small" sx={inputSx}>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select {...field} label="Trạng thái" sx={{ borderRadius: '10px' }}>
                    <MenuItem value={StatusOfService.ACTIVE}>Đang hoạt động</MenuItem>
                    <MenuItem value={StatusOfService.INACTIVE}>Ngừng hoạt động</MenuItem>
                  </Select>
                </FormControl>
              )} />
            </div>
            <Controller name="description" control={control} render={({ field }) => (
              <TextField {...field} label="Mô tả *" multiline rows={3} error={!!errors.description} helperText={errors.description?.message} fullWidth size="small" sx={inputSx} />
            )} />
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 600, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>
            {editing ? 'Lưu thay đổi' : 'Thêm dịch vụ'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} title="Xóa dịch vụ" message={`Bạn có chắc muốn xóa dịch vụ "${deleteTarget?.name}"?`} confirmLabel="Xóa" severity="error"
        onConfirm={() => { setServices(prev => prev.filter(s => s.serviceId !== deleteTarget!.serviceId)); toast.success('Đã xóa dịch vụ'); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)} />
    </div>
  );
};

export default ServicesPage;
