import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Skeleton, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ROUTES } from '@constants/routes';
import PageHeader from '@components/common/PageHeader';
import { createPackageConversion, getPackageConversions, type PackageConversionFormData } from '@/api/packageConversions';
import { getProducts, getTreatmentPackages } from '@/api/catalog';
import { getCustomerTreatments } from '@/api/customerTreatments';
import { formatCurrency, formatDate, getConversionTypeLabel } from '@utils/formatters';
import { ConversionType } from '@/types';
import type { CustomerTreatment, PackageConversion, Product, TreatmentPackage } from '@/types';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import DiscountIcon from '@mui/icons-material/Discount';
import './PackageConversionsPage.css';

const inputSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 14 },
  '& .MuiInputLabel-root': { fontSize: 14 },
};

const conversionLabels: Record<ConversionType, string> = {
  [ConversionType.TO_SERVICE]: 'Đổi sang dịch vụ',
  [ConversionType.TO_PRODUCT]: 'Đổi sang sản phẩm',
  [ConversionType.TO_DISCOUNT]: 'Đổi thành tiền giảm đơn hàng',
  [ConversionType.TO_PACKAGE]: 'Đổi sang gói liệu trình khác',
};

const PackageConversionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [conversions, setConversions] = useState<PackageConversion[]>([]);
  const [customerTreatments, setCustomerTreatments] = useState<CustomerTreatment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<TreatmentPackage[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { control, handleSubmit, reset, watch, setValue } = useForm<PackageConversionFormData>({
    defaultValues: { customerId: '', packageId: '', conversionType: ConversionType.TO_DISCOUNT, conversionValue: 0, targetProductId: '', targetPackageId: '', quantity: 1, note: '' },
  });

  const conversionType = watch('conversionType');
  const customerId = watch('customerId');
  const packageId = watch('packageId');
  const targetProductId = watch('targetProductId');
  const targetPackageId = watch('targetPackageId');
  const quantity = watch('quantity') || 1;
  const conversionValue = watch('conversionValue') || 0;

  const activeTreatments = useMemo(() => customerTreatments.filter(treatment => treatment.remainingSessions > 0), [customerTreatments]);
  const selectedTreatment = activeTreatments.find(treatment => treatment.customerId === customerId && treatment.packageId === packageId);
  const uniqueCustomers = activeTreatments.filter((item, index, arr) => arr.findIndex(other => other.customerId === item.customerId) === index);
  const packagesByCustomer = activeTreatments.filter(treatment => treatment.customerId === customerId);
  const canSubmit = Boolean(
    customerId
    && packageId
    && (conversionType !== ConversionType.TO_PRODUCT || targetProductId)
    && (conversionType !== ConversionType.TO_PACKAGE || targetPackageId)
  );

  const summary = useMemo(() => ({
    total: conversions.length,
    value: conversions.reduce((sum, item) => sum + Number(item.conversionValue || 0), 0),
    eligible: activeTreatments.length,
  }), [conversions, activeTreatments]);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [conversionData, treatmentData, productData, packageData] = await Promise.all([
        getPackageConversions(),
        getCustomerTreatments(),
        getProducts(),
        getTreatmentPackages(),
      ]);
      setConversions(conversionData);
      setCustomerTreatments(treatmentData);
      setProducts(productData);
      setPackages(packageData);
    } catch (err) {
      console.error(err);
      setLoadError('Không thể tải dữ liệu chuyển đổi liệu trình.');
      toast.error('Lỗi khi tải dữ liệu chuyển đổi liệu trình');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedTreatment) return;
    const totalSessions = selectedTreatment.totalSessions ?? 0;
    const packagePrice = selectedTreatment.packagePrice ?? 0;
    const perSessionValue = totalSessions > 0 ? packagePrice / totalSessions : 0;
    setValue('conversionValue', Math.round(perSessionValue * selectedTreatment.remainingSessions));
  }, [selectedTreatment, setValue]);

  const openCreate = () => {
    reset({ customerId: '', packageId: '', conversionType: ConversionType.TO_DISCOUNT, conversionValue: 0, targetProductId: '', targetPackageId: '', quantity: 1, note: '' });
    setDialogOpen(true);
  };

  // Uoc tinh so tien bu / hoan lai theo lua chon hien tai (server tinh chinh xac, co VAT)
  const targetPrice = useMemo(() => {
    if (conversionType === ConversionType.TO_PRODUCT) {
      const product = products.find(item => item.productId === targetProductId);
      return product ? Number(product.price || 0) * quantity : 0;
    }
    if (conversionType === ConversionType.TO_PACKAGE) {
      const pack = packages.find(item => item.treatmentPackageId === targetPackageId);
      return pack ? Number(pack.packagePrice || 0) : 0;
    }
    return 0;
  }, [conversionType, targetProductId, targetPackageId, quantity, products, packages]);

  const estimatedDiff = targetPrice - conversionValue;

  const onSubmit = async (data: PackageConversionFormData) => {
    setSaving(true);
    try {
      const saved = await createPackageConversion(data);
      setConversions(prev => [saved, ...prev]);
      setCustomerTreatments(prev => prev.map(treatment =>
        treatment.customerId === data.customerId && treatment.packageId === data.packageId
          ? { ...treatment, remainingSessions: 0, packageConversionId: saved.conversionId }
          : treatment
      ));
      setDialogOpen(false);
      setResult(saved);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Chuyển đổi liệu trình thất bại');
    } finally {
      setSaving(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'conversionId', headerName: 'Mã chuyển đổi', width: 160 },
    {
      field: 'customerName',
      headerName: 'Khách hàng',
      width: 190,
      renderCell: ({ value }) => <span className="conversions-strong-cell">{value}</span>,
    },
    { field: 'packageName', headerName: 'Gói liệu trình', flex: 1, minWidth: 220 },
    {
      field: 'conversionType',
      headerName: 'Loại chuyển đổi',
      width: 230,
      renderCell: ({ value }) => {
        const isProduct = value === ConversionType.TO_PRODUCT;
        return <Chip label={conversionLabels[value as ConversionType] || getConversionTypeLabel(value)} size="small" className={isProduct ? 'conversions-chip conversions-chip--green' : 'conversions-chip'} />;
      },
    },
    { field: 'conversionValue', headerName: 'Giá trị', width: 150, renderCell: ({ value }) => <span className="conversions-money">{formatCurrency(value || 0)}</span> },
    {
      field: 'outcome',
      headerName: 'Kết quả',
      flex: 1,
      minWidth: 210,
      renderCell: ({ row }) => {
        if (row.targetPackageName) return <span>{row.targetPackageName}{row.convertedSessions ? ` - ${row.convertedSessions} buổi` : ''}</span>;
        if (row.targetProductName) return <span>{row.targetProductName}</span>;
        if (row.voucherCode) return <span className="conversions-strong-cell">{row.voucherCode}</span>;
        return <span>—</span>;
      },
    },
    {
      field: 'topUpAmount',
      headerName: 'Tiền bù',
      width: 140,
      renderCell: ({ row, value }) => {
        if (row.orderId == null) return <span>—</span>;
        const amount = Number(value || 0);
        return amount > 0
          ? <span className="conversions-money">{formatCurrency(amount)}</span>
          : <Chip label="Đã trừ đủ" size="small" className="conversions-chip conversions-chip--green" />;
      },
    },
    { field: 'conversionDate', headerName: 'Ngày chuyển đổi', width: 150, renderCell: ({ value }) => formatDate(value) },
    { field: 'note', headerName: 'Ghi chú', flex: 1, minWidth: 180 },
  ];

  return (
    <main className="conversions-page animate-fadeIn">
      <PageHeader title="Chuyển đổi liệu trình" subtitle={`${conversions.length} lần chuyển đổi`} action={{ label: 'Tạo chuyển đổi', onClick: openCreate }} />

      {loadError && <Alert severity="warning" className="conversions-alert">{loadError}</Alert>}

      <section className="conversions-summary" aria-label="Tóm tắt chuyển đổi">
        <div className="conversions-summary-card"><span><SwapHorizIcon /></span><div><strong>{loading ? '...' : summary.total}</strong><p>Lần chuyển đổi</p></div></div>
        <div className="conversions-summary-card"><span><DiscountIcon /></span><div><strong>{loading ? '...' : formatCurrency(summary.value)}</strong><p>Giá trị quy đổi</p></div></div>
        <div className="conversions-summary-card"><span><CardGiftcardIcon /></span><div><strong>{loading ? '...' : summary.eligible}</strong><p>Liệu trình còn buổi</p></div></div>
      </section>

      <section className="conversions-panel">
        {loading ? (
          <div className="conversions-skeleton" aria-busy="true" aria-label="Đang tải chuyển đổi">
            {Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} variant="rounded" height={48} />)}
          </div>
        ) : (
          <DataGrid rows={conversions} columns={columns} getRowId={row => row.conversionId}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10, 20]} autoHeight disableRowSelectionOnClick
            sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }}
            localeText={{ noRowsLabel: 'Chưa có chuyển đổi liệu trình' }} />
        )}
      </section>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', width: 'min(580px, calc(100vw - 32px))', background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 0 }}>Tạo chuyển đổi liệu trình</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <form noValidate className="conversions-form">
            <Controller name="customerId" control={control} render={({ field }) => (
              <FormControl fullWidth size="small" sx={inputSx}>
                <InputLabel>Khách hàng</InputLabel>
                <Select {...field} label="Khách hàng" onChange={event => { field.onChange(event); setValue('packageId', ''); }}>
                  {uniqueCustomers.map(treatment => <MenuItem key={treatment.customerId} value={treatment.customerId}>{treatment.customerName}</MenuItem>)}
                </Select>
              </FormControl>
            )} />
            <Controller name="packageId" control={control} render={({ field }) => (
              <FormControl fullWidth size="small" sx={inputSx}>
                <InputLabel>Gói liệu trình còn buổi</InputLabel>
                <Select {...field} label="Gói liệu trình còn buổi">
                  {packagesByCustomer.map(treatment => <MenuItem key={treatment.packageId} value={treatment.packageId}>{treatment.packageName} - còn {treatment.remainingSessions} buổi</MenuItem>)}
                </Select>
              </FormControl>
            )} />
            <Controller name="conversionType" control={control} render={({ field }) => (
              <FormControl fullWidth size="small" sx={inputSx}>
                <InputLabel>Kiểu chuyển đổi</InputLabel>
                <Select {...field} label="Kiểu chuyển đổi" onChange={event => { field.onChange(event); setValue('targetProductId', ''); setValue('targetPackageId', ''); }}>
                  <MenuItem value={ConversionType.TO_DISCOUNT}>Đổi thành tiền giảm đơn hàng</MenuItem>
                  <MenuItem value={ConversionType.TO_PRODUCT}>Đổi sang sản phẩm</MenuItem>
                  <MenuItem value={ConversionType.TO_PACKAGE}>Đổi sang gói liệu trình khác</MenuItem>
                </Select>
              </FormControl>
            )} />
            {conversionType === ConversionType.TO_PRODUCT && (
              <div className="conversions-target-picker">
                <p className="conversions-target-picker__label">Chọn sản phẩm nhận</p>
                <div className="conversions-card-grid">
                  {products.filter((product: any) => product.isActive !== false).map((product: any) => {
                    const selected = targetProductId === product.productId;
                    return (
                      <button
                        type="button"
                        key={product.productId}
                        className={`conversions-target-card${selected ? ' conversions-target-card--selected' : ''}`}
                        onClick={() => setValue('targetProductId', product.productId, { shouldValidate: true })}
                      >
                        {product.image ? <img src={product.image} alt="" /> : <span className="conversions-target-card__placeholder">🧴</span>}
                        <strong>{product.name}</strong>
                        <span>{formatCurrency(Number(product.price || 0))}</span>
                      </button>
                    );
                  })}
                </div>
                {targetProductId && (
                  <Controller name="quantity" control={control} render={({ field }) => (
                    <TextField
                      {...field}
                      onChange={event => field.onChange(Math.max(1, Number(event.target.value || 1)))}
                      label="Số lượng"
                      type="number"
                      size="small"
                      sx={{ ...inputSx, maxWidth: 160, mt: 1.5 }}
                    />
                  )} />
                )}
              </div>
            )}
            {conversionType === ConversionType.TO_PACKAGE && (
              <div className="conversions-target-picker">
                <p className="conversions-target-picker__label">Chọn gói liệu trình mới</p>
                <div className="conversions-card-grid">
                  {packages.filter((pack: any) => pack.treatmentPackageId !== packageId).map((pack: any) => {
                    const selected = targetPackageId === pack.treatmentPackageId;
                    return (
                      <button
                        type="button"
                        key={pack.treatmentPackageId}
                        className={`conversions-target-card${selected ? ' conversions-target-card--selected' : ''}`}
                        onClick={() => setValue('targetPackageId', pack.treatmentPackageId, { shouldValidate: true })}
                      >
                        <span className="conversions-target-card__placeholder">💆</span>
                        <strong>{pack.packageName}</strong>
                        <span>{formatCurrency(Number(pack.packagePrice || 0))} · {pack.totalSessions} buổi</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="conversions-estimate">
              <div>
                <span>Giá trị quy đổi (số buổi còn lại)</span>
                <strong>{formatCurrency(conversionValue)}</strong>
              </div>
              {(conversionType === ConversionType.TO_PRODUCT || conversionType === ConversionType.TO_PACKAGE) && targetPrice > 0 && (
                <>
                  <div>
                    <span>Giá trị nhận</span>
                    <strong>{formatCurrency(targetPrice)}</strong>
                  </div>
                  <div>
                    <span>{estimatedDiff >= 0 ? 'Số tiền khách cần bù (chưa gồm VAT)' : 'Phần dư hoàn lại bằng voucher'}</span>
                    <strong className={estimatedDiff >= 0 ? 'conversions-estimate--due' : 'conversions-estimate--refund'}>
                      {formatCurrency(Math.abs(estimatedDiff))}
                    </strong>
                  </div>
                </>
              )}
              {conversionType === ConversionType.TO_DISCOUNT && (
                <p className="conversions-estimate__hint">Khách sẽ nhận voucher trị giá {formatCurrency(conversionValue)} dùng cho đơn hàng bất kỳ trong 90 ngày.</p>
              )}
            </div>
            <Controller name="note" control={control} render={({ field }) => <TextField {...field} label="Ghi chú" multiline rows={3} fullWidth size="small" sx={inputSx} />} />
          </form>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={!canSubmit || saving} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>
            {saving ? 'Đang xử lý...' : 'Chuyển đổi'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!result} onClose={() => setResult(null)} slotProps={{ paper: { sx: { borderRadius: '16px', width: 'min(460px, calc(100vw - 32px))', background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 0 }}>✅ Chuyển đổi thành công</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
              <div>Giá trị quy đổi: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(Number(result.conversionValue || 0))}</strong></div>
              {result.targetProductName && <div>Sản phẩm nhận: <strong style={{ color: 'var(--text-primary)' }}>{result.targetProductName}</strong></div>}
              {result.targetPackageName && <div>Gói mới: <strong style={{ color: 'var(--text-primary)' }}>{result.targetPackageName}</strong></div>}
              {result.orderId && Number(result.topUpAmount || 0) > 0 && (
                <Alert severity="warning" sx={{ borderRadius: '10px' }}>
                  Đã tạo đơn hàng chuyển đổi. Khách cần bù thêm <strong>{formatCurrency(Number(result.topUpAmount))}</strong> (đã gồm VAT).
                </Alert>
              )}
              {result.orderId && Number(result.topUpAmount || 0) <= 0 && (
                <Alert severity="success" sx={{ borderRadius: '10px' }}>
                  Đơn hàng chuyển đổi đã được thanh toán đủ bằng giá trị quy đổi.
                </Alert>
              )}
              {result.leftoverVoucherCode && (
                <Alert severity="info" sx={{ borderRadius: '10px' }}>
                  Phần dư được hoàn bằng voucher: <strong>{result.leftoverVoucherCode}</strong>
                </Alert>
              )}
              {!result.orderId && result.voucherCode && (
                <Alert severity="info" sx={{ borderRadius: '10px' }}>
                  Voucher tín dụng: <strong>{result.voucherCode}</strong> (hạn 90 ngày)
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          {result?.orderId && Number(result?.topUpAmount || 0) > 0 && (
            <Button
              onClick={() => { setResult(null); navigate(ROUTES.ORDERS); }}
              variant="contained"
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}
            >
              Đi đến thanh toán
            </Button>
          )}
          <Button onClick={() => setResult(null)} sx={{ borderRadius: '10px', textTransform: 'none', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </main>
  );
};

export default PackageConversionsPage;
