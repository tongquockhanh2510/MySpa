import React, { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Select, MenuItem, FormControl,
  InputLabel, InputAdornment, IconButton, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import PageHeader from '@components/common/PageHeader';
import StatusChip from '@components/common/StatusChip';
import ConfirmDialog from '@components/common/ConfirmDialog';
import { mockAppointments } from '@utils/mockData';
import { formatDateTime } from '@utils/formatters';
import { StatusOfAppointment } from '@/types';
import type { Appointment } from '@/types';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TableRowsIcon from '@mui/icons-material/TableRows';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const statusColors: Record<string, string> = {
  PENDING: '#D97706',
  CONFIRMED: '#2563EB',
  IN_PROGRESS: '#7C3AED',
  COMPLETED: '#059669',
  CANCELLED: '#DC2626',
};

const schema = z.object({
  customerId: z.string().min(1, 'Vui lòng chọn khách hàng'),
  dateTime: z.string().min(1, 'Vui lòng chọn ngày giờ'),
  note: z.string().optional(),
  statusOfAppointment: z.nativeEnum(StatusOfAppointment),
});

const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [view, setView] = useState<'table' | 'calendar'>('table');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<{
    customerId: string; dateTime: string; note?: string; statusOfAppointment: StatusOfAppointment;
  }>({
    resolver: zodResolver(schema),
    defaultValues: { customerId: '', dateTime: '', note: '', statusOfAppointment: StatusOfAppointment.PENDING },
  });

  const filtered = useMemo(() =>
    appointments.filter(a =>
      a.customerName.toLowerCase().includes(search.toLowerCase()) ||
      a.customerPhone.includes(search)
    ), [appointments, search]);

  const calendarEvents = appointments.map(apt => ({
    id: apt.appointmentId,
    title: apt.customerName,
    start: apt.dateTime,
    backgroundColor: statusColors[apt.statusOfAppointment] ?? '#D97706',
    borderColor: 'transparent',
    extendedProps: apt,
  }));

  const openCreate = () => {
    setEditing(null);
    reset({ customerId: '', dateTime: '', note: '', statusOfAppointment: StatusOfAppointment.PENDING });
    setDialogOpen(true);
  };
  const openEdit = (apt: Appointment) => {
    setEditing(apt);
    reset({ customerId: apt.customerId, dateTime: apt.dateTime.slice(0, 16), note: apt.note, statusOfAppointment: apt.statusOfAppointment });
    setDialogOpen(true);
  };

  const onSubmit = (data: { customerId: string; dateTime: string; note?: string; statusOfAppointment: StatusOfAppointment }) => {
    if (editing) {
      setAppointments(prev => prev.map(a => a.appointmentId === editing.appointmentId
        ? { ...a, ...data, dateTime: new Date(data.dateTime).toISOString() } : a));
      toast.success('Cập nhật lịch hẹn thành công');
    } else {
      const newApt: Appointment = {
        appointmentId: `AP${Date.now()}`,
        customerName: 'Khách hàng mới',
        customerPhone: '',
        ...data,
        dateTime: new Date(data.dateTime).toISOString(),
      };
      setAppointments(prev => [newApt, ...prev]);
      toast.success('Thêm lịch hẹn thành công');
    }
    setDialogOpen(false);
  };

  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14 }, '& .MuiInputLabel-root': { fontSize: 14 } };

  const columns: GridColDef[] = [
    { field: 'appointmentId', headerName: 'Mã LH', width: 100 },
    { field: 'customerName', headerName: 'Khách hàng', flex: 1, minWidth: 160 },
    { field: 'customerPhone', headerName: 'Điện thoại', width: 130 },
    { field: 'dateTime', headerName: 'Ngày giờ hẹn', width: 170, renderCell: ({ value }) => formatDateTime(value) },
    { field: 'statusOfAppointment', headerName: 'Trạng thái', width: 160, renderCell: ({ value }) => <StatusChip status={value} type="appointment" /> },
    { field: 'note', headerName: 'Ghi chú', flex: 1 },
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
      <PageHeader
        title="Quản lý lịch hẹn"
        subtitle={`${appointments.length} lịch hẹn`}
        action={{ label: 'Đặt lịch hẹn', onClick: openCreate }}
        extra={
          <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small"
            sx={{ '& .MuiToggleButton-root': { borderRadius: '10px !important', fontFamily: 'inherit', fontSize: 13, textTransform: 'none', px: 2, '&.Mui-selected': { background: '#FEF3C7', color: 'var(--primary)' } } }}>
            <ToggleButton value="table" aria-label="Danh sách"><TableRowsIcon fontSize="small" sx={{ mr: 0.5 }} />Danh sách</ToggleButton>
            <ToggleButton value="calendar" aria-label="Lịch"><CalendarMonthIcon fontSize="small" sx={{ mr: 0.5 }} />Lịch</ToggleButton>
          </ToggleButtonGroup>
        }
      />

      {view === 'table' ? (
        <>
          <div style={{ marginBottom: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '16px 20px', boxShadow: 'var(--shadow-card)' }}>
            <TextField placeholder="Tìm kiếm theo tên khách hàng, điện thoại..." value={search} onChange={e => setSearch(e.target.value)} size="small"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'var(--text-tertiary)' }} /></InputAdornment> } }}
              sx={{ width: 380, ...inputSx }} />
          </div>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            <DataGrid rows={filtered} columns={columns} getRowId={r => r.appointmentId}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10, 20]} autoHeight disableRowSelectionOnClick
              sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }}
              localeText={{ MuiTablePagination: { labelRowsPerPage: 'Hàng mỗi trang:', labelDisplayedRows: ({ from, to, count }: any) => `${from}–${to} / ${count}` }, noRowsLabel: 'Không có lịch hẹn' } as any} />
          </div>
        </>
      ) : (
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', padding: 20 }}>
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
              const apt = appointments.find(a => a.appointmentId === info.event.id);
              if (apt) openEdit(apt);
            }}
            height="auto"
            dayMaxEvents={3}
            moreLinkText={(n: any) => `+${n} lịch hẹn`}
          />

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                <StatusChip status={status} type="appointment" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', minWidth: 480, background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17, pb: 0 }}>{editing ? 'Cập nhật lịch hẹn' : 'Đặt lịch hẹn mới'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <form noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Controller name="customerId" control={control} render={({ field }) => (
              <TextField {...field} label="Mã khách hàng *" error={!!errors.customerId} helperText={errors.customerId?.message} fullWidth size="small" sx={inputSx} />
            )} />
            <Controller name="dateTime" control={control} render={({ field }) => (
              <TextField {...field} label="Ngày giờ hẹn *" type="datetime-local" slotProps={{ inputLabel: { shrink: true } }} error={!!errors.dateTime} helperText={errors.dateTime?.message} fullWidth size="small" sx={inputSx} />
            )} />
            <Controller name="statusOfAppointment" control={control} render={({ field }) => (
              <FormControl fullWidth size="small" sx={inputSx}>
                <InputLabel>Trạng thái</InputLabel>
                <Select {...field} label="Trạng thái" sx={{ borderRadius: '10px' }}>
                  <MenuItem value={StatusOfAppointment.PENDING}>Chờ xác nhận</MenuItem>
                  <MenuItem value={StatusOfAppointment.CONFIRMED}>Đã xác nhận</MenuItem>
                  <MenuItem value={StatusOfAppointment.IN_PROGRESS}>Đang thực hiện</MenuItem>
                  <MenuItem value={StatusOfAppointment.COMPLETED}>Hoàn thành</MenuItem>
                  <MenuItem value={StatusOfAppointment.CANCELLED}>Đã hủy</MenuItem>
                </Select>
              </FormControl>
            )} />
            <Controller name="note" control={control} render={({ field }) => (
              <TextField {...field} label="Ghi chú" multiline rows={2} fullWidth size="small" sx={inputSx} />
            )} />
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 600, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>
            {editing ? 'Lưu thay đổi' : 'Đặt lịch'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} title="Hủy lịch hẹn" message={`Bạn có chắc muốn hủy lịch hẹn của "${deleteTarget?.customerName}"?`} confirmLabel="Hủy lịch" severity="error"
        onConfirm={() => { setAppointments(prev => prev.filter(a => a.appointmentId !== deleteTarget!.appointmentId)); toast.success('Đã hủy lịch hẹn'); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)} />
    </div>
  );
};

export default AppointmentsPage;
