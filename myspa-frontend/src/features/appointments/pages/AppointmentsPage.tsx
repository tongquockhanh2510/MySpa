import React, { useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, IconButton, InputAdornment, InputLabel, Menu, MenuItem, Select,
  Skeleton, TextField, ToggleButton, ToggleButtonGroup, Tooltip,
} from '@mui/material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import PageHeader from '@components/common/PageHeader';
import StatusChip from '@components/common/StatusChip';
import ConfirmDialog from '@components/common/ConfirmDialog';
import { formatDateTime } from '@utils/formatters';
import {
  cancelAppointment,
  checkInAppointment,
  completeAppointment,
  confirmAppointment,
  createAppointment,
  getAppointments,
  markAppointmentNoShow,
  rescheduleAppointment,
  startAppointment,
  updateAppointment,
  waitAppointment,
} from '@/api/appointments';
import { getCustomers, createCustomer } from '@/api/customers';
import { getEmployees, getRooms, getServices } from '@/api/catalog';
import { getTreatmentSchedules } from '@/api/treatment';
import { ROUTES } from '@constants/routes';
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import LoginIcon from '@mui/icons-material/Login';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PaymentIcon from '@mui/icons-material/Payment';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useIsMobile } from '@hooks/useIsMobile';
import AppointmentsListMobile from './AppointmentsListMobile';
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

const treatmentStatusColors: Record<string, string> = {
  SCHEDULED: '#0EA5E9',
  IN_PROGRESS: '#7C3AED',
  COMPLETED: '#059669',
  RESCHEDULED: '#B45309',
};

// ISS-027: chú thích rút gọn còn 7 trạng thái chính. "Đang chờ" (WAITING) và
// "Đã dời lịch" (RESCHEDULED) là trạng thái chuyển tiếp/hành động, không hiển thị
// trong legend. Event vẫn tô màu theo statusColors đầy đủ (fallback ở trên).
const legendStatusOrder = [
  'PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW',
];

