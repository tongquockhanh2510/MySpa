import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select,
  Skeleton, TextField,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import PageHeader from '@components/common/PageHeader';
import StatusChip from '@components/common/StatusChip';
import ConfirmDialog from '@components/common/ConfirmDialog';
import ExportButtons from '@components/common/ExportButtons';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/api/customers';
import { getGenderLabel } from '@utils/formatters';
import { exportToExcel } from '@utils/exportExcel';
import { Gender } from '@/types';
import type { Customer, CustomerFormData } from '@/types';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import WcIcon from '@mui/icons-material/Wc';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useIsMobile } from '@hooks/useIsMobile';
import CustomersListMobile from './CustomersListMobile';
import './CustomersPage.css';

const schema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  phone: z.string().regex(/^(0|\+84)\d{9}$/, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ').or(z.literal('')),
  gender: z.nativeEnum(Gender),
  note: z.string().optional(),
});

const inputSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14 },
  '& .MuiInputLabel-root': { fontSize: 14 },
};

const CustomersPage: React.FC = () => {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [noteView, setNoteView] = useState<Customer | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '', gender: undefined, note: '' },
  });

  const fetchCustomers = async (query = '') => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getCustomers(query);
      setCustomers(data);
    } catch (err) {
      console.error(err);
      setLoadError('Không thể tải danh sách khách hàng. Vui lòng kiểm tra đăng nhập hoặc thử lại.');
      toast.error('Lỗi khi tải danh sách khách hàng từ database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(search);
  }, [search]);

  useEffect(() => {
    const customerId = searchParams.get('customerId');
    if (!customerId || !customers.length) return;
    const target = customers.find((customer) => customer.customerId === customerId);
    if (target) openEdit(target);
  }, [customers, searchParams]);

  const summary = useMemo(() => {
    const totalPoints = customers.reduce((sum, customer) => sum + Number(customer.loyaltyPoints || 0), 0);
    return {
      total: customers.length,
      female: customers.filter((customer) => customer.gender === Gender.FEMALE).length,
      male: customers.filter((customer) => customer.gender === Gender.MALE).length,
      totalPoints,
    };
  }, [customers]);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', phone: '', email: '', gender: undefined, note: '' });
    setDialogOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    reset(customer);
    setDialogOpen(true);
  };

  const onSubmit = async (data: CustomerFormData) => {
    try {
      if (editing) {
        await updateCustomer(editing.customerId, data);
        toast.success('Cập nhật khách hàng thành công');
      } else {
        await createCustomer(data);
        toast.success('Thêm khách hàng thành công');
      }
      setDialogOpen(false);
      fetchCustomers(search);
    } catch (err) {
      console.error(err);
      toast.error(editing ? 'Lỗi khi cập nhật khách hàng' : 'Lỗi khi thêm khách hàng');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCustomer(deleteTarget.customerId);
      toast.success('Đã xóa khách hàng');
      setDeleteTarget(null);
      fetchCustomers(search);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xóa khách hàng');
    }
  };

  const handleExportExcel = () => {
    exportToExcel(
      customers.map(customer => ({
        'Mã KH': customer.displayCode || customer.customerId,
        'Họ tên': customer.name,
        'Điện thoại': customer.phone,
        'Email': customer.email,
        'Giới tính': getGenderLabel(customer.gender),
        'Điểm tích lũy': customer.loyaltyPoints,
        'Ghi chú': customer.note ?? '',
      })),
      'Danh_sach_khach_hang',
      'Khách hàng'
    );
    toast.success('Xuất Excel thành công');
  };

  const columns: GridColDef[] = [
    { field: 'displayCode', headerName: 'Mã KH', width: 120, renderCell: ({ row }) => row.displayCode || row.customerId },
    {
      field: 'name',
      headerName: 'Khách hàng',
      flex: 1,
      minWidth: 190,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) => (
        <div className="customers-name-cell">
          <strong>{row.name}</strong>
        </div>
      ),
    },
    { field: 'phone', headerName: 'Điện thoại', width: 140, renderCell: ({ value }) => <span className="customers-muted-cell">{value || 'Chưa có SĐT'}</span> },
    { field: 'gender', headerName: 'Giới tính', width: 120, renderCell: ({ value }) => <StatusChip status={value} type="gender" /> },
    {
      field: 'loyaltyPoints',
      headerName: 'Điểm tích lũy',
      width: 140,
      renderCell: ({ value }) => (
        <Chip label={`${value || 0} điểm`} size="small" className="customers-points-chip" />
      ),
    },
    {
      field: 'note',
      headerName: 'Ghi chú',
      flex: 1,
      minWidth: 180,
      renderCell: ({ row, value }) => value ? (
        <button
          type="button"
          className="customers-note-cell"
          title="Nhấn để xem ghi chú đầy đủ"
          onClick={(event) => { event.stopPropagation(); setNoteView(row); }}
        >
          {value}
        </button>
      ) : (
        <span className="customers-muted-cell">Không có ghi chú</span>
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 120,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) => (
        <div className="customers-actions">
          <IconButton size="small" aria-label="Cập nhật khách hàng" onClick={(event) => { event.stopPropagation(); openEdit(row); }} className="customers-icon-button customers-icon-button--edit">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label="Xóa khách hàng" onClick={(event) => { event.stopPropagation(); setDeleteTarget(row); }} className="customers-icon-button customers-icon-button--delete">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <main className="customers-page animate-fadeIn">
      <PageHeader
        title="Quản lý khách hàng"
        subtitle={`${customers.length} khách hàng`}
        action={{ label: 'Thêm khách hàng', onClick: openCreate }}
        extra={<ExportButtons onExportExcel={handleExportExcel} />}
      />

      {loadError && <Alert severity="warning" className="customers-alert">{loadError}</Alert>}

      <section className="customers-summary" aria-label="Tóm tắt khách hàng">
        <div className="customers-summary-card"><span><PeopleIcon /></span><div><strong>{loading ? '...' : summary.total}</strong><p>Tổng khách hàng</p></div></div>
        <div className="customers-summary-card"><span><WcIcon /></span><div><strong>{loading ? '...' : summary.female}</strong><p>Khách nữ</p></div></div>
        <div className="customers-summary-card"><span><WcIcon /></span><div><strong>{loading ? '...' : summary.male}</strong><p>Khách nam</p></div></div>
        <div className="customers-summary-card"><span><LoyaltyIcon /></span><div><strong>{loading ? '...' : summary.totalPoints.toLocaleString('vi-VN')}</strong><p>Điểm tích lũy</p></div></div>
      </section>

      <section className="customers-toolbar" aria-label="Bộ lọc khách hàng">
        <TextField
          placeholder="Tìm kiếm theo tên, điện thoại, email..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          size="small"
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'var(--text-tertiary)' }} /></InputAdornment> } }}
          sx={{ flex: '1 1 320px', ...inputSx }}
        />
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => fetchCustomers(search)}
          disabled={loading}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, borderColor: 'var(--border-color)', color: 'var(--text-secondary)', minHeight: 40 }}
        >
          Làm mới
        </Button>
      </section>

      <section className="customers-panel">
        {isMobile ? (
          <CustomersListMobile
            rows={customers}
            loading={loading}
            emptyMessage={search ? 'Không tìm thấy khách hàng phù hợp' : 'Không có dữ liệu'}
            onOpenEdit={openEdit}
            onDelete={(customer) => setDeleteTarget(customer)}
            onViewNote={(customer) => setNoteView(customer)}
          />
        ) : loading ? (
          <div className="customers-skeleton" aria-busy="true" aria-label="Đang tải khách hàng">
            {Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} variant="rounded" height={48} />)}
          </div>
        ) : (
          <DataGrid
            rows={customers}
            columns={columns}
            getRowId={(row) => row.customerId}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[10, 20, 50]}
            autoHeight
            disableRowSelectionOnClick
            onRowClick={({ row }) => openEdit(row)}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)', borderRadius: '0 !important' },
              '& .MuiDataGrid-footerContainer': { borderTop: '1px solid var(--divider)' },
              '& .MuiDataGrid-cell': { alignItems: 'center' },
              '& .MuiDataGrid-row': { cursor: 'pointer' },
            }}
            localeText={{
              MuiTablePagination: {
                labelRowsPerPage: 'Hàng mỗi trang:',
                labelDisplayedRows: ({ from, to, count }: any) => `${from}-${to} / ${count}`,
              },
              noRowsLabel: search ? 'Không tìm thấy khách hàng phù hợp' : 'Không có dữ liệu',
              footerRowSelected: (count: any) => `${count} hàng được chọn`,
            } as any}
          />
        )}
      </section>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: '16px', width: 'min(520px, calc(100vw - 32px))', background: 'var(--bg-secondary)' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 0 }}>
          {editing ? 'Cập nhật khách hàng' : 'Thêm khách hàng mới'}
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <form noValidate className="customers-form">
            <Controller name="name" control={control} render={({ field }) => (
              <TextField {...field} label="Họ và tên *" error={!!errors.name} helperText={errors.name?.message} fullWidth size="small" sx={inputSx} />
            )} />
            <div className="customers-form-grid">
              <Controller name="phone" control={control} render={({ field }) => (
                <TextField {...field} label="Điện thoại *" error={!!errors.phone} helperText={errors.phone?.message} fullWidth size="small" sx={inputSx} />
              )} />
              <Controller name="gender" control={control} render={({ field }) => (
                <FormControl fullWidth size="small" sx={inputSx}>
                  <InputLabel>Giới tính</InputLabel>
                  <Select {...field} value={field.value ?? ''} label="Giới tính" displayEmpty>
                    <MenuItem value="" disabled>Chọn giới tính</MenuItem>
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
              <TextField {...field} label="Ghi chú" multiline rows={3} fullWidth size="small" sx={inputSx} />
            )} />
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', '&:hover': { background: 'var(--bg-tertiary)' } }}>
            Hủy
          </Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 700, background: 'linear-gradient(135deg, #D97706, #F59E0B)', '&:hover': { background: '#B45309' } }}>
            {editing ? 'Lưu thay đổi' : 'Thêm khách hàng'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!noteView}
        onClose={() => setNoteView(null)}
        slotProps={{ paper: { sx: { borderRadius: '16px', width: 'min(480px, calc(100vw - 32px))', background: 'var(--bg-secondary)' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 16, pb: 1 }}>
          Ghi chú — {noteView?.name}
        </DialogTitle>
        <DialogContent>
          <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            {noteView?.note}
          </p>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNoteView(null)} sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', color: 'var(--text-secondary)' }}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa khách hàng"
        message={`Bạn có chắc chắn muốn xóa khách hàng "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        severity="error"
      />
    </main>
  );
};

export default CustomersPage;

