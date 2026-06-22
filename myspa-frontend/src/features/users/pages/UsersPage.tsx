import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { Chip, IconButton } from '@mui/material';
import PageHeader from '@components/common/PageHeader';
import ConfirmDialog from '@components/common/ConfirmDialog';
import { mockUsers } from '@utils/mockData';
import type { User } from '@/types';
import { toast } from 'sonner';
import DeleteIcon from '@mui/icons-material/Delete';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const columns: GridColDef[] = [
    { field: 'userId', headerName: 'Mã người dùng', width: 140 },
    { field: 'userName', headerName: 'Tên đăng nhập', flex: 1, minWidth: 160 },
    { field: 'employeeName', headerName: 'Nhân viên', flex: 1 },
    {
      field: 'roles', headerName: 'Vai trò', flex: 1,
      renderCell: ({ value }) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(value as { name: string; description: string }[]).map(r => (
            <Chip key={r.name} label={r.description} size="small" sx={{ background: '#FEF3C7', color: '#D97706', fontWeight: 600, fontSize: 11, borderRadius: 1 }} />
          ))}
        </div>
      ),
    },
    {
      field: 'actions', headerName: 'Thao tác', width: 100, sortable: false,
      renderCell: ({ row }) => (
        <IconButton size="small" onClick={() => setDeleteTarget(row)} sx={{ color: '#EF4444', '&:hover': { background: '#FEE2E2' } }}><DeleteIcon fontSize="small" /></IconButton>
      ),
    },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Quản lý người dùng" subtitle={`${users.length} người dùng`} />
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <DataGrid rows={users} columns={columns} getRowId={r => r.userId} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10, 20]} autoHeight disableRowSelectionOnClick
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }}
          localeText={{ MuiTablePagination: { labelRowsPerPage: 'Hàng mỗi trang:', labelDisplayedRows: ({ from, to, count }: any) => `${from}–${to} / ${count}` }, noRowsLabel: 'Không có dữ liệu' } as any} />
      </div>
      <ConfirmDialog open={!!deleteTarget} title="Xóa người dùng" message={`Bạn có chắc muốn xóa người dùng "${deleteTarget?.userName}"?`} confirmLabel="Xóa" severity="error"
        onConfirm={() => { setUsers(prev => prev.filter(u => u.userId !== deleteTarget!.userId)); toast.success('Đã xóa người dùng'); setDeleteTarget(null); }} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
};

export default UsersPage;
