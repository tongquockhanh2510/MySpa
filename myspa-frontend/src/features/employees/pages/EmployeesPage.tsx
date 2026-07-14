import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { createEmployee, createEmployeeAccount, deleteEmployee, getEmployees, getServices, updateEmployee } from '@/api/catalog';
import { useAppSelector } from '@hooks/useAppSelector';
import { formatCurrency } from '@utils/formatters';
import { exportToExcel } from '@utils/exportExcel';
import { hasAnyRole } from '@utils/authorization';
import { StatusOfEmployee } from '@/types';
import type { Employee, EmployeeFormData, Service } from '@/types';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyIcon from '@mui/icons-material/Key';
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
  hireDate: z.string().optional(),
  employeeLevel: z.enum(['TRAINEE', 'STANDARD', 'SENIOR']),
  commissionRate: z.number().min(0).max(100),
  skillServiceIds: z.array(z.string()),
  workDays: z.array(z.string()),
  shiftStart: z.string().optional(),
  shiftEnd: z.string().optional(),
});

const inputSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14 },
  '& .MuiInputLabel-root': { fontSize: 14 },
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Chủ spa',
  MANAGER: 'Quản lý',
  RECEPTIONIST: 'Lễ tân',
  THERAPIST: 'Kỹ thuật viên',
  STAFF: 'Nhân viên',
};

const EmployeesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const canManageEmployees = hasAnyRole(user, ['ADMIN', 'MANAGER']);
  const isAdmin = hasAnyRole(user, ['ADMIN']);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [accountTarget, setAccountTarget] = useState<Employee | null>(null);
  const [accountForm, setAccountForm] = useState({ userName: '', password: '', role: 'THERAPIST' });
  const [accountSaving, setAccountSaving] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<EmployeeFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      position: '',
      baseSalary: 7000000,
      statusOfEmployee: StatusOfEmployee.ACTIVE,
      hireDate: '',
      employeeLevel: 'STANDARD',
      commissionRate: 0,
      skillServiceIds: [],
      workDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      shiftStart: '08:00',
      shiftEnd: '17:00',
    },
  });

  const fetchEmployees = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [data, serviceData] = await Promise.all([getEmployees(), getServices()]);
      setEmployees(data);
      setServices(serviceData);
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

  useEffect(() => {
    const employeeId = searchParams.get('employeeId');
    if (!employeeId || !employees.length) return;
    const target = employees.find((employee) => employee.employeeId === employeeId);
    if (target) openEdit(target);
  }, [employees, searchParams]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesSearch = !query
        || employee.name.toLowerCase().includes(query)
        || employee.displayCode?.toLowerCase().includes(query)
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
    reset({ name: '', phone: '', email: '', position: '', baseSalary: 7000000, statusOfEmployee: StatusOfEmployee.ACTIVE, hireDate: '', employeeLevel: 'STANDARD', commissionRate: 0, skillServiceIds: [], workDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'], shiftStart: '08:00', shiftEnd: '17:00' });
    setDialogOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setEditing(employee);
    reset(employee);
    setDialogOpen(true);
  };

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      const saved = editing
        ? await updateEmployee(editing.employeeId, data)
        : await createEmployee(data);

      setEmployees((prev) => editing
        ? prev.map((employee) => employee.employeeId === editing.employeeId ? saved : employee)
        : [saved, ...prev]);
      toast.success(editing ? 'Cập nhật nhân viên thành công' : 'Thêm nhân viên thành công');
      setDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || (editing ? 'Cập nhật nhân viên thất bại' : 'Thêm nhân viên thất bại'));
    }
  };

  const openCreateAccount = (employee: Employee) => {
    setAccountTarget(employee);
    const suggested = (employee.email || '').split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
    setAccountForm({ userName: suggested, password: '', role: 'THERAPIST' });
  };

  const handleCreateAccount = async () => {
    if (!accountTarget) return;
    if (accountForm.userName.trim().length < 4) {
      toast.warning('Tên đăng nhập phải có ít nhất 4 ký tự');
      return;
    }
    if (accountForm.password.length < 6) {
      toast.warning('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setAccountSaving(true);
    try {
      const saved = await createEmployeeAccount(accountTarget.employeeId, {
        userName: accountForm.userName.trim(),
        password: accountForm.password,
        role: accountForm.role,
      });
      setEmployees((prev) => prev.map((employee) => (
        employee.employeeId === accountTarget.employeeId ? saved : employee
      )));
      toast.success(`Đã tạo tài khoản "${accountForm.userName.trim()}" cho ${accountTarget.name}`);
      setAccountTarget(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Tạo tài khoản thất bại');
    } finally {
      setAccountSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const saved = await deleteEmployee(deleteTarget.employeeId);
      setEmployees((prev) => prev.map((employee) => employee.employeeId === deleteTarget.employeeId ? saved : employee));
      toast.success('Đã đánh dấu nhân viên nghỉ việc');
      setDeleteTarget(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Xóa nhân viên thất bại');
    }
  };

  const handleExportExcel = () => {
    exportToExcel(
      employees.map(employee => ({
        'Mã NV': employee.displayCode || employee.employeeId,
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
    { field: 'displayCode', headerName: 'Mã NV', width: 120, renderCell: ({ row }) => row.displayCode || row.employeeId },
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
    {
      field: 'accountUserName',
      headerName: 'Tài khoản',
      width: 190,
      sortable: false,
      renderCell: ({ row }) => row.accountUserName ? (
        <div className="employees-name-cell">
          <strong>{row.accountUserName}{row.accountActive === false ? ' (khóa)' : ''}</strong>
          <span>{(row.accountRoles || []).map((role: string) => ROLE_LABELS[role] || role).join(', ')}</span>
        </div>
      ) : (
        isAdmin ? (
          <Button
            size="small"
            startIcon={<KeyIcon fontSize="small" />}
            onClick={(event) => { event.stopPropagation(); openCreateAccount(row); }}
            sx={{ borderRadius: '8px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 700, fontSize: 12 }}
          >
            Cấp tài khoản
          </Button>
        ) : (
          <span className="employees-muted-cell">Chưa có</span>
        )
      ),
    },
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
          <IconButton size="small" aria-label="Cập nhật nhân viên" onClick={(event) => { event.stopPropagation(); openEdit(row); }} className="employees-icon-button employees-icon-button--edit">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label="Xóa nhân viên" onClick={(event) => { event.stopPropagation(); setDeleteTarget(row); }} className="employees-icon-button employees-icon-button--delete">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </div>
      ),
    },
  ];

  const visibleColumns = canManageEmployees
    ? columns
    : columns.filter((column) => column.field !== 'actions');

  return (
    <main className="employees-page animate-fadeIn">
      <PageHeader
        title="Quản lý nhân viên"
        subtitle={`${employees.length} nhân viên`}
        action={canManageEmployees ? { label: 'Thêm nhân viên', onClick: openCreate } : undefined}
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
            columns={visibleColumns}
            getRowId={(row) => row.employeeId}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[10, 20]}
            autoHeight
            disableRowSelectionOnClick
            onRowClick={({ row }) => openEdit(row)}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' },
              '& .MuiDataGrid-cell': { alignItems: 'center' },
              '& .MuiDataGrid-row': { cursor: 'pointer' },
            }}
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
              <Controller name="hireDate" control={control} render={({ field }) => (
                <TextField {...field} label="Ngày vào làm" type="date" slotProps={{ inputLabel: { shrink: true } }} fullWidth size="small" sx={inputSx} />
              )} />
              <Controller name="employeeLevel" control={control} render={({ field }) => (
                <FormControl fullWidth size="small" sx={inputSx}><InputLabel>Cấp bậc</InputLabel><Select {...field} label="Cấp bậc"><MenuItem value="TRAINEE">Học việc</MenuItem><MenuItem value="STANDARD">Chính thức</MenuItem><MenuItem value="SENIOR">Cao cấp</MenuItem></Select></FormControl>
              )} />
            </div>
            <Controller name="commissionRate" control={control} render={({ field }) => (
              <TextField {...field} onChange={event => field.onChange(Number(event.target.value))} label="Hoa hồng mặc định (%)" type="number" fullWidth size="small" sx={inputSx} />
            )} />
            <Controller name="skillServiceIds" control={control} render={({ field }) => (
              <FormControl fullWidth size="small" sx={inputSx}>
                <InputLabel>Kỹ năng dịch vụ</InputLabel>
                <Select {...field} multiple label="Kỹ năng dịch vụ" renderValue={(selected) => `${selected.length} dịch vụ`}>
                  {services.map(service => <MenuItem key={service.serviceId} value={service.serviceId}>{service.name}</MenuItem>)}
                </Select>
              </FormControl>
            )} />
            <Controller name="workDays" control={control} render={({ field }) => (
              <FormControl fullWidth size="small" sx={inputSx}>
                <InputLabel>Ngày làm trong tuần</InputLabel>
                <Select {...field} multiple label="Ngày làm trong tuần" renderValue={(selected) => `${selected.length} ngày`}>
                  {[['MONDAY','Thứ 2'],['TUESDAY','Thứ 3'],['WEDNESDAY','Thứ 4'],['THURSDAY','Thứ 5'],['FRIDAY','Thứ 6'],['SATURDAY','Thứ 7'],['SUNDAY','Chủ nhật']].map(([value,label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
                </Select>
              </FormControl>
            )} />
            <div className="employees-form-grid">
              <Controller name="shiftStart" control={control} render={({ field }) => <TextField {...field} label="Bắt đầu ca" type="time" slotProps={{ inputLabel: { shrink: true } }} fullWidth size="small" sx={inputSx} />} />
              <Controller name="shiftEnd" control={control} render={({ field }) => <TextField {...field} label="Kết thúc ca" type="time" slotProps={{ inputLabel: { shrink: true } }} fullWidth size="small" sx={inputSx} />} />
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

      <Dialog
        open={!!accountTarget}
        onClose={() => !accountSaving && setAccountTarget(null)}
        slotProps={{ paper: { sx: { borderRadius: '16px', width: 'min(460px, calc(100vw - 32px))', background: 'var(--bg-secondary)' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 0 }}>
          Cấp tài khoản — {accountTarget?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Tên đăng nhập *"
            value={accountForm.userName}
            onChange={(event) => setAccountForm((prev) => ({ ...prev, userName: event.target.value }))}
            helperText="Chỉ gồm chữ thường, số, dấu chấm, gạch dưới, gạch ngang"
            fullWidth size="small" sx={inputSx}
          />
          <TextField
            label="Mật khẩu *"
            type="password"
            value={accountForm.password}
            onChange={(event) => setAccountForm((prev) => ({ ...prev, password: event.target.value }))}
            helperText="Ít nhất 6 ký tự — nhân viên có thể tự đổi sau khi đăng nhập"
            fullWidth size="small" sx={inputSx}
          />
          <FormControl fullWidth size="small" sx={inputSx}>
            <InputLabel>Vai trò *</InputLabel>
            <Select
              value={accountForm.role}
              label="Vai trò *"
              onChange={(event) => setAccountForm((prev) => ({ ...prev, role: event.target.value }))}
            >
              <MenuItem value="MANAGER">Quản lý — toàn quyền vận hành, xem báo cáo & lương</MenuItem>
              <MenuItem value="RECEPTIONIST">Lễ tân — khách hàng, lịch hẹn, đơn hàng, khuyến mãi</MenuItem>
              <MenuItem value="THERAPIST">Kỹ thuật viên — xem lịch hẹn, dịch vụ, sản phẩm</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setAccountTarget(null)} disabled={accountSaving} sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            Hủy
          </Button>
          <Button onClick={handleCreateAccount} disabled={accountSaving} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 700, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>
            {accountSaving ? 'Đang tạo...' : 'Tạo tài khoản'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Đánh dấu nghỉ việc"
        message={`Bạn có chắc muốn đánh dấu nhân viên "${deleteTarget?.name}" là đã nghỉ việc?`}
        confirmLabel="Xác nhận"
        severity="warning"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
};

export default EmployeesPage;

