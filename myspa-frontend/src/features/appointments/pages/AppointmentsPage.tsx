import React, { useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select,
  Skeleton, TextField, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import PageHeader from '@components/common/PageHeader';
import StatusChip from '@components/common/StatusChip';
import ConfirmDialog from '@components/common/ConfirmDialog';
import { formatDateTime } from '@utils/formatters';
import { cancelAppointment, createAppointment, getAppointments, updateAppointment } from '@/api/appointments';
import { getCustomers } from '@/api/customers';
import { getEmployees, getRooms, getServices } from '@/api/catalog';
import { StatusOfAppointment } from '@/types';
import type { Appointment, Customer, Employee, Service } from '@/types';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TableRowsIcon from '@mui/icons-material/TableRows';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TodayIcon from '@mui/icons-material/Today';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import './AppointmentsPage.css';

const statusColors: Record<string, string> = {
  PENDING: '#D97706',
  CONFIRMED: '#2563EB',
  CHECKED_IN: '#0F766E',
  WAITING: '#B45309',
  IN_PROGRESS: '#7C3AED',
  COMPLETED: '#059669',
  CANCELLED: '#DC2626',
  NO_SHOW: '#4B5563',
  RESCHEDULED: '#4338CA',
};

const statusOptions = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: StatusOfAppointment.PENDING, label: 'Chờ xác nhận' },
  { value: StatusOfAppointment.CONFIRMED, label: 'Đã xác nhận' },
  { value: StatusOfAppointment.CHECKED_IN, label: 'Đã check-in' },
  { value: StatusOfAppointment.WAITING, label: 'Đang chờ' },
  { value: StatusOfAppointment.IN_PROGRESS, label: 'Đang thực hiện' },
  { value: StatusOfAppointment.COMPLETED, label: 'Hoàn thành' },
  { value: StatusOfAppointment.CANCELLED, label: 'Đã hủy' },
  { value: StatusOfAppointment.NO_SHOW, label: 'Không đến' },
  { value: StatusOfAppointment.RESCHEDULED, label: 'Đã dời lịch' },
];

const schema = z.object({
  customerId: z.string().min(1, 'Vui lòng chọn khách hàng'),
  dateTime: z.string().min(1, 'Vui lòng chọn ngày giờ'),
  serviceId: z.string().min(1, 'Vui lòng chọn dịch vụ'),
  employeeId: z.string().min(1, 'Vui lòng chọn nhân viên'),
  roomId: z.string().optional(),
  note: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof schema>;

interface RoomOption {
  roomId: string;
  roomName: string;
  roomNumber?: string;
}

const inputSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14 },
  '& .MuiInputLabel-root': { fontSize: 14 },
};

