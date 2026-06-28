import React, { useEffect, useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle,
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
import { getEmployees } from '@/api/catalog';
import { formatCurrency } from '@utils/formatters';
import { exportToExcel } from '@utils/exportExcel';
import { StatusOfEmployee } from '@/types';
import type { Employee, EmployeeFormData } from '@/types';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BadgeIcon from '@mui/icons-material/Badge';
import GroupsIcon from '@mui/icons-material/Groups';
import PaidIcon from '@mui/icons-material/Paid';
import WorkOffIcon from '@mui/icons-material/WorkOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import './EmployeesPage.css';

const schema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  phone: z.string().regex(/^(0|\+84)\d{9}$/, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ'),
  position: z.string().min(2, 'Vui lòng nhập chức vụ'),
  baseSalary: z.number({ message: 'Nhập số hợp lệ' }).positive('Lương phải > 0'),
  statusOfEmployee: z.nativeEnum(StatusOfEmployee),
});

const inputSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14 },
  '& .MuiInputLabel-root': { fontSize: 14 },
};

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<EmployeeFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      position: '',
      baseSalary: 7000000,
      statusOfEmployee: StatusOfEmployee.ACTIVE,
    },
  });

  const fetchEmployees = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error(err);
      setLoadError('Không thể tải danh sách nhân viên. Vui lòng kiểm tra đăng nhập hoặc thử lại.');
      toast.error('Lỗi khi tải danh sách nhân viên từ database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesSearch = !query
        || employee.name.toLowerCase().includes(query)
        || employee.phone.includes(query)
        || employee.position.toLowerCase().includes(query)
        || employee.email.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'ALL' || employee.statusOfEmployee === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [employees, search, statusFilter]);

  const summary = useMemo(() => {
    const active = employees.filter((employee) => employee.statusOfEmployee === StatusOfEmployee.ACTIVE).length;
    const inactive = employees.filter((employee) => employee.statusOfEmployee === StatusOfEmployee.INACTIVE).length;
    const payroll = employees.reduce((sum, employee) => sum + Number(employee.baseSalary || 0), 0);
    return { total: employees.length, active, inactive, payroll };
  }, [employees]);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', phone: '', email: '', position: '', baseSalary: 7000000, statusOfEmployee: StatusOfEmployee.ACTIVE });
    setDialogOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setEditing(employee);
    reset(employee);
    setDialogOpen(true);
  };

  const onSubmit = (data: EmployeeFormData) => {
    if (editing) {
      setEmployees((prev) => prev.map((employee) => employee.employeeId === editing.employeeId ? { ...employee, ...data } : employee));
      toast.success('Cập nhật nhân viên thành công');
    } else {
      setEmployees((prev) => [{ ...data, employeeId: `E${Date.now()}` }, ...prev]);
      toast.success('Thêm nhân viên thành công');
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setEmployees((prev) => prev.filter((employee) => employee.employeeId !== deleteTarget.employeeId));
    toast.success('Đã xóa nhân viên');
    setDeleteTarget(null);
  };

  const handleExportExcel = () => {
    exportToExcel(
      employees.map(employee => ({
        'Mã NV': employee.employeeId,
        'Họ tên': employee.name,
        'Điện thoại': employee.phone,
        'Email': employee.email,
        'Chức vụ': employee.position,
        'Lương cơ bản': employee.baseSalary,
        'Trạng thái': employee.statusOfEmployee === StatusOfEmployee.ACTIVE ? 'Đang làm việc' : 'Đã nghỉ việc',
      })),
      'Danh_sach_nhan_vien',
      'Nhân viên'
    );
    toast.success('Xuất Excel thành công');
  };

  const columns: GridColDef[] = [
    { field: 'employeeId', headerName: 'Mã NV', width: 110 },
    {
      field: 'name',
      headerName: 'Nhân viên',
      flex: 1,
      minWidth: 190,
      renderCell: ({ row }) => (
        <div className="employees-name-cell">
          <strong>{row.name}</strong>
          <span>{row.phone}</span>
        </div>
      ),
    },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 190, renderCell: ({ value }) => <span className="employees-muted-cell">{value}</span> },
    { field: 'position', headerName: 'Chức vụ', flex: 1, minWidth: 160, renderCell: ({ value }) => <span className="employees-position-cell">{value}</span> },
    { field: 'baseSalary', headerName: 'Lương cơ bản', width: 150, renderCell: ({ value }) => <span className="employees-salary">{formatCurrency(value || 0)}</span> },
    { field: 'statusOfEmployee', headerName: 'Trạng thái', width: 150, renderCell: ({ value }) => <StatusChip status={value} type="employee" /> },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 120,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) => (
        <div className="employees-actions">
          <IconButton size="small" aria-label="Cập nhật nhân viên" onClick={() => openEdit(row)} className="employees-icon-button employees-icon-button--edit">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label="Xóa nhân viên" onClick={() => setDeleteTarget(row)} className="employees-icon-button employees-icon-button--delete">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <main className="employees-page animate-fadeIn">
      <PageHeader
        title="Quản lý nhân viên"
        subtitle={`${employees.length} nhân viên`}
        action={{ label: 'Thêm nhân viên', onClick: openCreate }}
        extra={<ExportButtons onExportExcel={handleExportExcel} />}
      />

      {loadError && <Alert severity="warning" className="employees-alert">{loadError}</Alert>}

      <section className="employees-summary" aria-label="Tóm tắt nhân viên">
        <div className="employees-summary-card"><span><GroupsIcon /></span><div><strong>{loading ? '...' : summary.total}</strong><p>Tổng nhân viên</p></div></div>
        <div className="employees-summary-card"><span><BadgeIcon /></span><div><strong>{loading ? '...' : summary.active}</strong><p>Đang làm việc</p></div></div>
        <div className="employees-summary-card"><span><WorkOffIcon /></span><div><strong>{loading ? '...' : summary.inactive}</strong><p>Đã nghỉ việc</p></div></div>
        <div className="employees-summary-card"><span><PaidIcon /></span><div><strong>{loading ? '...' : formatCurrency(summary.payroll)}</strong><p>Tổng lương cơ bản</p></div></div>
      </section>

      <section className="employees-toolbar" aria-label="Bộ lọc nhân viên">
        <TextField
          placeholder="Tìm kiếm theo tên, điện thoại, email, chức vụ..."
          value={search}
          onChange={event => setSearch(event.target.value)}
          size="small"
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'var(--text-tertiary)' }} /></InputAdornment> } }}
          sx={{ flex: '1 1 320px', ...inputSx }}
        />
        <FormControl size="small" sx={{ minWidth: 210, ...inputSx }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select value={statusFilter} label="Trạng thái" onChange={event => setStatusFilter(event.target.value)}>
            <MenuItem value="ALL">Tất cả trạng thái</MenuItem>
            <MenuItem value={StatusOfEmployee.ACTIVE}>Đang làm việc</MenuItem>
            <MenuItem value={StatusOfEmployee.INACTIVE}>Đã nghỉ việc</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchEmployees}
          disabled={loading}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, borderColor: 'var(--border-color)', color: 'var(--text-secondary)', minHeight: 40 }}
        >
          Làm mới
        </Button>
      </section>

      <section className="employees-panel">
        {loading ? (
          <div className="employees-skeleton" aria-busy="true" aria-label="Đang tải nhân viên">
            {Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} variant="rounded" height={48} />)}
          </div>
        ) : (
          <DataGrid
            rows={filtered}
            columns={columns}
            getRowId={(row) => row.employeeId}
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
              noRowsLabel: search || statusFilter !== 'ALL' ? 'Không tìm thấy nhân viên phù hợp' : 'Không có dữ liệu',
            } as any}
          />
        )}
      </section>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: '16px', width: 'min(560px, calc(100vw - 32px))', background: 'var(--bg-secondary)' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 0 }}>
          {editing ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <form noValidate className="employees-form">
            <Controller name="name" control={control} render={({ field }) => (
              <TextField {...field} label="Họ và tên *" error={!!errors.name} helperText={errors.name?.message} fullWidth size="small" sx={inputSx} />
            )} />
            <div className="employees-form-grid">
              <Controller name="phone" control={control} render={({ field }) => (
                <TextField {...field} label="Điện thoại *" error={!!errors.phone} helperText={errors.phone?.message} fullWidth size="small" sx={inputSx} />
              )} />
              <Controller name="email" control={control} render={({ field }) => (
                <TextField {...field} label="Email *" error={!!errors.email} helperText={errors.email?.message} fullWidth size="small" sx={inputSx} />
              )} />
            </div>
            <div className="employees-form-grid">
              <Controller name="position" control={control} render={({ field }) => (
                <TextField {...field} label="Chức vụ *" error={!!errors.position} helperText={errors.position?.message} fullWidth size="small" sx={inputSx} />
              )} />
              <Controller name="baseSalary" control={control} render={({ field }) => (
                <TextField {...field} onChange={event => field.onChange(Number(event.target.value))} label="Lương cơ bản (VNĐ) *" type="number" error={!!errors.baseSalary} helperText={errors.baseSalary?.message} fullWidth size="small" sx={inputSx} />
              )} />
            </div>
            <Controller name="statusOfEmployee" control={control} render={({ field }) => (
              <FormControl fullWidth size="small" sx={inputSx}>
                <InputLabel>Trạng thái</InputLabel>
                <Select {...field} label="Trạng thái">
                  <MenuItem value={StatusOfEmployee.ACTIVE}>Đang làm việc</MenuItem>
                  <MenuItem value={StatusOfEmployee.INACTIVE}>Đã nghỉ việc</MenuItem>
                </Select>
              </FormControl>
            )} />
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            Hủy
          </Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 700, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>
            {editing ? 'Lưu thay đổi' : 'Thêm nhân viên'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa nhân viên"
        message={`Bạn có chắc muốn xóa nhân viên "${deleteTarget?.name}"?`}
        confirmLabel="Xóa"
        severity="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
};

export default EmployeesPage;
