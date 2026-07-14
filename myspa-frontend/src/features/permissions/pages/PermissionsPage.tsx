import React, { useEffect, useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { Alert, Box, Chip, InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SecurityIcon from '@mui/icons-material/Security';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PageHeader from '@components/common/PageHeader';
import { getPermissions } from '@/api/accessControl';
import type { Permission } from '@/types';
import { toast } from 'sonner';
import './PermissionsPage.css';

const actionLabels: Record<string, string> = {
  VIEW: 'Xem',
  CREATE: 'Tao moi',
  UPDATE: 'Cap nhat',
  DELETE: 'Xoa',
  MANAGE: 'Quan ly',
};

const moduleLabels: Record<string, string> = {
  CUSTOMER: 'Khach hang',
  EMPLOYEE: 'Nhan vien',
  APPOINTMENT: 'Lich hen',
  ORDER: 'Don hang',
  REPORT: 'Bao cao',
  USER: 'Nguoi dung',
  ROLE: 'Vai tro',
};

const getPermissionParts = (name: string) => {
  const [action, ...moduleParts] = name.split('_');
  const moduleKey = moduleParts.join('_');

  return {
    action: actionLabels[action] ?? action,
    module: moduleLabels[moduleKey] ?? moduleKey,
  };
};

const PermissionsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadPermissions = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setPermissions(await getPermissions());
    } catch (error) {
      console.error(error);
      setLoadError('Khong the tai danh sach quyen. Vui long thu lai.');
      toast.error('Loi khi tai danh sach quyen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPermissions();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const permissionRows = useMemo(
    () =>
      permissions.map((permission) => ({
        ...permission,
        ...getPermissionParts(permission.name),
      })),
    [permissions]
  );

  const filteredRows = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    if (!normalizedTerm) return permissionRows;

    return permissionRows.filter((permission) =>
      [permission.name, permission.description, permission.module, permission.action]
        .join(' ')
        .toLowerCase()
        .includes(normalizedTerm)
    );
  }, [permissionRows, searchTerm]);

  const modules = useMemo(() => new Set(permissionRows.map((permission) => permission.module)).size, [permissionRows]);
  const managementPermissions = useMemo(
    () => permissionRows.filter((permission) => permission.action === 'Quan ly').length,
    [permissionRows]
  );

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Ma quyen',
      minWidth: 220,
      flex: 0.8,
      renderCell: (params) => <strong className="permissions-page__code">{params.value}</strong>,
    },
    {
      field: 'module',
      headerName: 'Phan he',
      minWidth: 150,
      renderCell: (params) => <Chip size="small" label={params.value} className="permissions-page__chip" />,
    },
    {
      field: 'action',
      headerName: 'Thao tac',
      minWidth: 130,
    },
    {
      field: 'description',
      headerName: 'Mo ta',
      flex: 1,
      minWidth: 260,
      renderCell: (params) => <span className="permissions-page__description">{params.value}</span>,
    },
  ];

  return (
    <main className="permissions-page animate-fadeIn">
      <PageHeader title="Phan quyen he thong" subtitle={`${permissions.length} quyen han dang cau hinh`} />

      {loadError && <Alert severity="warning">{loadError}</Alert>}

      <section className="permissions-page__summary" aria-label="Tong quan quyen he thong">
        <article className="permissions-page__summary-card">
          <SecurityIcon />
          <div>
            <span>Tong quyen</span>
            <strong>{loading ? '...' : permissions.length}</strong>
          </div>
        </article>
        <article className="permissions-page__summary-card">
          <Inventory2Icon />
          <div>
            <span>Phan he</span>
            <strong>{loading ? '...' : modules}</strong>
          </div>
        </article>
        <article className="permissions-page__summary-card">
          <VpnKeyIcon />
          <div>
            <span>Quyen quan ly</span>
            <strong>{loading ? '...' : managementPermissions}</strong>
          </div>
        </article>
      </section>

      <section className="permissions-page__toolbar" aria-label="Bo loc quyen">
        <TextField
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Tim theo ma quyen, phan he hoac mo ta"
          size="small"
          className="permissions-page__search"
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
        <span>{filteredRows.length} quyen phu hop</span>
      </section>

      <div className="permissions-page__panel">
        <Box sx={{ width: '100%' }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            getRowId={(row) => row.name}
            autoHeight
            disableRowSelectionOnClick
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                background: 'var(--bg-tertiary)',
              },
            }}
            localeText={{ noRowsLabel: 'Khong co quyen phu hop' }}
          />
        </Box>
      </div>
    </main>
  );
};

export default PermissionsPage;
