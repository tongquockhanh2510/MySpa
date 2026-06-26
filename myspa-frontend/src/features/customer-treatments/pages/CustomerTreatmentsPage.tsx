import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  LinearProgress, Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Typography, Box, Card, CardContent, Divider, TextField, FormControl, InputLabel, Select, MenuItem, IconButton
} from '@mui/material';
import { toast } from 'sonner';
import PageHeader from '@components/common/PageHeader';
import { formatDate } from '@utils/formatters';

// API imports
import { getCustomerTreatments } from '@/api/customerTreatments';
import { getCustomerSchedules, rescheduleTreatment, checkInSession, completeSession, getSessionHistoryBySchedule } from '@/api/treatment';
import { getEmployees, getRooms } from '@/api/catalog';

// Icons
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const CustomerTreatmentsPage: React.FC = () => {
  const [treatments, setTreatments] = useState<any[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<any | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);

  // Dialogs
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

  // Catalog
  const [employees, setEmployees] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    loadTreatments();
    loadCatalog();
  }, []);

  const loadTreatments = async () => {
    try {
      const data = await getCustomerTreatments();
      setTreatments(data);
    } catch (err) {
      toast.error('Lỗi khi tải danh sách liệu trình của khách hàng');
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

  const loadSchedules = async (customerId: string) => {
    try {
      const res = await getCustomerSchedules(customerId);
      setSchedules(res);
    } catch (err) {
      toast.error('Lỗi khi tải lịch trình chi tiết');
    }
  };

  const handleOpenDetail = (row: any) => {
    setSelectedPkg(row);
    loadSchedules(row.customerId);
    setDetailOpen(true);
  };

  // Start (Check-in)
  const handleCheckIn = async (schedule: any) => {
    try {
      const session = await checkInSession(schedule.scheduleId, schedule.therapistId);
      toast.success(`Check-in thành công cho buổi ${schedule.sessionNumber}`);
      setActiveSession(session);
      loadSchedules(selectedPkg.customerId);
      setCompleteOpen(true); // Open completion dialog directly
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

  // Reschedule
  const handleReschedule = async () => {
    if (!selectedSchedule) return;
    try {
      await rescheduleTreatment(selectedSchedule.scheduleId, {
        date: reschedDate,
        therapistId: reschedTherapist,
        roomId: reschedRoom
      });
      toast.success('Đổi lịch thành công');
      setRescheduleOpen(false);
      loadSchedules(selectedPkg.customerId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi đổi lịch');
    }
  };

  // Complete session notes
  const handleComplete = async () => {
    if (!activeSession) return;
    try {
      await completeSession(activeSession.sessionId, {
        notes,
        result,
        beforeImages,
        afterImages
      });
      toast.success('Lưu kết quả buổi trị liệu thành công');
      setCompleteOpen(false);
      setNotes('');
      setResult('');
      setBeforeImages('');
      setAfterImages('');
      loadSchedules(selectedPkg.customerId);
      loadTreatments(); // Refresh package remaining sessions
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi hoàn thành');
    }
  };

  const columns: GridColDef[] = [
    { field: 'customerId', headerName: 'Mã KH', width: 220 },
    { field: 'customerName', headerName: 'Khách hàng', flex: 1, minWidth: 160 },
    { field: 'packageName', headerName: 'Tên gói liệu trình', flex: 1, minWidth: 200 },
    {
      field: 'remainingSessions', headerName: 'Tiến độ buổi', width: 220,
      renderCell: ({ row }) => {
        const total = row.totalSessions || 10;
        const remaining = row.remainingSessions;
        const used = total - remaining;
        const pct = Math.max(0, Math.min(100, (used / total) * 100));
        return (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4, height: '100%', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Đã dùng: {used}/{total} buổi (Còn lại: {remaining})</span>
            </div>
            <LinearProgress variant="determinate" value={pct} sx={{ borderRadius: 4, height: 6, background: 'var(--bg-tertiary)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #D97706, #F59E0B)', borderRadius: 4 } }} />
          </div>
        );
      },
    },
    { field: 'purchaseDate', headerName: 'Ngày mua', width: 120, renderCell: ({ value }) => formatDate(value) },
    { field: 'expiryDate', headerName: 'Hết hạn', width: 120, renderCell: ({ value }) => formatDate(value) },
    {
      field: 'actions', headerName: 'Thao tác', width: 150, sortable: false,
      renderCell: ({ row }) => (
        <Button size="small" onClick={() => handleOpenDetail(row)} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>
          Lịch trình & Check-in
        </Button>
      )
    }
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Liệu trình & Trị liệu khách hàng" subtitle={`${treatments.length} liệu trình của khách`} />
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <DataGrid rows={treatments} columns={columns} getRowId={r => `${r.customerId}-${r.packageId}`}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10, 20]} autoHeight disableRowSelectionOnClick
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }} />
      </div>

      {/* Package Detail Dialog with Schedules */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', minWidth: 700, background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17, pb: 0 }}>Lịch trình liệu trình: {selectedPkg?.packageName}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {selectedPkg && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Typography variant="body2">Khách hàng: <strong>{selectedPkg.customerName}</strong></Typography>
                <Typography variant="body2">Điện thoại: <strong>{selectedPkg.customerPhone}</strong></Typography>
                <Typography variant="body2">Hạn sử dụng: <strong>{formatDate(selectedPkg.expiryDate)}</strong></Typography>
                <Typography variant="body2">Số buổi còn lại: <strong>{selectedPkg.remainingSessions}</strong></Typography>
              </Box>

              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Danh sách các buổi điều trị</Typography>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {schedules.map((sch) => (
                  <div key={sch.scheduleId}>
                    <Card variant="outlined" sx={{ borderRadius: 2, background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                      <CardContent sx={{ p: '12px !important', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Buổi {sch.sessionNumber}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Ngày dự kiến: {sch.scheduledDate} | KTV: {sch.therapistName || 'Chưa chọn'} | Phòng: {sch.roomName || 'Chưa chọn'}
                          </Typography>
                        </div>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip
                            label={sch.status === 'SCHEDULED' ? 'Đã lên lịch' : sch.status === 'IN_PROGRESS' ? 'Đang thực hiện' : sch.status === 'COMPLETED' ? 'Hoàn thành' : sch.status === 'RESCHEDULED' ? 'Đã dời lịch' : sch.status}
                            size="small"
                            color={sch.status === 'COMPLETED' ? 'success' : sch.status === 'RESCHEDULED' ? 'warning' : sch.status === 'IN_PROGRESS' ? 'secondary' : 'primary'}
                            sx={{ fontWeight: 600, fontSize: 10 }}
                          />
                          
                          {sch.status !== 'COMPLETED' && sch.status !== 'IN_PROGRESS' && (
                            <>
                              <IconButton size="small" onClick={() => { setSelectedSchedule(sch); setReschedDate(sch.scheduledDate); setReschedTherapist(sch.therapistId || ''); setReschedRoom(sch.roomId || ''); setRescheduleOpen(true); }} sx={{ color: 'var(--primary)' }}><CalendarMonthIcon fontSize="small" /></IconButton>
                              <Button size="small" startIcon={<PlayArrowIcon />} onClick={() => handleCheckIn(sch)} variant="contained"
                                sx={{ textTransform: 'none', fontSize: 11, borderRadius: 2, background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#fff' }}>
                                Check-in
                              </Button>
                            </>
                          )}
                          {sch.status === 'IN_PROGRESS' && (
                            <Button size="small" startIcon={<CheckCircleIcon />} onClick={() => handleOpenComplete(sch)} variant="contained"
                              sx={{ textTransform: 'none', fontSize: 11, borderRadius: 2, background: '#059669', color: '#fff' }}>
                              Hoàn thành
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDetailOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleOpen} onClose={() => setRescheduleOpen(false)} slotProps={{ paper: { sx: { borderRadius: '12px', minWidth: 400, background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>Đổi lịch buổi trị liệu</DialogTitle>
        <DialogContent sx={{ pt: '12px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Ngày hẹn mới" type="date" slotProps={{ inputLabel: { shrink: true } }} size="small" fullWidth value={reschedDate} onChange={e => setReschedDate(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
          
          <FormControl fullWidth size="small">
            <InputLabel>Kỹ thuật viên</InputLabel>
            <Select value={reschedTherapist} label="Kỹ thuật viên" onChange={e => setReschedTherapist(e.target.value)} sx={{ borderRadius: 2 }}>
              {employees.map(e => <MenuItem key={e.employeeId} value={e.employeeId}>{e.name}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Phòng</InputLabel>
            <Select value={reschedRoom} label="Phòng" onChange={e => setReschedRoom(e.target.value)} sx={{ borderRadius: 2 }}>
              {rooms.map(r => <MenuItem key={r.roomId} value={r.roomId}>{r.roomName}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setRescheduleOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Hủy</Button>
          <Button onClick={handleReschedule} variant="contained" sx={{ borderRadius: 2, textTransform: 'none', background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#fff' }}>Lưu thay đổi</Button>
        </DialogActions>
      </Dialog>

      {/* Session Execution & Completion Dialog */}
      <Dialog open={completeOpen} onClose={() => setCompleteOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', minWidth: 500, background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17, pb: 0 }}>Ghi nhận kết quả trị liệu</DialogTitle>
        <DialogContent sx={{ pt: '16px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2">Tiến hành ghi chú kết quả buổi điều trị và tải lên hình ảnh trước/sau điều trị của khách hàng.</Typography>
          
          <TextField label="Ghi chú buổi điều trị" multiline rows={2} fullWidth size="small" value={notes} onChange={e => setNotes(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
          <TextField label="Kết quả chẩn đoán / Đánh giá da" multiline rows={2} fullWidth size="small" value={result} onChange={e => setResult(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
          <TextField label="Link ảnh trước điều trị" fullWidth size="small" value={beforeImages} onChange={e => setBeforeImages(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
          <TextField label="Link ảnh sau điều trị" fullWidth size="small" value={afterImages} onChange={e => setAfterImages(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCompleteOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Bỏ qua</Button>
          <Button onClick={handleComplete} startIcon={<CheckCircleIcon />} variant="contained" sx={{ borderRadius: 2, textTransform: 'none', background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#fff' }}>Hoàn thành buổi trị liệu</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CustomerTreatmentsPage;
