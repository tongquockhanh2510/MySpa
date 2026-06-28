import React, { useEffect, useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, IconButton, InputLabel,
  LinearProgress, MenuItem, Select, Skeleton, TextField, Typography,
} from '@mui/material';
import { toast } from 'sonner';
import PageHeader from '@components/common/PageHeader';
import { formatDate } from '@utils/formatters';
import { getCustomerTreatments } from '@/api/customerTreatments';
import { getCustomerSchedules, rescheduleTreatment, checkInSession, completeSession, getSessionHistoryBySchedule } from '@/api/treatment';
import { getEmployees, getRooms } from '@/api/catalog';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SpaIcon from '@mui/icons-material/Spa';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import './CustomerTreatmentsPage.css';

const scheduleLabel = (status: string) => ({
  SCHEDULED: 'Đã lên lịch',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  RESCHEDULED: 'Đã dời lịch',
}[status] || status);

const scheduleColor = (status: string) => {
  if (status === 'COMPLETED') return 'success';
  if (status === 'RESCHEDULED') return 'warning';
  if (status === 'IN_PROGRESS') return 'secondary';
  return 'primary';
};

const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px' } };

const CustomerTreatmentsPage: React.FC = () => {
  const [treatments, setTreatments] = useState<any[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<any | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);
  const [reschedDate, setReschedDate] = useState('');
  const [reschedTherapist, setReschedTherapist] = useState('');
  const [reschedRoom, setReschedRoom] = useState('');

  const [completeOpen, setCompleteOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState('');
  const [beforeImages, setBeforeImages] = useState('');
  const [afterImages, setAfterImages] = useState('');

  const [employees, setEmployees] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  const loadTreatments = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getCustomerTreatments();
      setTreatments(data);
    } catch (err) {
      console.error(err);
      setLoadError('Không thể tải danh sách liệu trình khách hàng.');
      toast.error('Lỗi khi tải danh sách liệu trình của khách hàng');
    } finally {
      setLoading(false);
    }
  };

  const loadCatalog = async () => {
    try {
      const [emp, rm] = await Promise.all([getEmployees(), getRooms()]);
      setEmployees(emp);
      setRooms(rm);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTreatments();
    loadCatalog();
  }, []);

  const loadSchedules = async (customerId: string) => {
    setScheduleLoading(true);
    try {
      const res = await getCustomerSchedules(customerId);
      setSchedules(res);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải lịch trình chi tiết');
    } finally {
      setScheduleLoading(false);
    }
  };

  const summary = useMemo(() => {
    const remaining = treatments.reduce((sum, item) => sum + Number(item.remainingSessions || 0), 0);
    const total = treatments.reduce((sum, item) => sum + Number(item.totalSessions || 0), 0);
    return { total: treatments.length, remaining, used: Math.max(0, total - remaining) };
  }, [treatments]);

  const handleOpenDetail = (row: any) => {
    setSelectedPkg(row);
    loadSchedules(row.customerId);
    setDetailOpen(true);
  };

  const handleCheckIn = async (schedule: any) => {
    try {
      const session = await checkInSession(schedule.scheduleId, schedule.therapistId);
      toast.success(`Check-in thành công cho buổi ${schedule.sessionNumber}`);
      setActiveSession(session);
      loadSchedules(selectedPkg.customerId);
      setCompleteOpen(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi check-in');
    }
  };

  const handleOpenComplete = async (schedule: any) => {
    try {
      const sessions = await getSessionHistoryBySchedule(schedule.scheduleId);
      const running = sessions.find((session: any) => !session.endTime);
      if (!running) {
        toast.error('Không tìm thấy phiên trị liệu đang thực hiện');
        return;
      }
      setActiveSession(running);
      setCompleteOpen(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi tải phiên trị liệu');
    }
  };

  const handleReschedule = async () => {
    if (!selectedSchedule) return;
    try {
      await rescheduleTreatment(selectedSchedule.scheduleId, {
        date: reschedDate,
        therapistId: reschedTherapist,
        roomId: reschedRoom,
      });
      toast.success('Đổi lịch thành công');
      setRescheduleOpen(false);
      loadSchedules(selectedPkg.customerId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi đổi lịch');
    }
  };

  const handleComplete = async () => {
    if (!activeSession) return;
    try {
      await completeSession(activeSession.sessionId, { notes, result, beforeImages, afterImages });
      toast.success('Lưu kết quả buổi trị liệu thành công');
      setCompleteOpen(false);
      setNotes('');
      setResult('');
      setBeforeImages('');
      setAfterImages('');
      loadSchedules(selectedPkg.customerId);
      loadTreatments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi hoàn thành');
    }
  };

  const columns: GridColDef[] = [
    { field: 'customerId', headerName: 'Mã KH', width: 220 },
    {
      field: 'customerName',
      headerName: 'Khách hàng',
      flex: 1,
      minWidth: 180,
      renderCell: ({ row }) => (
        <div className="treatments-customer-cell">
          <strong>{row.customerName}</strong>
          <span>{row.customerPhone || 'Chưa có số điện thoại'}</span>
        </div>
      ),
    },
    { field: 'packageName', headerName: 'Gói liệu trình', flex: 1, minWidth: 220 },
    {
      field: 'remainingSessions',
      headerName: 'Tiến độ buổi',
      width: 240,
      renderCell: ({ row }) => {
        const total = row.totalSessions || 10;
        const remaining = row.remainingSessions;
        const used = total - remaining;
        const pct = Math.max(0, Math.min(100, (used / total) * 100));
        return (
          <div className="treatments-progress-cell">
            <span>Đã dùng {used}/{total} buổi - còn {remaining}</span>
            <LinearProgress variant="determinate" value={pct} className="treatments-progress" />
          </div>
        );
      },
    },
    { field: 'purchaseDate', headerName: 'Ngày mua', width: 120, renderCell: ({ value }) => formatDate(value) },
    { field: 'expiryDate', headerName: 'Hết hạn', width: 120, renderCell: ({ value }) => formatDate(value) },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 170,
      sortable: false,
      renderCell: ({ row }) => (
        <Button size="small" onClick={() => handleOpenDetail(row)} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12, fontWeight: 700 }}>
          Lịch trình
        </Button>
      ),
    },
  ];

  return (
    <main className="treatments-page animate-fadeIn">
      <PageHeader title="Liệu trình & trị liệu khách hàng" subtitle={`${treatments.length} liệu trình của khách`} />

      {loadError && <Alert severity="warning" className="treatments-alert">{loadError}</Alert>}

      <section className="treatments-summary" aria-label="Tóm tắt liệu trình">
        <div className="treatments-summary-card"><span><SpaIcon /></span><div><strong>{loading ? '...' : summary.total}</strong><p>Liệu trình đang quản lý</p></div></div>
        <div className="treatments-summary-card"><span><AssignmentTurnedInIcon /></span><div><strong>{loading ? '...' : summary.used}</strong><p>Buổi đã sử dụng</p></div></div>
        <div className="treatments-summary-card"><span><EventRepeatIcon /></span><div><strong>{loading ? '...' : summary.remaining}</strong><p>Buổi còn lại</p></div></div>
      </section>

      <section className="treatments-panel">
        {loading ? (
          <div className="treatments-skeleton" aria-busy="true" aria-label="Đang tải liệu trình">
            {Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} variant="rounded" height={48} />)}
          </div>
        ) : (
          <DataGrid
            rows={treatments}
            columns={columns}
            getRowId={row => `${row.customerId}-${row.packageId}`}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[10, 20]}
            autoHeight
            disableRowSelectionOnClick
            sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }}
            localeText={{ noRowsLabel: 'Chưa có liệu trình khách hàng' }}
          />
        )}
      </section>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', width: 'min(820px, calc(100vw - 32px))', background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 0 }}>Lịch trình liệu trình: {selectedPkg?.packageName}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {selectedPkg && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div className="treatments-detail-grid">
                <Typography variant="body2">Khách hàng: <strong>{selectedPkg.customerName}</strong></Typography>
                <Typography variant="body2">Điện thoại: <strong>{selectedPkg.customerPhone || 'Chưa có'}</strong></Typography>
                <Typography variant="body2">Hạn sử dụng: <strong>{formatDate(selectedPkg.expiryDate)}</strong></Typography>
                <Typography variant="body2">Số buổi còn lại: <strong>{selectedPkg.remainingSessions}</strong></Typography>
              </div>

              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Danh sách các buổi điều trị</Typography>
              <div className="treatments-schedule-list">
                {scheduleLoading ? (
                  Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} variant="rounded" height={76} />)
                ) : schedules.map((schedule) => (
                  <Card key={schedule.scheduleId} variant="outlined" className="treatments-schedule-card">
                    <CardContent className="treatments-schedule-card__content">
                      <div>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Buổi {schedule.sessionNumber}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Ngày dự kiến: {schedule.scheduledDate} | KTV: {schedule.therapistName || 'Chưa chọn'} | Phòng: {schedule.roomName || 'Chưa chọn'}
                        </Typography>
                      </div>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <Chip label={scheduleLabel(schedule.status)} size="small" color={scheduleColor(schedule.status) as any} sx={{ fontWeight: 700, fontSize: 11 }} />
                        {schedule.status !== 'COMPLETED' && schedule.status !== 'IN_PROGRESS' && (
                          <>
                            <IconButton size="small" aria-label="Đổi lịch" onClick={() => { setSelectedSchedule(schedule); setReschedDate(schedule.scheduledDate); setReschedTherapist(schedule.therapistId || ''); setReschedRoom(schedule.roomId || ''); setRescheduleOpen(true); }} sx={{ color: 'var(--primary)' }}><CalendarMonthIcon fontSize="small" /></IconButton>
                            <Button size="small" startIcon={<PlayArrowIcon />} onClick={() => handleCheckIn(schedule)} variant="contained" sx={{ textTransform: 'none', fontSize: 11, borderRadius: 2, background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#fff', fontWeight: 700 }}>Check-in</Button>
                          </>
                        )}
                        {schedule.status === 'IN_PROGRESS' && (
                          <Button size="small" startIcon={<CheckCircleIcon />} onClick={() => handleOpenComplete(schedule)} variant="contained" sx={{ textTransform: 'none', fontSize: 11, borderRadius: 2, background: '#059669', color: '#fff', fontWeight: 700 }}>Hoàn thành</Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDetailOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rescheduleOpen} onClose={() => setRescheduleOpen(false)} slotProps={{ paper: { sx: { borderRadius: '12px', width: 'min(430px, calc(100vw - 32px))', background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 16 }}>Đổi lịch buổi trị liệu</DialogTitle>
        <DialogContent sx={{ pt: '12px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Ngày hẹn mới" type="date" slotProps={{ inputLabel: { shrink: true } }} size="small" fullWidth value={reschedDate} onChange={event => setReschedDate(event.target.value)} sx={inputSx} />
          <FormControl fullWidth size="small" sx={inputSx}>
            <InputLabel>Kỹ thuật viên</InputLabel>
            <Select value={reschedTherapist} label="Kỹ thuật viên" onChange={event => setReschedTherapist(event.target.value)}>
              {employees.map(employee => <MenuItem key={employee.employeeId} value={employee.employeeId}>{employee.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" sx={inputSx}>
            <InputLabel>Phòng</InputLabel>
            <Select value={reschedRoom} label="Phòng" onChange={event => setReschedRoom(event.target.value)}>
              {rooms.map(room => <MenuItem key={room.roomId} value={room.roomId}>{room.roomName}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setRescheduleOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Hủy</Button>
          <Button onClick={handleReschedule} variant="contained" sx={{ borderRadius: 2, textTransform: 'none', background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#fff' }}>Lưu thay đổi</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={completeOpen} onClose={() => setCompleteOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', width: 'min(540px, calc(100vw - 32px))', background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 0 }}>Ghi nhận kết quả trị liệu</DialogTitle>
        <DialogContent sx={{ pt: '16px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2">Ghi chú kết quả buổi điều trị và lưu liên kết hình ảnh trước/sau điều trị của khách hàng.</Typography>
          <TextField label="Ghi chú buổi điều trị" multiline rows={2} fullWidth size="small" value={notes} onChange={event => setNotes(event.target.value)} sx={inputSx} />
          <TextField label="Kết quả chẩn đoán / đánh giá da" multiline rows={2} fullWidth size="small" value={result} onChange={event => setResult(event.target.value)} sx={inputSx} />
          <TextField label="Link ảnh trước điều trị" fullWidth size="small" value={beforeImages} onChange={event => setBeforeImages(event.target.value)} sx={inputSx} />
          <TextField label="Link ảnh sau điều trị" fullWidth size="small" value={afterImages} onChange={event => setAfterImages(event.target.value)} sx={inputSx} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCompleteOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Bỏ qua</Button>
          <Button onClick={handleComplete} startIcon={<CheckCircleIcon />} variant="contained" sx={{ borderRadius: 2, textTransform: 'none', background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#fff' }}>Hoàn thành buổi trị liệu</Button>
        </DialogActions>
      </Dialog>
    </main>
  );
};

export default CustomerTreatmentsPage;
