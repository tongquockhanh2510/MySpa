import React, { useState, useMemo, useEffect } from 'react';
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
import ExportButtons from '@components/common/ExportButtons';
import { getEmployees } from '@/api/catalog';
import { formatCurrency } from '@utils/formatters';
import { exportToExcel } from '@utils/exportExcel';
import { StatusOfEmployee } from '@/types';
import type { Employee, EmployeeFormData } from '@/types';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const schema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  phone: z.string().regex(/^(0|\+84)\d{9}$/, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ'),
  position: z.string().min(2, 'Vui lòng nhập chức vụ'),
  baseSalary: z.number({ message: 'Nhập số hợp lệ' }).positive('Lương phải > 0'),
  statusOfEmployee: z.nativeEnum(StatusOfEmployee),
});

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await getEmployees();
        setEmployees(data);
      } catch (err) {
        console.error(err);
        toast.error('Lỗi khi tải danh sách nhân viên từ database');
      }
    };
    fetchEmployees();
  }, []);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<EmployeeFormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '', position: '', baseSalary: 7000000, statusOfEmployee: StatusOfEmployee.ACTIVE },
  });

  const filtered = useMemo(() =>
    employees.filter(e =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.phone.includes(search) ||
      e.position.toLowerCase().includes(search.toLowerCase())
    ), [employees, search]);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', phone: '', email: '', position: '', baseSalary: 7000000, statusOfEmployee: StatusOfEmployee.ACTIVE });
    setDialogOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    reset(emp);
    setDialogOpen(true);
  };

  const onSubmit = (data: EmployeeFormData) => {
    if (editing) {
      setEmployees(prev => prev.map(e => e.employeeId === editing.employeeId ? { ...e, ...data } : e));
      toast.success('Cập nhật nhân viên thành công');
    } else {
      setEmployees(prev => [{ ...data, employeeId: `E${Date.now()}` }, ...prev]);
      toast.success('Thêm nhân viên thành công');
    }
    setDialogOpen(false);
  };

  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14 }, '& .MuiInputLabel-root': { fontSize: 14 } };

  const columns: GridColDef[] = [
    { field: 'employeeId', headerName: 'Mã NV', width: 100 },
    { field: 'name', headerName: 'Họ tên', flex: 1, minWidth: 160 },
    { field: 'phone', headerName: 'Điện thoại', width: 130 },
    { field: 'position', headerName: 'Chức vụ', flex: 1 },
    { field: 'baseSalary', headerName: 'Lương cơ bản', width: 140, renderCell: ({ value }) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(value)}</span> },
    { field: 'statusOfEmployee', headerName: 'Trạng thái', width: 140, renderCell: ({ value }) => <StatusChip status={value} type="employee" /> },
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

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Quản lý nhân viên"
        subtitle={`${employees.length} nhân viên`}
        action={{ label: 'Thêm nhân viên', onClick: openCreate }}
        extra={<ExportButtons onExportExcel={() => { exportToExcel(employees.map(e => ({ 'Mã NV': e.employeeId, 'Họ tên': e.name, 'Điện thoại': e.phone, 'Chức vụ': e.position, 'Lương cơ bản': e.baseSalary })), 'Danh_sach_nhan_vien', 'Nhân viên'); toast.success('Xuất Excel thành công'); }} />}
      />
      <div style={{ marginBottom: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '16px 20px', boxShadow: 'var(--shadow-card)' }}>
        <TextField placeholder="Tìm kiếm theo tên, điện thoại, chức vụ..." value={search} onChange={e => setSearch(e.target.value)} size="small"
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'var(--text-tertiary)' }} /></InputAdornment> } }}
          sx={{ width: 380, ...inputSx }} />
      </div>
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <DataGrid rows={filtered} columns={columns} getRowId={(r) => r.employeeId}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10, 20]} autoHeight disableRowSelectionOnClick
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }}
          localeText={{ MuiTablePagination: { labelRowsPerPage: 'Hàng mỗi trang:', labelDisplayedRows: ({ from, to, count }: any) => `${from}–${to} / ${count}` }, noRowsLabel: 'Không có dữ liệu' } as any} />
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', minWidth: 520, background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17, pb: 0 }}>{editing ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <form noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Controller name="name" control={control} render={({ field }) => (
              <TextField {...field} label="Họ và tên *" error={!!errors.name} helperText={errors.name?.message} fullWidth size="small" sx={inputSx} />
            )} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Controller name="phone" control={control} render={({ field }) => (
                <TextField {...field} label="Điện thoại *" error={!!errors.phone} helperText={errors.phone?.message} fullWidth size="small" sx={inputSx} />
              )} />
              <Controller name="email" control={control} render={({ field }) => (
                <TextField {...field} label="Email *" error={!!errors.email} helperText={errors.email?.message} fullWidth size="small" sx={inputSx} />
              )} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Controller name="position" control={control} render={({ field }) => (
                <TextField {...field} label="Chức vụ *" error={!!errors.position} helperText={errors.position?.message} fullWidth size="small" sx={inputSx} />
              )} />
              <Controller name="baseSalary" control={control} render={({ field }) => (
                <TextField {...field} onChange={e => field.onChange(Number(e.target.value))} label="Lương cơ bản (VNĐ) *" type="number" error={!!errors.baseSalary} helperText={errors.baseSalary?.message} fullWidth size="small" sx={inputSx} />
              )} />
            </div>
            <Controller name="statusOfEmployee" control={control} render={({ field }) => (
              <FormControl fullWidth size="small" sx={inputSx}>
                <InputLabel>Trạng thái</InputLabel>
                <Select {...field} label="Trạng thái" sx={{ borderRadius: '10px' }}>
                  <MenuItem value={StatusOfEmployee.ACTIVE}>Đang làm việc</MenuItem>
                  <MenuItem value={StatusOfEmployee.INACTIVE}>Đã nghỉ việc</MenuItem>
                </Select>
              </FormControl>
            )} />
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 600, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>
            {editing ? 'Lưu thay đổi' : 'Thêm nhân viên'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} title="Xóa nhân viên" message={`Bạn có chắc muốn xóa nhân viên "${deleteTarget?.name}"?`}
        confirmLabel="Xóa" severity="error" onConfirm={() => { setEmployees(prev => prev.filter(e => e.employeeId !== deleteTarget!.employeeId)); toast.success('Đã xóa nhân viên'); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)} />
    </div>
  );
};

export default EmployeesPage;
