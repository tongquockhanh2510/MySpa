import React, { useEffect, useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { Alert, Chip, InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GroupIcon from '@mui/icons-material/Group';
import SecurityIcon from '@mui/icons-material/Security';
import PageHeader from '@components/common/PageHeader';
import { getRoles, getUsers } from '@/api/accessControl';
import type { Role, User } from '@/types';
import { toast } from 'sonner';
import './RolesPage.css';

const RolesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAccessControl = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [roleData, userData] = await Promise.all([getRoles(), getUsers()]);
      setRoles(roleData);
      setUsers(userData);
    } catch (error) {
      console.error(error);
      setLoadError('Không thể tải danh sách vai trò. Vui lòng thử lại.');
      toast.error('Lỗi khi tải danh sách vai trò');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAccessControl();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const roleRows = useMemo(
    () =>
      roles.map((role) => ({
        ...role,
        permissionCount: role.permissions.length,
        userCount: users.filter((user) => user.roles.some((userRole) => userRole.name === role.name)).length,
      })),
    [roles, users]
  );

  const filteredRows = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    if (!normalizedTerm) return roleRows;

    return roleRows.filter((role) =>
      [role.name, role.description, ...role.permissions.map((permission) => permission.name)]
        .join(' ')
        .toLowerCase()
        .includes(normalizedTerm)
    );
  }, [roleRows, searchTerm]);

  const totalPermissions = useMemo(
    () => new Set(roles.flatMap((role) => role.permissions.map((permission) => permission.name))).size,
    [roles]
  );

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Tên vai trò',
      minWidth: 170,
      renderCell: ({ value }) => <strong className="roles-page__role-name">{value}</strong>,
    },
    {
      field: 'description',
      headerName: 'Mô tả',
      flex: 1,
      minWidth: 220,
      renderCell: ({ value }) => <span className="roles-page__description">{value}</span>,
    },
    {
      field: 'userCount',
      headerName: 'Người dùng',
      width: 120,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'permissionCount',
      headerName: 'Số quyền',
      width: 110,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'permissions',
      headerName: 'Quyền hạn',
      flex: 1.5,
      minWidth: 320,
      renderCell: ({ value }) => {
        const permissions = value as Role['permissions'];

        return (
          <div className="roles-page__permissions">
            {permissions.slice(0, 5).map((permission) => (
              <Chip key={permission.name} label={permission.name} size="small" className="roles-page__permission-chip" />
            ))}
            {permissions.length > 5 && <Chip label={`+${permissions.length - 5}`} size="small" className="roles-page__more-chip" />}
          </div>
        );
      },
    },
  ];

  return (
    <main className="roles-page animate-fadeIn">
      <PageHeader title="Quản lý vai trò" subtitle={`${roles.length} vai trò đang cấu hình`} />

      {loadError && <Alert severity="warning">{loadError}</Alert>}

      <section className="roles-page__summary" aria-label="Tổng quan vai trò">
        <article className="roles-page__summary-card">
          <AdminPanelSettingsIcon />
          <div>
            <span>Tổng vai trò</span>
            <strong>{loading ? '...' : roles.length}</strong>
          </div>
        </article>
        <article className="roles-page__summary-card">
          <GroupIcon />
          <div>
            <span>Người dùng có vai trò</span>
            <strong>{loading ? '...' : users.length}</strong>
          </div>
        </article>
        <article className="roles-page__summary-card">
          <SecurityIcon />
          <div>
            <span>Quyền duy nhất</span>
            <strong>{loading ? '...' : totalPermissions}</strong>
          </div>
        </article>
      </section>

      <section className="roles-page__toolbar" aria-label="Bộ lọc vai trò">
        <TextField
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Tìm vai trò, mô tả hoặc mã quyền"
          size="small"
          className="roles-page__search"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <span>{filteredRows.length} vai trò phù hợp</span>
      </section>

      <div className="roles-page__panel">
        <DataGrid
          rows={filteredRows}
          columns={columns}
          getRowId={(row) => row.name}
          autoHeight
          disableRowSelectionOnClick
          loading={loading}
          pageSizeOptions={[10, 20]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              background: 'var(--bg-tertiary)',
            },
          }}
          localeText={{ noRowsLabel: 'Không có vai trò phù hợp' }}
        />
      </div>
    </main>
  );
};

export default RolesPage;
