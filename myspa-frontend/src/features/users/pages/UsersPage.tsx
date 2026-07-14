import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Alert, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControlLabel, IconButton, TextField, Tooltip,
} from '@mui/material';
import PageHeader from '@components/common/PageHeader';
import ConfirmDialog from '@components/common/ConfirmDialog';
import { activateUser, deactivateUser, getRoles, getUsers, resetUserPassword, updateUserRoles } from '@/api/accessControl';
import type { Role, User } from '@/types';
import { toast } from 'sonner';
import DeleteIcon from '@mui/icons-material/Delete';
import ShieldIcon from '@mui/icons-material/Shield';
import LockResetIcon from '@mui/icons-material/LockReset';
import HowToRegIcon from '@mui/icons-material/HowToReg';

const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14 }, '& .MuiInputLabel-root': { fontSize: 14 } };

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [roleTarget, setRoleTarget] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [passwordTarget, setPasswordTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setUsers(await getUsers());
    } catch (err) {
      console.error(err);
      setLoadError('Khong the tai danh sach nguoi dung. Vui long thu lai.');
      toast.error('Loi khi tai danh sach nguoi dung');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchUsers();
      getRoles().then(setAllRoles).catch((err) => console.error(err));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      return response?.data?.message || fallback;
    }
    return fallback;
  };

  const handleDeactivate = async () => {
    if (!deleteTarget) return;
    try {
      const saved = await deactivateUser(deleteTarget.userId);
      setUsers((prev) => prev.map((user) => user.userId === saved.userId ? saved : user));
      toast.success('Da vo hieu hoa nguoi dung');
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, 'Vo hieu hoa nguoi dung that bai'));
    }
  };

  const openRoleDialog = (user: User) => {
    setRoleTarget(user);
    setSelectedRoles((user.roles || []).map((role) => role.name));
  };

  const handleSaveRoles = async () => {
    if (!roleTarget) return;
    if (!selectedRoles.length) {
      toast.warning('Phai chon it nhat mot vai tro');
      return;
    }
    setSaving(true);
    try {
      const saved = await updateUserRoles(roleTarget.userId, selectedRoles);
      setUsers((prev) => prev.map((user) => user.userId === saved.userId ? saved : user));
      toast.success('Da cap nhat vai tro');
      setRoleTarget(null);
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, 'Cap nhat vai tro that bai'));
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!passwordTarget) return;
    if (newPassword.length < 6) {
      toast.warning('Mat khau phai co it nhat 6 ky tu');
      return;
    }
    setSaving(true);
    try {
      await resetUserPassword(passwordTarget.userId, newPassword);
      toast.success(`Da dat lai mat khau cho "${passwordTarget.userName}"`);
      setPasswordTarget(null);
      setNewPassword('');
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, 'Dat lai mat khau that bai'));
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (user: User) => {
    try {
      const saved = await activateUser(user.userId);
      setUsers((prev) => prev.map((item) => item.userId === saved.userId ? saved : item));
      toast.success('Da kich hoat lai tai khoan');
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, 'Kich hoat tai khoan that bai'));
    }
  };

  const columns: GridColDef[] = [
    { field: 'userId', headerName: 'Ma nguoi dung', width: 140 },
    { field: 'userName', headerName: 'Ten dang nhap', flex: 1, minWidth: 160 },
    { field: 'employeeName', headerName: 'Nhan vien', flex: 1, minWidth: 180 },
    {
      field: 'isActive',
      headerName: 'Trang thai',
      width: 140,
      renderCell: ({ value }) => (
        <Chip
          label={value === false ? 'Vo hieu hoa' : 'Hoat dong'}
          size="small"
          sx={{
            background: value === false ? 'var(--error-light)' : 'var(--success-light)',
            color: value === false ? '#DC2626' : 'var(--success)',
            fontWeight: 700,
            fontSize: 11,
            borderRadius: 1,
          }}
        />
      ),
    },
    {
      field: 'roles',
      headerName: 'Vai tro',
      flex: 1,
      minWidth: 220,
      renderCell: ({ value }) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(value as User['roles']).map((role) => (
            <Chip
              key={role.name}
              label={role.description || role.name}
              size="small"
              sx={{ background: 'var(--primary-100)', color: 'var(--primary)', fontWeight: 600, fontSize: 11, borderRadius: 1 }}
            />
          ))}
        </div>
      ),
    },
    {
      field: 'actions',
      headerName: 'Thao tac',
      width: 170,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) => (
        <div style={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Gan vai tro" arrow>
            <IconButton size="small" aria-label="Gan vai tro" onClick={() => openRoleDialog(row)} sx={{ color: 'var(--primary)', '&:hover': { background: 'var(--primary-100)' } }}>
              <ShieldIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Dat lai mat khau" arrow>
            <IconButton size="small" aria-label="Dat lai mat khau" onClick={() => { setPasswordTarget(row); setNewPassword(''); }} sx={{ color: '#2563EB', '&:hover': { background: 'var(--info-light)' } }}>
              <LockResetIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.isActive === false ? (
            <Tooltip title="Kich hoat lai" arrow>
              <IconButton size="small" aria-label="Kich hoat lai" onClick={() => handleActivate(row)} sx={{ color: '#059669', '&:hover': { background: 'var(--success-light)' } }}>
                <HowToRegIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Vo hieu hoa" arrow>
              <IconButton size="small" aria-label="Vo hieu hoa nguoi dung" onClick={() => setDeleteTarget(row)} sx={{ color: '#EF4444', '&:hover': { background: 'var(--error-light)' } }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Quan ly nguoi dung" subtitle={`${users.length} nguoi dung`} />
      {loadError && <Alert severity="warning" sx={{ mb: 2 }}>{loadError}</Alert>}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <DataGrid
          rows={users}
          columns={columns}
          getRowId={(row) => row.userId}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 20]}
          autoHeight
          disableRowSelectionOnClick
          loading={loading}
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }}
          localeText={{ noRowsLabel: 'Khong co du lieu' }}
        />
      </div>
      <Dialog
        open={!!roleTarget}
        onClose={() => !saving && setRoleTarget(null)}
        slotProps={{ paper: { sx: { borderRadius: '16px', width: 'min(420px, calc(100vw - 32px))', background: 'var(--bg-secondary)' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 0 }}>
          Gan vai tro — {roleTarget?.userName}
        </DialogTitle>
        <DialogContent sx={{ pt: '12px !important', display: 'flex', flexDirection: 'column' }}>
          {allRoles.map((role) => (
            <FormControlLabel
              key={role.name}
              control={
                <Checkbox
                  checked={selectedRoles.includes(role.name)}
                  onChange={(event) => setSelectedRoles((prev) => event.target.checked
                    ? [...prev, role.name]
                    : prev.filter((name) => name !== role.name))}
                  size="small"
                />
              }
              label={<span style={{ fontSize: 14 }}><strong>{role.name}</strong>{role.description ? ` — ${role.description}` : ''}</span>}
            />
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setRoleTarget(null)} disabled={saving} sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            Huy
          </Button>
          <Button onClick={handleSaveRoles} disabled={saving} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 700, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>
            {saving ? 'Dang luu...' : 'Luu vai tro'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!passwordTarget}
        onClose={() => !saving && setPasswordTarget(null)}
        slotProps={{ paper: { sx: { borderRadius: '16px', width: 'min(400px, calc(100vw - 32px))', background: 'var(--bg-secondary)' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 0 }}>
          Dat lai mat khau — {passwordTarget?.userName}
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <TextField
            label="Mat khau moi *"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            helperText="It nhat 6 ky tu"
            fullWidth size="small" sx={inputSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setPasswordTarget(null)} disabled={saving} sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            Huy
          </Button>
          <Button onClick={handleResetPassword} disabled={saving} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'inherit', fontWeight: 700, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>
            {saving ? 'Dang luu...' : 'Dat lai mat khau'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Vo hieu hoa nguoi dung"
        message={`Ban co chac muon vo hieu hoa nguoi dung "${deleteTarget?.userName}"?`}
        confirmLabel="Vo hieu hoa"
        severity="error"
        onConfirm={handleDeactivate}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default UsersPage;
