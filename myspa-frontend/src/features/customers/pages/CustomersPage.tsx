import React, { useState, useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Select, MenuItem, FormControl,
  InputLabel, InputAdornment, IconButton, Chip,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import PageHeader from '@components/common/PageHeader';
import StatusChip from '@components/common/StatusChip';
import ConfirmDialog from '@components/common/ConfirmDialog';
import ExportButtons from '@components/common/ExportButtons';
import { mockCustomers } from '@utils/mockData';
import { formatCurrency, getGenderLabel } from '@utils/formatters';
import { exportToExcel } from '@utils/exportExcel';
import { Gender } from '@/types';
import type { Customer, CustomerFormData } from '@/types';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

const schema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  phone: z.string().regex(/^(0|\+84)\d{9}$/, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ').or(z.literal('')),
  gender: z.nativeEnum(Gender),
  note: z.string().optional(),
});

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '', gender: Gender.FEMALE, note: '' },
  });

  const filtered = useMemo(() =>
    customers.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    ), [customers, search]);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', phone: '', email: '', gender: Gender.FEMALE, note: '' });
    setDialogOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    reset(customer);
    setDialogOpen(true);
  };

  const onSubmit = (data: CustomerFormData) => {
    if (editing) {
      setCustomers(prev => prev.map(c => c.customerId === editing.customerId ? { ...c, ...data } : c));
      toast.success('Cập nhật khách hàng thành công');
    } else {
      const newCustomer: Customer = {
        ...data,
        customerId: `C${Date.now()}`,
        loyaltyPoints: 0,
      };
      setCustomers(prev => [newCustomer, ...prev]);
      toast.success('Thêm khách hàng thành công');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setCustomers(prev => prev.filter(c => c.customerId !== deleteTarget.customerId));
    toast.success('Đã xóa khách hàng');
    setDeleteTarget(null);
  };

  const handleExportExcel = () => {
    exportToExcel(
      customers.map(c => ({
        'Mã KH': c.customerId, 'Họ tên': c.name, 'Điện thoại': c.phone,
        'Email': c.email, 'Giới tính': getGenderLabel(c.gender),
        'Điểm tích lũy': c.loyaltyPoints, 'Ghi chú': c.note ?? '',
      })),
      'Danh_sach_khach_hang', 'Khách hàng'
    );
    toast.success('Xuất Excel thành công');
  };

  const columns: GridColDef[] = [
    { field: 'customerId', headerName: 'Mã KH', width: 100 },
    { field: 'name', headerName: 'Họ tên', flex: 1, minWidth: 160 },
    { field: 'phone', headerName: 'Điện thoại', width: 130 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
    {
      field: 'gender', headerName: 'Giới tính', width: 100,
      renderCell: ({ value }) => <StatusChip status={value} type="gender" />,
    },
    {
      field: 'loyaltyPoints', headerName: 'Điểm tích lũy', width: 120,
      renderCell: ({ value }) => (
        <Chip label={`${value} điểm`} size="small" sx={{ background: '#FEF3C7', color: '#D97706', fontWeight: 600, fontSize: 11, borderRadius: 1 }} />
      ),
    },
    { field: 'note', headerName: 'Ghi chú', flex: 1 },
    {
      field: 'actions', headerName: 'Thao tác', width: 120, sortable: false,
      renderCell: ({ row }) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <IconButton size="small" onClick={() => openEdit(row)} sx={{ color: 'var(--primary)', '&:hover': { background: '#FEF3C7' } }}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => setDeleteTarget(row)} sx={{ color: '#EF4444', '&:hover': { background: '#FEE2E2' } }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </div>
      ),
    },
  ];

  const inputSx = {
    '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14 },
    '& .MuiInputLabel-root': { fontSize: 14 },
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Quản lý khách hàng"
        subtitle={`${customers.length} khách hàng`}
        action={{ label: 'Thêm khách hàng', onClick: openCreate }}
        extra={<ExportButtons onExportExcel={handleExportExcel} />}
      />

      {/* Search */}
      <div style={{ marginBottom: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '16px 20px', boxShadow: 'var(--shadow-card)' }}>
        <TextField
          placeholder="Tìm kiếm theo tên, điện thoại, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'var(--text-tertiary)' }} /></InputAdornment> } }}
          sx={{ width: 380, ...inputSx }}
        />
      </div>

      {/* Data Grid */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          getRowId={(row) => row.customerId}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 20, 50]}
          autoHeight
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)', borderRadius: '0 !important' },
            '& .MuiDataGrid-footerContainer': { borderTop: '1px solid var(--divider)' },
          }}
          localeText={{
            MuiTablePagination: { labelRowsPerPage: 'Hàng mỗi trang:', labelDisplayedRows: ({ from, to, count }: any) => `${from}–${to} / ${count}` },
            noRowsLabel: 'Không có dữ liệu',
            footerRowSelected: (count: any) => `${count} hàng được chọn` } as any}
        />
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', minWidth: 500, background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17, pb: 0 }}>
          {editing ? 'Cập nhật khách hàng' : 'Thêm khách hàng mới'}
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <form noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Controller name="name" control={control} render={({ field }) => (
              <TextField {...field} label="Họ và tên *" error={!!errors.name} helperText={errors.name?.message} fullWidth size="small" sx={inputSx} />
            )} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Controller name="phone" control={control} render={({ field }) => (
                <TextField {...field} label="Điện thoại *" error={!!errors.phone} helperText={errors.phone?.message} fullWidth size="small" sx={inputSx} />
              )} />
              <Controller name="gender" control={control} render={({ field }) => (
                <FormControl fullWidth size="small" sx={inputSx}>
                  <InputLabel>Giới tính</InputLabel>
                  <Select {...field} label="Giới tính" sx={{ borderRadius: '10px' }}>
                    <MenuItem value={Gender.FEMALE}>Nữ</MenuItem>
                    <MenuItem value={Gender.MALE}>Nam</MenuItem>
                    <MenuItem value={Gender.OTHER}>Khác</MenuItem>
                  </Select>
                </FormControl>
              )} />
            </div>
            <Controller name="email" control={control} render={({ field }) => (
              <TextField {...field} label="Email" error={!!errors.email} helperText={errors.email?.message} fullWidth size="small" sx={inputSx} />
            )} />
            <Controller name="note" control={control} render={({ field }) => (
              <TextField {...field} label="Ghi chú" multiline rows={2} fullWidth size="small" sx={inputSx} />
            )} />
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', '&:hover': { background: 'var(--bg-tertiary)' } }}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 600, background: 'linear-gradient(135deg, #D97706, #F59E0B)', '&:hover': { background: '#B45309' } }}>
            {editing ? 'Lưu thay đổi' : 'Thêm khách hàng'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa khách hàng"
        message={`Bạn có chắc chắn muốn xóa khách hàng "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        severity="error"
      />
    </div>
  );
};

export default CustomersPage;