const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [view, setView] = useState<'table' | 'calendar'>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<AppointmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: '',
      dateTime: '',
      serviceId: '',
      employeeId: '',
      roomId: '',
      note: '',
    },
  });

  const loadAppointments = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getAppointments({ size: 200 });
      setAppointments(data);
    } catch (error) {
      console.error(error);
      setLoadError('Không tải được danh sách lịch hẹn. Vui lòng kiểm tra đăng nhập hoặc thử lại.');
      toast.error('Không tải được danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  const loadFormCatalog = async () => {
    try {
      const [customerData, serviceData, employeeData, roomData] = await Promise.all([
        getCustomers(),
        getServices(),
        getEmployees(),
        getRooms(),
      ]);
      setCustomers(customerData);
      setServices(serviceData);
      setEmployees(employeeData);
      setRooms(roomData);
    } catch (error) {
      console.error(error);
      toast.error('Không tải được dữ liệu đặt lịch');
    }
  };

  useEffect(() => {
    loadAppointments();
    loadFormCatalog();
  }, []);

  const summary = useMemo(() => {
    const today = new Date().toDateString();
    return {
      today: appointments.filter((item) => new Date(item.dateTime).toDateString() === today).length,
      confirmed: appointments.filter((item) => item.statusOfAppointment === StatusOfAppointment.CONFIRMED).length,
      active: appointments.filter((item) => [
        StatusOfAppointment.CHECKED_IN,
        StatusOfAppointment.WAITING,
        StatusOfAppointment.IN_PROGRESS,
      ].includes(item.statusOfAppointment)).length,
      pending: appointments.filter((item) => item.statusOfAppointment === StatusOfAppointment.PENDING).length,
    };
  }, [appointments]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return appointments.filter((appointment) => {
      const matchesSearch = !normalizedSearch
        || appointment.customerName.toLowerCase().includes(normalizedSearch)
        || appointment.customerPhone.includes(normalizedSearch)
        || appointment.appointmentId.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === 'ALL' || appointment.statusOfAppointment === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);

  const calendarEvents = filtered.map((appointment) => ({
    id: appointment.appointmentId,
    title: appointment.customerName,
    start: appointment.dateTime,
    backgroundColor: statusColors[appointment.statusOfAppointment] ?? '#D97706',
    borderColor: statusColors[appointment.statusOfAppointment] ?? '#D97706',
    textColor: '#FFFFFF',
    extendedProps: appointment,
  }));

  const openCreate = () => {
    setEditing(null);
    reset({
      customerId: '',
      dateTime: '',
      serviceId: '',
      employeeId: '',
      roomId: '',
      note: '',
    });
    setDialogOpen(true);
  };

  const openEdit = (appointment: Appointment) => {
    const firstDetail = appointment.details?.[0];
    setEditing(appointment);
    reset({
      customerId: appointment.customerId,
      dateTime: appointment.dateTime.slice(0, 16),
      serviceId: firstDetail?.serviceId ?? '',
      employeeId: firstDetail?.employeeId ?? '',
      roomId: appointment.roomId ?? '',
      note: appointment.note,
    });
    setDialogOpen(true);
  };

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      return response?.data?.message || fallback;
    }
    return fallback;
  };

  const onSubmit = async (data: AppointmentFormValues) => {
    const dateTime = data.dateTime.length === 16 ? `${data.dateTime}:00` : data.dateTime;
    const payload = {
      customerId: data.customerId,
      dateTime,
      roomId: data.roomId || null,
      note: data.note,
      details: [{ serviceId: data.serviceId, employeeId: data.employeeId }],
    };

    setSaving(true);
    try {
      const saved = editing
        ? await updateAppointment(editing.appointmentId, payload)
        : await createAppointment(payload);

      setAppointments((prev) => editing
        ? prev.map((appointment) => appointment.appointmentId === saved.appointmentId ? saved : appointment)
        : [saved, ...prev]);
      toast.success(editing ? 'Cập nhật lịch hẹn thành công' : 'Đặt lịch hẹn thành công');
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, editing ? 'Cập nhật lịch hẹn không thành công' : 'Đặt lịch hẹn không thành công'));
    } finally {
      setSaving(false);
    }
  };

  const confirmCancel = async () => {
    if (!deleteTarget) return;
    try {
      const updated = await cancelAppointment(deleteTarget.appointmentId);
      setAppointments((prev) => prev.map((appointment) => appointment.appointmentId === updated.appointmentId ? updated : appointment));
      toast.success('Đã hủy lịch hẹn');
    } catch (error) {
      console.error(error);
      toast.error('Hủy lịch hẹn không thành công');
    } finally {
      setDeleteTarget(null);
    }
  };

  const canCancel = (appointment: Appointment) => ![
    StatusOfAppointment.CANCELLED,
    StatusOfAppointment.COMPLETED,
    StatusOfAppointment.IN_PROGRESS,
    StatusOfAppointment.NO_SHOW,
  ].includes(appointment.statusOfAppointment);

  const columns: GridColDef[] = [
    { field: 'appointmentId', headerName: 'Mã LH', width: 112 },
    {
      field: 'customerName',
      headerName: 'Khách hàng',
      flex: 1,
      minWidth: 180,
      renderCell: ({ row }) => (
        <div className="appointments-customer-cell">
          <strong>{row.customerName}</strong>
          <span>{row.customerPhone || 'Chưa có số điện thoại'}</span>
        </div>
      ),
    },
    { field: 'dateTime', headerName: 'Ngày giờ hẹn', width: 180, renderCell: ({ value }) => formatDateTime(value) },
    {
      field: 'statusOfAppointment',
      headerName: 'Trạng thái',
      width: 170,
      renderCell: ({ value }) => <StatusChip status={value} type="appointment" />,
    },
    {
      field: 'note',
      headerName: 'Ghi chú',
      flex: 1,
      minWidth: 180,
      renderCell: ({ value }) => <span className="appointments-note-cell">{value || 'Không có ghi chú'}</span>,
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 124,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) => (
        <div className="appointments-actions">
          <IconButton size="small" aria-label="Cập nhật lịch hẹn" onClick={() => openEdit(row)} className="appointments-icon-button appointments-icon-button--edit">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label="Hủy lịch hẹn" disabled={!canCancel(row)} onClick={() => setDeleteTarget(row)} className="appointments-icon-button appointments-icon-button--delete">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <main className="appointments-page animate-fadeIn">
      <PageHeader
        title="Quản lý lịch hẹn"
        subtitle={`${appointments.length} lịch hẹn trong hệ thống`}
        action={{ label: 'Đặt lịch hẹn', onClick: openCreate }}
        extra={
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, nextView) => nextView && setView(nextView)}
            size="small"
            className="appointments-view-toggle"
          >
            <ToggleButton value="table" aria-label="Danh sách lịch hẹn">
              <TableRowsIcon fontSize="small" />
              Danh sách
            </ToggleButton>
            <ToggleButton value="calendar" aria-label="Lịch hẹn dạng lịch">
              <CalendarMonthIcon fontSize="small" />
              Lịch
            </ToggleButton>
          </ToggleButtonGroup>
        }
      />

      {loadError && (
        <Alert severity="warning" className="appointments-alert">
          {loadError}
        </Alert>
      )}

      <section className="appointments-summary" aria-label="Tóm tắt lịch hẹn">
        {[
          { label: 'Hôm nay', value: summary.today, icon: <TodayIcon />, tone: 'primary' },
          { label: 'Đã xác nhận', value: summary.confirmed, icon: <EventAvailableIcon />, tone: 'info' },
          { label: 'Đang phục vụ', value: summary.active, icon: <CalendarMonthIcon />, tone: 'success' },
          { label: 'Chờ xác nhận', value: summary.pending, icon: <PendingActionsIcon />, tone: 'warning' },
        ].map((item) => (
          <div className={`appointments-summary-card appointments-summary-card--${item.tone}`} key={item.label}>
            <span aria-hidden="true">{item.icon}</span>
            <div>
              <strong>{loading ? '...' : item.value}</strong>
              <p>{item.label}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="appointments-toolbar" aria-label="Bộ lọc lịch hẹn">
        <TextField
          placeholder="Tìm theo tên, số điện thoại hoặc mã lịch hẹn..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'var(--text-tertiary)' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ ...inputSx, flex: '1 1 320px' }}
        />
        <FormControl size="small" sx={{ ...inputSx, minWidth: 220 }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select value={statusFilter} label="Trạng thái" onChange={(event) => setStatusFilter(event.target.value)}>
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          onClick={loadAppointments}
          disabled={loading}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontFamily: 'inherit',
            fontWeight: 700,
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)',
            minHeight: 40,
          }}
        >
          Làm mới
        </Button>
      </section>

      {view === 'table' ? (
        <section className="appointments-panel">
          {loading ? (
            <div className="appointments-skeleton" aria-busy="true" aria-label="Đang tải lịch hẹn">
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton key={index} variant="rounded" height={48} />
              ))}
            </div>
          ) : (
            <DataGrid
              rows={filtered}
              columns={columns}
              getRowId={(row) => row.appointmentId}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              pageSizeOptions={[10, 20]}
              autoHeight
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' },
                '& .MuiDataGrid-cell': { alignItems: 'center' },
              }}
              localeText={{
                MuiTablePagination: {
                  labelRowsPerPage: 'Hàng mỗi trang:',
                  labelDisplayedRows: ({ from, to, count }: any) => `${from}-${to} / ${count}`,
                },
                noRowsLabel: search || statusFilter !== 'ALL' ? 'Không tìm thấy lịch hẹn phù hợp' : 'Không có lịch hẹn',
              } as any}
            />
          )}
        </section>
      ) : (
        <section className="appointments-calendar-panel">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin]}
            initialView="dayGridMonth"
            locale="vi"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            buttonText={{ today: 'Hôm nay', month: 'Tháng', week: 'Tuần', day: 'Ngày' }}
            events={calendarEvents}
            eventClick={(info: any) => {
              const appointment = appointments.find((item) => item.appointmentId === info.event.id);
              if (appointment) openEdit(appointment);
            }}
            height="auto"
            dayMaxEvents={3}
            moreLinkText={(count: number) => `+${count} lịch hẹn`}
          />

          <div className="appointments-legend" aria-label="Chú thích trạng thái lịch hẹn">
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="appointments-legend-item">
                <span style={{ background: color }} aria-hidden="true" />
                <StatusChip status={status} type="appointment" />
              </div>
            ))}
          </div>
        </section>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: '16px', width: 'min(520px, calc(100vw - 32px))', background: 'var(--bg-secondary)' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 0 }}>
          {editing ? 'Cập nhật lịch hẹn' : 'Đặt lịch hẹn mới'}
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <form noValidate className="appointments-form">
            <Controller name="customerId" control={control} render={({ field }) => (
              <FormControl fullWidth size="small" sx={inputSx} error={!!errors.customerId}>
                <InputLabel>Khách hàng *</InputLabel>
                <Select {...field} label="Khách hàng *">
                  {customers.map((customer) => (
                    <MenuItem key={customer.customerId} value={customer.customerId}>
                      {customer.name} - {customer.phone}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )} />
            <Controller name="dateTime" control={control} render={({ field }) => (
              <TextField {...field} label="Ngày giờ hẹn *" type="datetime-local" slotProps={{ inputLabel: { shrink: true } }} error={!!errors.dateTime} helperText={errors.dateTime?.message} fullWidth size="small" sx={inputSx} />
            )} />
            <Controller name="serviceId" control={control} render={({ field }) => (
              <FormControl fullWidth size="small" sx={inputSx} error={!!errors.serviceId}>
                <InputLabel>Dịch vụ *</InputLabel>
                <Select {...field} label="Dịch vụ *">
                  {services.map((service) => (
                    <MenuItem key={service.serviceId} value={service.serviceId}>
                      {service.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )} />
            <Controller name="employeeId" control={control} render={({ field }) => (
              <FormControl fullWidth size="small" sx={inputSx} error={!!errors.employeeId}>
                <InputLabel>Nhân viên *</InputLabel>
                <Select {...field} label="Nhân viên *">
                  {employees.map((employee) => (
                    <MenuItem key={employee.employeeId} value={employee.employeeId}>
                      {employee.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )} />
            <Controller name="roomId" control={control} render={({ field }) => (
              <FormControl fullWidth size="small" sx={inputSx}>
                <InputLabel>Phòng</InputLabel>
                <Select {...field} label="Phòng">
                  <MenuItem value="">Không chọn phòng</MenuItem>
                  {rooms.map((room) => (
                    <MenuItem key={room.roomId} value={room.roomId}>
                      {room.roomName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )} />
            <Controller name="note" control={control} render={({ field }) => (
              <TextField {...field} label="Ghi chú" multiline rows={3} fullWidth size="small" sx={inputSx} />
            )} />
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            Hủy
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={saving} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 700, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>
            {saving ? 'Đang lưu...' : (editing ? 'Lưu thay đổi' : 'Đặt lịch')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hủy lịch hẹn"
        message={`Bạn có chắc muốn hủy lịch hẹn của "${deleteTarget?.customerName}"?`}
        confirmLabel="Hủy lịch"
        severity="error"
        onConfirm={confirmCancel}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
};

export default AppointmentsPage;
