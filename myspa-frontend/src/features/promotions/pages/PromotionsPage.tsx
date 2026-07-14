import React, { useEffect, useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import PageHeader from '@components/common/PageHeader';
import ConfirmDialog from '@components/common/ConfirmDialog';
import { createPromotion, deletePromotion, getPromotions, type PromotionFormData } from '@/api/promotions';
import { formatCurrency, formatDateTime } from '@utils/formatters';
import type { Promotion } from '@/types';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PercentIcon from '@mui/icons-material/Percent';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import SearchIcon from '@mui/icons-material/Search';
import './PromotionsPage.css';

const inputSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14 },
  '& .MuiInputLabel-root': { fontSize: 14 },
};

const isLivePromotion = (promotion: Promotion) => {
  const now = Date.now();
  const startsAt = promotion.effective ? new Date(promotion.effective).getTime() : 0;
  const endsAt = promotion.expiration ? new Date(promotion.expiration).getTime() : Number.POSITIVE_INFINITY;

  return promotion.isActive && startsAt <= now && now <= endsAt;
};

const PromotionsPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [type, setType] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT');

  const { control, handleSubmit, reset, watch } = useForm<PromotionFormData>({
    defaultValues: {
      type: 'AMOUNT',
      name: '',
      code: '',
      minOrderValue: 0,
      effective: '',
      expiration: '',
      quantity: undefined,
      maxUsesPerCustomer: undefined,
      isActive: true,
      discount: 0,
      percent: 0,
      maxDiscount: 0,
      applyScope: 'ORDER',
      targetType: '',
      targetId: '',
    },
  });

  const applyScope = watch('applyScope');

  const loadPromotions = async () => {
    try {
      setPromotions(await getPromotions());
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách khuyến mãi');
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  const filteredPromotions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return promotions;
    }

    return promotions.filter((promotion) =>
      [promotion.name, promotion.code, promotion.applyScope, promotion.targetType, promotion.targetId]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [promotions, search]);

  const amountPromotions = useMemo(
    () => filteredPromotions.filter((promotion) => promotion.type === 'AMOUNT'),
    [filteredPromotions]
  );
  const percentPromotions = useMemo(
    () => filteredPromotions.filter((promotion) => promotion.type === 'PERCENT'),
    [filteredPromotions]
  );
  const activePromotions = useMemo(() => promotions.filter((promotion) => promotion.isActive).length, [promotions]);
  const livePromotions = useMemo(() => promotions.filter(isLivePromotion).length, [promotions]);

  const openCreate = () => {
    const selectedType = tab === 0 ? 'AMOUNT' : 'PERCENT';

    setType(selectedType);
    reset({
      type: selectedType,
      name: '',
      code: '',
      minOrderValue: 0,
      effective: '',
      expiration: '',
      quantity: undefined,
      maxUsesPerCustomer: undefined,
      isActive: true,
      discount: 0,
      percent: 0,
      maxDiscount: 0,
      applyScope: 'ORDER',
      targetType: '',
      targetId: '',
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: PromotionFormData) => {
    try {
      const payload = { ...data, type };
      const saved = await createPromotion(payload);
      setPromotions((prev) => [saved, ...prev]);
      toast.success('Thêm khuyến mãi thành công');
      setDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Thêm khuyến mãi thất bại');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePromotion(deleteTarget.promotionId);
      setPromotions((prev) => prev.filter((promotion) => promotion.promotionId !== deleteTarget.promotionId));
      toast.success('Đã ngừng khuyến mãi');
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      toast.error('Xóa khuyến mãi thất bại');
    }
  };

  const statusCell = ({ value, row }: any) => {
    const isLive = isLivePromotion(row);

    return (
      <Chip
        icon={
          value ? (
            <CheckCircleIcon sx={{ fontSize: 14, color: '#059669 !important' }} />
          ) : (
            <CancelIcon sx={{ fontSize: 14, color: '#DC2626 !important' }} />
          )
        }
        label={value ? (isLive ? 'Đang chạy' : 'Đã bật') : 'Đã tắt'}
        size="small"
        className={value ? 'promotions-page__status promotions-page__status--active' : 'promotions-page__status promotions-page__status--off'}
      />
    );
  };

  const actionColumn: GridColDef = {
    field: 'actions',
    headerName: 'Thao tác',
    width: 90,
    sortable: false,
    renderCell: ({ row }) => (
      <IconButton size="small" onClick={() => setDeleteTarget(row)} sx={{ color: '#EF4444' }}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    ),
  };

  const baseColumns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Tên khuyến mãi',
      flex: 1,
      minWidth: 220,
      renderCell: ({ row }) => (
        <div className="promotions-page__name-cell" title={row.applyScope === 'ITEM' ? 'Áp dụng theo mặt hàng' : 'Áp dụng toàn đơn hàng'}>
          <strong>{row.name}</strong>
        </div>
      ),
    },
    {
      field: 'code',
      headerName: 'Mã code',
      width: 140,
      renderCell: ({ value }) => <code className="promotions-page__code">{value}</code>,
    },
    { field: 'minOrderValue', headerName: 'Đơn tối thiểu', width: 140, renderCell: ({ value }) => formatCurrency(value || 0) },
    { field: 'effective', headerName: 'Bắt đầu', width: 150, renderCell: ({ value }) => (value ? formatDateTime(value) : '') },
    { field: 'expiration', headerName: 'Kết thúc', width: 150, renderCell: ({ value }) => (value ? formatDateTime(value) : '') },
    {
      field: 'quantity', headerName: 'Đã dùng / giới hạn', width: 150, align: 'center', headerAlign: 'center',
      renderCell: ({ row }) => `${row.usedCount || 0}/${row.initialQuantity == null ? '∞' : row.initialQuantity}`,
    },
    { field: 'isActive', headerName: 'Trạng thái', width: 130, renderCell: statusCell },
    actionColumn,
  ];

  const amountColumns: GridColDef[] = [
    ...baseColumns.slice(0, 1),
    {
      field: 'discount',
      headerName: 'Giảm (VNĐ)',
      width: 130,
      renderCell: ({ value }) => <strong className="promotions-page__discount">-{formatCurrency(value || 0)}</strong>,
    },
    ...baseColumns.slice(1),
  ];

  const percentColumns: GridColDef[] = [
    ...baseColumns.slice(0, 1),
    {
      field: 'percent',
      headerName: 'Giảm (%)',
      width: 100,
      renderCell: ({ value }) => <strong className="promotions-page__discount">-{value || 0}%</strong>,
    },
    { field: 'maxDiscount', headerName: 'Giảm tối đa', width: 130, renderCell: ({ value }) => formatCurrency(value || 0) },
    ...baseColumns.slice(1),
  ];

  const gridSx = { border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } };

  return (
    <main className="promotions-page animate-fadeIn">
      <PageHeader
        title="Quản lý khuyến mãi"
        subtitle="Thiết lập ưu đãi theo số tiền, phần trăm và phạm vi áp dụng"
        action={{ label: 'Thêm khuyến mãi', onClick: openCreate, icon: <AddIcon fontSize="small" /> }}
      />

      <section className="promotions-page__summary" aria-label="Tổng quan khuyến mãi">
        <article className="promotions-page__summary-card">
          <LocalOfferIcon />
          <div>
            <span>Tổng khuyến mãi</span>
            <strong>{promotions.length}</strong>
          </div>
        </article>
        <article className="promotions-page__summary-card">
          <CheckCircleIcon />
          <div>
            <span>Đang bật</span>
            <strong>{activePromotions}</strong>
          </div>
        </article>
        <article className="promotions-page__summary-card">
          <EventAvailableIcon />
          <div>
            <span>Đang chạy</span>
            <strong>{livePromotions}</strong>
          </div>
        </article>
        <article className="promotions-page__summary-card">
          <PercentIcon />
          <div>
            <span>Giảm theo %</span>
            <strong>{promotions.filter((promotion) => promotion.type === 'PERCENT').length}</strong>
          </div>
        </article>
      </section>

      <section className="promotions-page__toolbar" aria-label="Tìm kiếm khuyến mãi">
        <TextField
          placeholder="Tìm tên, mã code hoặc phạm vi áp dụng"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          size="small"
          className="promotions-page__search"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'var(--text-tertiary)' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={inputSx}
        />
        <span>{filteredPromotions.length} kết quả</span>
      </section>

      <div className="promotions-page__panel">
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          className="promotions-page__tabs"
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontFamily: 'inherit', fontWeight: 500, fontSize: 14 },
            '& .Mui-selected': { color: 'var(--primary) !important', fontWeight: 600 },
            '& .MuiTabs-indicator': { background: 'var(--primary)' },
          }}
        >
          <Tab label={`Giảm tiền trực tiếp (${amountPromotions.length})`} />
          <Tab label={`Giảm theo phần trăm (${percentPromotions.length})`} />
        </Tabs>
        <Box>
          {tab === 0 && (
            <DataGrid
              rows={amountPromotions}
              columns={amountColumns}
              getRowId={(row) => row.promotionId}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              pageSizeOptions={[10, 20]}
              autoHeight
              disableRowSelectionOnClick
              sx={gridSx}
              localeText={{ noRowsLabel: 'Không có khuyến mãi phù hợp' }}
            />
          )}
          {tab === 1 && (
            <DataGrid
              rows={percentPromotions}
              columns={percentColumns}
              getRowId={(row) => row.promotionId}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              pageSizeOptions={[10, 20]}
              autoHeight
              disableRowSelectionOnClick
              sx={gridSx}
              localeText={{ noRowsLabel: 'Không có khuyến mãi phù hợp' }}
            />
          )}
        </Box>
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '16px',
              width: 'min(580px, calc(100vw - 32px))',
              background: 'var(--bg-secondary)',
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17, pb: 0 }}>Thêm khuyến mãi</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <form noValidate className="promotions-page__form">
            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel>Loại khuyến mãi</InputLabel>
              <Select value={type} label="Loại khuyến mãi" onChange={(event) => setType(event.target.value as 'AMOUNT' | 'PERCENT')}>
                <MenuItem value="AMOUNT">Giảm tiền cố định</MenuItem>
                <MenuItem value="PERCENT">Giảm phần trăm</MenuItem>
              </Select>
            </FormControl>
            <Controller name="name" control={control} render={({ field }) => <TextField {...field} label="Tên khuyến mãi" fullWidth size="small" sx={inputSx} />} />
            <Controller name="code" control={control} render={({ field }) => <TextField {...field} label="Mã code" fullWidth size="small" sx={inputSx} />} />
            <div className="promotions-page__form-grid">
              <Controller
                name="minOrderValue"
                control={control}
                render={({ field }) => (
                  <TextField {...field} onChange={(event) => field.onChange(Number(event.target.value))} label="Đơn tối thiểu" type="number" fullWidth size="small" sx={inputSx} />
                )}
              />
              <Controller
                name="quantity"
                control={control}
                render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} onChange={(event) => field.onChange(event.target.value === '' ? undefined : Number(event.target.value))} label="Tổng lượt dùng" placeholder="Không giới hạn" helperText="Để trống nếu không giới hạn" type="number" fullWidth size="small" sx={inputSx} />
                )}
              />
              <Controller
                name="maxUsesPerCustomer"
                control={control}
                render={({ field }) => (
                  <TextField {...field} value={field.value ?? ''} onChange={(event) => field.onChange(event.target.value === '' ? undefined : Number(event.target.value))} label="Lượt tối đa/khách" placeholder="Không giới hạn" type="number" fullWidth size="small" sx={inputSx} />
                )}
              />
              <Controller name="effective" control={control} render={({ field }) => <TextField {...field} label="Bắt đầu" type="datetime-local" fullWidth size="small" sx={inputSx} slotProps={{ inputLabel: { shrink: true } }} />} />
              <Controller name="expiration" control={control} render={({ field }) => <TextField {...field} label="Kết thúc" type="datetime-local" fullWidth size="small" sx={inputSx} slotProps={{ inputLabel: { shrink: true } }} />} />
              {type === 'AMOUNT' && (
                <Controller
                  name="discount"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} onChange={(event) => field.onChange(Number(event.target.value))} label="Số tiền giảm" type="number" fullWidth size="small" sx={inputSx} />
                  )}
                />
              )}
              {type === 'PERCENT' && (
                <Controller
                  name="percent"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} onChange={(event) => field.onChange(Number(event.target.value))} label="Phần trăm giảm" type="number" fullWidth size="small" sx={inputSx} />
                  )}
                />
              )}
              {type === 'PERCENT' && (
                <Controller
                  name="maxDiscount"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} onChange={(event) => field.onChange(Number(event.target.value))} label="Giảm tối đa" type="number" fullWidth size="small" sx={inputSx} />
                  )}
                />
              )}
            </div>
            <Controller
              name="applyScope"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth size="small" sx={inputSx}>
                  <InputLabel>Phạm vi áp dụng</InputLabel>
                  <Select {...field} label="Phạm vi áp dụng">
                    <MenuItem value="ORDER">Toàn đơn hàng</MenuItem>
                    <MenuItem value="ITEM">Theo sản phẩm/dịch vụ/gói</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            {applyScope === 'ITEM' && (
              <div className="promotions-page__form-grid">
                <Controller
                  name="targetType"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small" sx={inputSx}>
                      <InputLabel>Loại đối tượng</InputLabel>
                      <Select {...field} label="Loại đối tượng">
                        <MenuItem value="PRODUCT">Sản phẩm</MenuItem>
                        <MenuItem value="SERVICE">Dịch vụ</MenuItem>
                        <MenuItem value="PACKAGE">Gói liệu trình</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
                <Controller name="targetId" control={control} render={({ field }) => <TextField {...field} label="Mã đối tượng" fullWidth size="small" sx={inputSx} />} />
              </div>
            )}
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            Hủy
          </Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
            Thêm khuyến mãi
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa khuyến mãi"
        message={`Bạn có chắc muốn ngừng khuyến mãi "${deleteTarget?.name}"?`}
        confirmLabel="Xóa"
        severity="error"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
};

export default PromotionsPage;