const treatmentStatusLabels: Record<string, string> = {
  SCHEDULED: 'Đã lên lịch',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  RESCHEDULED: 'Đã dời lịch',
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

const statusLabels = statusOptions.reduce<Record<string, string>>((labels, option) => {
  labels[option.value] = option.label;
  return labels;
}, {});

const validTransitions: Record<StatusOfAppointment, StatusOfAppointment[]> = {
  [StatusOfAppointment.PENDING]: [
    StatusOfAppointment.CONFIRMED,
    StatusOfAppointment.CANCELLED,
    StatusOfAppointment.RESCHEDULED,
  ],
  [StatusOfAppointment.CONFIRMED]: [
    StatusOfAppointment.CHECKED_IN,
    StatusOfAppointment.CANCELLED,
    StatusOfAppointment.RESCHEDULED,
    StatusOfAppointment.NO_SHOW,
  ],
  [StatusOfAppointment.CHECKED_IN]: [
    StatusOfAppointment.WAITING,
    StatusOfAppointment.IN_PROGRESS,
  ],
  [StatusOfAppointment.WAITING]: [
    StatusOfAppointment.IN_PROGRESS,
    StatusOfAppointment.CANCELLED,
  ],
  [StatusOfAppointment.IN_PROGRESS]: [StatusOfAppointment.COMPLETED],
  [StatusOfAppointment.COMPLETED]: [],
  [StatusOfAppointment.CANCELLED]: [],
  [StatusOfAppointment.NO_SHOW]: [],
  [StatusOfAppointment.RESCHEDULED]: [],
};

export type LifecycleAction = 'confirm' | 'checkIn' | 'wait' | 'start' | 'complete' | 'noShow' | 'reschedule';

export const lifecycleTargets: Record<LifecycleAction, StatusOfAppointment> = {
  confirm: StatusOfAppointment.CONFIRMED,
  checkIn: StatusOfAppointment.CHECKED_IN,
  wait: StatusOfAppointment.WAITING,
  start: StatusOfAppointment.IN_PROGRESS,
  complete: StatusOfAppointment.COMPLETED,
  noShow: StatusOfAppointment.NO_SHOW,
  reschedule: StatusOfAppointment.RESCHEDULED,
};

const lifecycleSuccessMessages: Record<LifecycleAction, string> = {
  confirm: 'Đã xác nhận lịch hẹn',
  checkIn: 'Check-in thành công',
  wait: 'Đã chuyển khách sang trạng thái đang chờ',
  start: 'Đã bắt đầu điều trị',
  complete: 'Đã hoàn thành lịch hẹn',
  noShow: 'Đã đánh dấu khách không đến',
  reschedule: 'Đã dời lịch hẹn',
};

const lifecycleErrorMessages: Record<LifecycleAction, string> = {
  confirm: 'Xác nhận lịch hẹn không thành công',
  checkIn: 'Check-in không thành công',
  wait: 'Chuyển sang đang chờ không thành công',
  start: 'Bắt đầu điều trị không thành công',
  complete: 'Hoàn thành lịch hẹn không thành công',
  noShow: 'Đánh dấu không đến không thành công',
  reschedule: 'Dời lịch hẹn không thành công',
};

const schema = z.object({
  customerId: z.string().min(1, 'Vui lòng chọn khách hàng'),
  dateTime: z.string().min(1, 'Vui lòng chọn ngày giờ'),
  roomId: z.string().optional(),
  note: z.string().optional(),
  details: z.array(z.object({
    serviceId: z.string().min(1, 'Vui lòng chọn dịch vụ'),
    employeeId: z.string().min(1, 'Vui lòng chọn nhân viên'),
  })).min(1, 'Phải có ít nhất một dịch vụ'),
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
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [view, setView] = useState<'table' | 'calendar'>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [detailTargetId, setDetailTargetId] = useState<string | null>(null);
  const [rescheduleDateTime, setRescheduleDateTime] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);
  const [moreTarget, setMoreTarget] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [treatmentSchedules, setTreatmentSchedules] = useState<any[]>([]);
  const [treatmentDetail, setTreatmentDetail] = useState<any | null>(null);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', gender: '' });

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<AppointmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: '',
      dateTime: '',
      roomId: '',
      note: '',
      details: [{ serviceId: '', employeeId: '' }],
    },
  });

  const { fields: detailFields, append: appendDetail, remove: removeDetail } = useFieldArray({
    control,
    name: 'details',
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

  const loadTreatmentSchedules = async () => {
    try {
      const today = new Date();
      const from = new Date(today);
      from.setMonth(from.getMonth() - 3);
      const to = new Date(today);
      to.setMonth(to.getMonth() + 12);
      const toIso = (d: Date) => d.toISOString().slice(0, 10);
      const data = await getTreatmentSchedules(toIso(from), toIso(to));
      setTreatmentSchedules(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadAppointments();
    loadFormCatalog();
    loadTreatmentSchedules();
  }, []);

  useEffect(() => {
    const appointmentId = searchParams.get('appointmentId');
    if (!appointmentId || !appointments.length) return;
    if (appointments.some((appointment) => appointment.appointmentId === appointmentId)) {
      setDetailTargetId(appointmentId);
    }
  }, [appointments, searchParams]);

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
        || appointment.displayCode?.toLowerCase().includes(normalizedSearch)
        || appointment.appointmentId.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === 'ALL' || appointment.statusOfAppointment === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);

  const appointmentEvents = filtered.map((appointment) => ({
    id: appointment.appointmentId,
    title: appointment.customerName,
    start: appointment.dateTime,
    backgroundColor: statusColors[appointment.statusOfAppointment] ?? '#D97706',
    borderColor: statusColors[appointment.statusOfAppointment] ?? '#D97706',
    textColor: '#FFFFFF',
    extendedProps: { kind: 'appointment', data: appointment },
  }));

  const treatmentEvents = treatmentSchedules.map((schedule) => ({
    id: `ts-${schedule.scheduleId}`,
    title: `Liệu trình ${schedule.customerName} · Buổi ${schedule.sessionNumber} (${schedule.packageName})`,
    start: schedule.scheduledDate,
    allDay: true,
    backgroundColor: treatmentStatusColors[schedule.status] ?? '#0EA5E9',
    borderColor: treatmentStatusColors[schedule.status] ?? '#0EA5E9',
    textColor: '#FFFFFF',
    extendedProps: { kind: 'treatment', data: schedule },
  }));

  const calendarEvents = [...appointmentEvents, ...treatmentEvents];

  const openCreate = () => {
    setEditing(null);
    reset({
      customerId: '',
      dateTime: '',
      roomId: '',
      note: '',
      details: [{ serviceId: '', employeeId: '' }],
    });
    setDialogOpen(true);
  };

  const openEdit = (appointment: Appointment) => {
    const details = appointment.details?.length
      ? appointment.details.map((detail) => ({
          serviceId: detail.serviceId ?? '',
          employeeId: detail.employeeId ?? '',
        }))
      : [{ serviceId: '', employeeId: '' }];
    setEditing(appointment);
    reset({
      customerId: appointment.customerId,
      dateTime: appointment.dateTime.slice(0, 16),
      roomId: appointment.roomId ?? '',
      note: appointment.note,
      details,
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

  const canTransition = (appointment: Appointment, target: StatusOfAppointment) => (
    validTransitions[appointment.statusOfAppointment]?.includes(target) ?? false
  );

  const invalidTransitionMessage = (appointment: Appointment, target: StatusOfAppointment) => (
    `Không thể chuyển từ ${statusLabels[appointment.statusOfAppointment] || appointment.statusOfAppointment} sang ${statusLabels[target] || target}`
  );

  const replaceAppointment = (updated: Appointment) => {
    setAppointments((prev) => prev.map((appointment) => (
      appointment.appointmentId === updated.appointmentId ? updated : appointment
    )));
  };

  const runLifecycleAction = async (appointment: Appointment, action: LifecycleAction) => {
    const target = lifecycleTargets[action];
    if (!canTransition(appointment, target)) {
      toast.warning(invalidTransitionMessage(appointment, target));
      return;
    }

    const actionKey = `${appointment.appointmentId}:${action}`;
    setActiveAction(actionKey);
    try {
      let updated: Appointment;
      switch (action) {
        case 'confirm':
          updated = await confirmAppointment(appointment.appointmentId);
          break;
        case 'checkIn':
          updated = await checkInAppointment(appointment.appointmentId);
          break;
        case 'wait':
          updated = await waitAppointment(appointment.appointmentId);
          break;
        case 'start':
          updated = await startAppointment(appointment.appointmentId);
          break;
        case 'complete':
          updated = await completeAppointment(appointment.appointmentId);
          break;
        case 'noShow':
          updated = await markAppointmentNoShow(appointment.appointmentId);
          break;
        default:
          return;
      }
      replaceAppointment(updated);
      toast.success(lifecycleSuccessMessages[action]);
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, lifecycleErrorMessages[action]));
    } finally {
      setActiveAction(null);
    }
  };

  const openReschedule = (appointment: Appointment) => {
    if (!canTransition(appointment, StatusOfAppointment.RESCHEDULED)) {
      toast.warning(invalidTransitionMessage(appointment, StatusOfAppointment.RESCHEDULED));
      return;
    }
    setRescheduleTarget(appointment);
    setRescheduleDateTime(appointment.dateTime.slice(0, 16));
  };

  const submitReschedule = async () => {
    if (!rescheduleTarget) return;
    if (!rescheduleDateTime) {
      toast.warning('Vui lòng chọn ngày giờ mới');
      return;
    }

    const dateTime = rescheduleDateTime.length === 16 ? `${rescheduleDateTime}:00` : rescheduleDateTime;
    const actionKey = `${rescheduleTarget.appointmentId}:reschedule`;
    setActiveAction(actionKey);
    try {
      const updated = await rescheduleAppointment(rescheduleTarget.appointmentId, dateTime);
      replaceAppointment(updated);
      toast.success(lifecycleSuccessMessages.reschedule);
      setRescheduleTarget(null);
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, lifecycleErrorMessages.reschedule));
    } finally {
      setActiveAction(null);
    }
  };

  const onSubmit = async (data: AppointmentFormValues) => {
    const dateTime = data.dateTime.length === 16 ? `${data.dateTime}:00` : data.dateTime;
    const payload = {
      customerId: data.customerId,
      dateTime,
      roomId: data.roomId || null,
      note: data.note,
      details: data.details.map((detail) => ({ serviceId: detail.serviceId, employeeId: detail.employeeId })),
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

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) {
      toast.warning('Vui lòng nhập tên khách hàng');
      return;
    }
    setSavingCustomer(true);
    try {
      const payload: Record<string, string> = { name: newCustomer.name.trim() };
      if (newCustomer.phone.trim()) payload.phone = newCustomer.phone.trim();
      if (newCustomer.gender) payload.gender = newCustomer.gender;
      const created = await createCustomer(payload);
      setCustomers((prev) => [created, ...prev]);
      setValue('customerId', created.customerId, { shouldValidate: true });
      toast.success('Đã thêm khách hàng mới');
      setNewCustomerOpen(false);
      setNewCustomer({ name: '', phone: '', gender: '' });
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, 'Thêm khách hàng không thành công'));
    } finally {
      setSavingCustomer(false);
    }
  };

  const confirmCancel = async () => {
    if (!deleteTarget) return;
    if (!canTransition(deleteTarget, StatusOfAppointment.CANCELLED)) {
      toast.warning(invalidTransitionMessage(deleteTarget, StatusOfAppointment.CANCELLED));
      setDeleteTarget(null);
      return;
    }

    const actionKey = `${deleteTarget.appointmentId}:cancel`;
    setActiveAction(actionKey);
    try {
      const updated = await cancelAppointment(deleteTarget.appointmentId);
      replaceAppointment(updated);
      toast.success('Đã hủy lịch hẹn');
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, 'Hủy lịch hẹn không thành công'));
    } finally {
      setActiveAction(null);
      setDeleteTarget(null);
    }
  };

  const canCancel = (appointment: Appointment) => canTransition(appointment, StatusOfAppointment.CANCELLED);

  const openMore = (event: React.MouseEvent<HTMLElement>, appointment: Appointment) => {
    setMoreAnchor(event.currentTarget);
    setMoreTarget(appointment);
  };

  const closeMore = () => {
    setMoreAnchor(null);
    setMoreTarget(null);
  };

  const openPaymentFromAppointment = (appointment: Appointment) => {
    const params = new URLSearchParams({
      appointmentId: appointment.appointmentId,
    });
    navigate(`/don-hang?${params.toString()}`);
  };

  const renderLifecycleButton = (
    appointment: Appointment,
    action: LifecycleAction,
    label: string,
    icon: React.ReactNode,
    className = '',
  ) => {
    const target = lifecycleTargets[action];
    const allowed = canTransition(appointment, target);
    const disabled = !allowed || activeAction !== null;
    const actionKey = `${appointment.appointmentId}:${action}`;
    const title = allowed ? label : invalidTransitionMessage(appointment, target);

    return (
      <Tooltip key={action} title={title} arrow>
        <span>
          <IconButton
            size="small"
            aria-label={label}
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              action === 'reschedule' ? openReschedule(appointment) : runLifecycleAction(appointment, action);
            }}
            className={`appointments-icon-button ${className}`}
            data-loading={activeAction === actionKey ? 'true' : undefined}
          >
            {icon}
          </IconButton>
        </span>
      </Tooltip>
    );
  };

  const columns: GridColDef[] = [
    { field: 'displayCode', headerName: 'Mã LH', width: 140, renderCell: ({ row }) => row.displayCode || row.appointmentId },
    {
      field: 'customerName',
      headerName: 'Khách hàng',
      flex: 1,
      minWidth: 180,
      renderCell: ({ row }) => (
        <div className="appointments-customer-cell">
          <strong title={row.customerName}>{row.customerName}</strong>
        </div>
      ),
    },
    { field: 'dateTime', headerName: 'Ngày giờ hẹn', width: 180, renderCell: ({ value }) => formatDateTime(value) },
    {
      field: 'services',
      headerName: 'Dịch vụ',
      flex: 1,
      minWidth: 160,
      sortable: false,
      valueGetter: (_value, row) => (row.details || []).map((d: any) => d.serviceName).filter(Boolean).join(', '),
      renderCell: ({ row }) => {
        const names = (row.details || []).map((d: any) => d.serviceName).filter(Boolean);
        if (names.length === 0) return <span className="appointments-note-cell">—</span>;
        const label = names.length > 1 ? `${names[0]} +${names.length - 1}` : names[0];
        return <span className="appointments-note-cell" title={names.join(', ')}>{label}</span>;
      },
    },
    {
      field: 'therapists',
      headerName: 'KTV',
      width: 150,
      sortable: false,
      valueGetter: (_value, row) => Array.from(new Set((row.details || []).map((d: any) => d.employeeName).filter(Boolean))).join(', '),
      renderCell: ({ row }) => {
        const names = Array.from(new Set((row.details || []).map((d: any) => d.employeeName).filter(Boolean)));
        if (names.length === 0) return <span className="appointments-note-cell">—</span>;
        const label = names.length > 1 ? `${names[0]} +${names.length - 1}` : names[0];
        return <span className="appointments-note-cell" title={names.join(', ')}>{label as string}</span>;
      },
    },
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
      renderCell: ({ value }) => <span className="appointments-note-cell" title={value || 'Không có ghi chú'}>{value || 'Không có ghi chú'}</span>,
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 230,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) => (
        <div className="appointments-actions">
          <IconButton size="small" aria-label="Cập nhật lịch hẹn" onClick={(event) => { event.stopPropagation(); setDetailTargetId(row.appointmentId); }} className="appointments-icon-button appointments-icon-button--edit">
            <VisibilityIcon fontSize="small" />
          </IconButton>
          {row.statusOfAppointment === StatusOfAppointment.PENDING && renderLifecycleButton(row, 'confirm', 'Xác nhận', <CheckCircleIcon fontSize="small" />, 'appointments-icon-button--confirm')}
          {row.statusOfAppointment === StatusOfAppointment.CONFIRMED && renderLifecycleButton(row, 'checkIn', 'Check-in', <LoginIcon fontSize="small" />, 'appointments-icon-button--checkin')}
          {row.statusOfAppointment === StatusOfAppointment.CHECKED_IN && renderLifecycleButton(row, 'wait', 'Chuyển sang đang chờ', <PendingActionsIcon fontSize="small" />, 'appointments-icon-button--waiting')}
          {row.statusOfAppointment === StatusOfAppointment.CHECKED_IN && renderLifecycleButton(row, 'start', 'Bắt đầu điều trị', <PlayArrowIcon fontSize="small" />, 'appointments-icon-button--start')}
          {row.statusOfAppointment === StatusOfAppointment.WAITING && renderLifecycleButton(row, 'start', 'Bắt đầu thực hiện', <PlayArrowIcon fontSize="small" />, 'appointments-icon-button--start')}
          {row.statusOfAppointment === StatusOfAppointment.IN_PROGRESS && renderLifecycleButton(row, 'complete', 'Hoàn thành', <TaskAltIcon fontSize="small" />, 'appointments-icon-button--complete')}
          <IconButton size="small" aria-label="Hủy lịch hẹn" disabled={!canCancel(row) || activeAction !== null} onClick={(event) => { event.stopPropagation(); setDeleteTarget(row); }} className="appointments-icon-button appointments-icon-button--delete">
            <DeleteIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label="Thêm thao tác" onClick={(event) => { event.stopPropagation(); openMore(event, row); }} className="appointments-icon-button">
            <MoreVertIcon fontSize="small" />
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
          {isMobile ? (
            <AppointmentsListMobile
              rows={filtered}
              loading={loading}
              activeAction={activeAction}
              emptyMessage={search || statusFilter !== 'ALL' ? 'Không tìm thấy lịch hẹn phù hợp' : 'Không có lịch hẹn'}
              onOpenDetail={(id) => setDetailTargetId(id)}
              onOpenMore={openMore}
              onDelete={(row) => setDeleteTarget(row)}
              canCancel={canCancel}
              canTransition={canTransition}
              invalidTransitionMessage={invalidTransitionMessage}
              onLifecycleAction={runLifecycleAction}
            />
          ) : loading ? (
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
              rowHeight={72}
              autoHeight
              disableRowSelectionOnClick
              onRowClick={({ row }) => setDetailTargetId(row.appointmentId)}
              getRowClassName={({ row }) => {
                const isDone = row.statusOfAppointment === StatusOfAppointment.COMPLETED;
                const isPast = new Date(row.dateTime).getTime() < Date.now()
                  && ![StatusOfAppointment.CANCELLED, StatusOfAppointment.NO_SHOW].includes(row.statusOfAppointment);
                return isDone || isPast ? 'appointments-row--past' : '';
              }}
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
              if (info.event.extendedProps?.kind === 'treatment') {
                setTreatmentDetail(info.event.extendedProps.data);
                return;
              }
              const appointment = appointments.find((item) => item.appointmentId === info.event.id);
              if (appointment) setDetailTargetId(appointment.appointmentId);
            }}
            height="auto"
            dayMaxEvents={3}
            moreLinkText={(count: number) => `+${count} lịch hẹn`}
          />

          <div className="appointments-legend" aria-label="Chú thích trạng thái lịch hẹn">
            {legendStatusOrder.map((status) => (
              <div key={status} className="appointments-legend-item">
                <span className="appointments-legend-dot" style={{ background: statusColors[status] }} aria-hidden="true" />
                <StatusChip status={status} type="appointment" />
              </div>
            ))}
            <div className="appointments-legend-item" title="Lịch phát sinh từ gói liệu trình — dùng chung bộ trạng thái, có gắn nhãn Liệu trình">
              <span className="appointments-legend-dot" style={{ background: treatmentStatusColors.SCHEDULED }} aria-hidden="true" />
              <span className="appointments-legend-text">Liệu trình (dùng chung trạng thái)</span>
            </div>
          </div>
        </section>
      )}

      <Menu
        anchorEl={moreAnchor}
        open={Boolean(moreAnchor)}
        onClose={closeMore}
        slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 180 } } }}
      >
        <MenuItem onClick={() => { if (moreTarget) openPaymentFromAppointment(moreTarget); closeMore(); }}>
          <PaymentIcon fontSize="small" sx={{ mr: 1 }} />
          Thanh toán đơn hàng
        </MenuItem>
        <MenuItem onClick={() => { if (moreTarget) openEdit(moreTarget); closeMore(); }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Cập nhật
        </MenuItem>
        {moreTarget?.statusOfAppointment === StatusOfAppointment.CHECKED_IN && (
          <MenuItem onClick={() => { if (moreTarget) runLifecycleAction(moreTarget, 'wait'); closeMore(); }}>
            <PendingActionsIcon fontSize="small" sx={{ mr: 1 }} />
            Chuyển sang đang chờ
          </MenuItem>
        )}
        {(moreTarget?.statusOfAppointment === StatusOfAppointment.CHECKED_IN || moreTarget?.statusOfAppointment === StatusOfAppointment.WAITING) && (
          <MenuItem onClick={() => { if (moreTarget) runLifecycleAction(moreTarget, 'start'); closeMore(); }}>
            <PlayArrowIcon fontSize="small" sx={{ mr: 1 }} />
            Bắt đầu điều trị
          </MenuItem>
        )}
        {moreTarget?.statusOfAppointment === StatusOfAppointment.IN_PROGRESS && (
          <MenuItem onClick={() => { if (moreTarget) runLifecycleAction(moreTarget, 'complete'); closeMore(); }}>
            <TaskAltIcon fontSize="small" sx={{ mr: 1 }} />
            Hoàn thành dịch vụ
          </MenuItem>
        )}
        <MenuItem onClick={() => { if (moreTarget) openReschedule(moreTarget); closeMore(); }}>
          <EventRepeatIcon fontSize="small" sx={{ mr: 1 }} />
          Dời lịch
        </MenuItem>
        <MenuItem onClick={() => { if (moreTarget) runLifecycleAction(moreTarget, 'noShow'); closeMore(); }}>
          <EventBusyIcon fontSize="small" sx={{ mr: 1 }} />
          Không đến
        </MenuItem>
      </Menu>

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
            <div className="appointments-customer-field">
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
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon fontSize="small" />}
                onClick={() => setNewCustomerOpen(true)}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Khách mới
              </Button>
            </div>
            <Controller name="dateTime" control={control} render={({ field }) => (
              <TextField {...field} label="Ngày giờ hẹn *" type="datetime-local" slotProps={{ inputLabel: { shrink: true } }} error={!!errors.dateTime} helperText={errors.dateTime?.message} fullWidth size="small" sx={inputSx} />
            )} />
            <div className="appointments-details-list">
              <div className="appointments-details-header">
                <span>Dịch vụ &amp; kỹ thuật viên *</span>
                <Button
                  size="small"
                  startIcon={<AddCircleIcon fontSize="small" />}
                  onClick={() => appendDetail({ serviceId: '', employeeId: '' })}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Thêm dịch vụ
                </Button>
              </div>
              {typeof errors.details?.message === 'string' && (
                <span className="appointments-details-error">{errors.details.message}</span>
              )}
              {detailFields.map((detailField, index) => (
                <div key={detailField.id} className="appointments-detail-row">
                  <Controller name={`details.${index}.serviceId`} control={control} render={({ field }) => (
                    <FormControl fullWidth size="small" sx={inputSx} error={!!errors.details?.[index]?.serviceId}>
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
                  <Controller name={`details.${index}.employeeId`} control={control} render={({ field }) => (
                    <FormControl fullWidth size="small" sx={inputSx} error={!!errors.details?.[index]?.employeeId}>
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
                  <Tooltip title="Xóa dịch vụ" arrow>
                    <span>
                      <IconButton
                        size="small"
                        aria-label="Xóa dịch vụ"
                        disabled={detailFields.length === 1}
                        onClick={() => removeDetail(index)}
                        sx={{ color: 'var(--error)' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </div>
              ))}
            </div>
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
          {editing && (
            <Button
              onClick={() => { const target = editing; setDialogOpen(false); openPaymentFromAppointment(target); }}
              startIcon={<PaymentIcon fontSize="small" />}
              sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 700, color: 'var(--primary)', mr: 'auto' }}
            >
              Đi đến đơn hàng
            </Button>
          )}
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            Hủy
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={saving} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 700, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>
            {saving ? 'Đang lưu...' : (editing ? 'Lưu thay đổi' : 'Đặt lịch')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={newCustomerOpen}
        onClose={() => !savingCustomer && setNewCustomerOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: '16px', width: 'min(420px, calc(100vw - 32px))', background: 'var(--bg-secondary)' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 0 }}>Thêm khách hàng mới</DialogTitle>
        <DialogContent sx={{ pt: '16px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Họ tên *"
            value={newCustomer.name}
            onChange={(event) => setNewCustomer((prev) => ({ ...prev, name: event.target.value }))}
            fullWidth
            size="small"
            sx={inputSx}
          />
          <TextField
            label="Số điện thoại"
            value={newCustomer.phone}
            onChange={(event) => setNewCustomer((prev) => ({ ...prev, phone: event.target.value }))}
            fullWidth
            size="small"
            sx={inputSx}
          />
          <FormControl fullWidth size="small" sx={inputSx}>
            <InputLabel>Giới tính</InputLabel>
            <Select
              value={newCustomer.gender}
              label="Giới tính"
              onChange={(event) => setNewCustomer((prev) => ({ ...prev, gender: event.target.value }))}
            >
              <MenuItem value="">Không xác định</MenuItem>
              <MenuItem value="MALE">Nam</MenuItem>
              <MenuItem value="FEMALE">Nữ</MenuItem>
              <MenuItem value="OTHER">Khác</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setNewCustomerOpen(false)}
            disabled={savingCustomer}
            sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleCreateCustomer}
            disabled={savingCustomer}
            variant="contained"
            sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 700, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}
          >
            {savingCustomer ? 'Đang lưu...' : 'Thêm & chọn'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!rescheduleTarget}
        onClose={() => activeAction === null && setRescheduleTarget(null)}
        slotProps={{ paper: { sx: { borderRadius: '16px', width: 'min(420px, calc(100vw - 32px))', background: 'var(--bg-secondary)' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 0 }}>
          Dời lịch hẹn
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <TextField
            label="Ngày giờ mới"
            type="datetime-local"
            value={rescheduleDateTime}
            onChange={(event) => setRescheduleDateTime(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
            size="small"
            sx={inputSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setRescheduleTarget(null)}
            disabled={activeAction !== null}
            sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Hủy
          </Button>
          <Button
            onClick={submitReschedule}
            disabled={activeAction !== null}
            variant="contained"
            sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 700, background: 'linear-gradient(135deg, #2563EB, #0F766E)' }}
          >
            {activeAction === `${rescheduleTarget?.appointmentId}:reschedule` ? 'Đang dời lịch...' : 'Dời lịch'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!treatmentDetail}
        onClose={() => setTreatmentDetail(null)}
        slotProps={{ paper: { sx: { borderRadius: '16px', width: 'min(480px, calc(100vw - 32px))', background: 'var(--bg-secondary)' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 0 }}>
          Chi tiết lịch liệu trình
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {treatmentDetail && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
              <div><strong style={{ color: 'var(--text-primary)' }}>{treatmentDetail.customerName}</strong></div>
              <div>Gói: {treatmentDetail.packageName}</div>
              <div>Buổi: {treatmentDetail.sessionNumber}</div>
              <div>Ngày hẹn: {formatDateTime(treatmentDetail.scheduledDate)}</div>
              {treatmentDetail.therapistName && <div>Kỹ thuật viên: {treatmentDetail.therapistName}</div>}
              {treatmentDetail.roomName && <div>Phòng: {treatmentDetail.roomName}</div>}
              {treatmentDetail.status && <div>Trạng thái: {treatmentStatusLabels[treatmentDetail.status] || treatmentDetail.status}</div>}
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setTreatmentDetail(null)}
            sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {(() => {
        const detail = detailTargetId
          ? appointments.find((item) => item.appointmentId === detailTargetId) ?? null
          : null;
        if (!detail) return null;

        const lifecycleButtons: { action: LifecycleAction; label: string; icon: React.ReactNode }[] = [
          {action: 'confirm', label: 'Xác nhận', icon: <CheckCircleIcon fontSize="small" /> },
          { action: 'checkIn', label: 'Check-in', icon: <LoginIcon fontSize="small" /> },
          { action: 'wait', label: 'Đang chờ', icon: <PendingActionsIcon fontSize="small" /> },
          {action: 'start', label: 'Bắt đầu điều trị', icon: <PlayArrowIcon fontSize="small" /> },
          {action: 'complete', label: 'Hoàn thành', icon: <TaskAltIcon fontSize="small" /> },
          {action: 'noShow', label: 'Không đến', icon: <EventBusyIcon fontSize="small" /> },
          {action: 'reschedule', label: 'Dời lịch', icon: <EventRepeatIcon fontSize="small" /> },
        ];
        const availableActions = lifecycleButtons.filter(({ action }) => canTransition(detail, lifecycleTargets[action]));

        return (
          <Dialog
            open
            onClose={() => setDetailTargetId(null)}
            slotProps={{ paper: { sx: { borderRadius: '16px', width: 'min(500px, calc(100vw - 32px))', background: 'var(--bg-secondary)' } } }}
          >
            <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              Chi tiết lịch hẹn
              <StatusChip status={detail.statusOfAppointment} type="appointment" />
            </DialogTitle>
            <DialogContent sx={{ pt: '16px !important' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                <div><strong style={{ color: 'var(--text-primary)' }}>{detail.customerName}</strong>{detail.customerPhone ? ` - ${detail.customerPhone}` : ''}</div>
                <div>Ngày giờ: {formatDateTime(detail.dateTime)}</div>
                {!!detail.details?.length && (
                  <div>
                    Dịch vụ: {detail.details.map((d: any) => d.serviceName || d.serviceId).filter(Boolean).join(', ')}
                  </div>
                )}
                {detail.roomName && <div>Phòng: {detail.roomName}</div>}
                {detail.note && <div style={{ whiteSpace: 'pre-wrap' }}>Ghi chú: {detail.note}</div>}

                <div style={{ marginTop: 8 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 }}>Cập nhật trạng thái</p>
                  {availableActions.length ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {availableActions.map(({ action, label, icon }) => (
                        <Button
                          key={action}
                          size="small"
                          variant="outlined"
                          startIcon={icon}
                          disabled={activeAction !== null}
                          onClick={() => {
                            if (action === 'reschedule') {
                              openReschedule(detail);
                            } else {
                              runLifecycleAction(detail, action);
                            }
                          }}
                          sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 700 }}
                        >
                          {label}
                        </Button>
                      ))}
                      {canCancel(detail) && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon fontSize="small" />}
                          disabled={activeAction !== null}
                          onClick={() => setDeleteTarget(detail)}
                          sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 700 }}
                        >
                          Hủy lịch
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                      Lịch hẹn đã kết thúc, không thể đổi trạng thái.
                    </p>
                  )}
                </div>
              </div>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
              <Button
                onClick={() => { setDetailTargetId(null); openEdit(detail); }}
                startIcon={<EditIcon fontSize="small" />}
                sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 700, color: 'var(--primary)', mr: 'auto' }}
              >
                Chỉnh sửa
              </Button>
              <Button
                onClick={() => setDetailTargetId(null)}
                sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Đóng
              </Button>
            </DialogActions>
          </Dialog>
        );
      })()}

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

