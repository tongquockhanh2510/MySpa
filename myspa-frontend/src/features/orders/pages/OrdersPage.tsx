import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, IconButton, InputAdornment,
  InputLabel, MenuItem, Select, Skeleton, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import { toast } from 'sonner';
import PageHeader from '@components/common/PageHeader';
import StatusChip from '@components/common/StatusChip';
import { formatCurrency, formatDateTime } from '@utils/formatters';
import { getCustomers } from '@/api/customers';
import { getAppointmentById } from '@/api/appointments';
import { getOrders, createOrder, payOrder, getOrderById, getBankQr, refundOrder, type BankQrInfo } from '@/api/orders';
import { hasAnyRole } from '@utils/authorization';
import { useAppSelector } from '@hooks/useAppSelector';
import { getServices, getProducts, getTreatmentPackages, getEmployees, getRooms } from '@/api/catalog';
import { getPromotions } from '@/api/promotions';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DeleteIcon from '@mui/icons-material/Delete';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import PaymentIcon from '@mui/icons-material/Payment';
import ReplayIcon from '@mui/icons-material/Replay';
import SearchIcon from '@mui/icons-material/Search';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useIsMobile } from '@hooks/useIsMobile';
import OrdersListMobile from './OrdersListMobile';
import './OrdersPage.css';

const DEFAULT_PRODUCT_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72"><rect width="72" height="72" rx="10" fill="%23F3F4F6"/><path d="M17 49l11-14 9 10 6-8 12 12H17z" fill="%23D97706"/><circle cx="47" cy="24" r="6" fill="%23F59E0B"/></svg>';

const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px' } };

const OrdersPage: React.FC = () => {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<'list' | 'create'>('list');
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [ordersSearch, setOrdersSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const currentUser = useAppSelector((state) => state.auth.user);
  const canRefund = hasAnyRole(currentUser, ['ADMIN', 'MANAGER']);

  const [detailOpen, setDetailOpen] = useState(false);
  const [debtOpen, setDebtOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [txnRef, setTxnRef] = useState('');
  const [bankQr, setBankQr] = useState<BankQrInfo | null>(null);
  const [bankQrLoading, setBankQrLoading] = useState(false);

  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    address: '',
  });

  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [catalogTab, setCatalogTab] = useState(0);
  const [barcodeInput, setBarcodeInput] = useState('');

  const [cart, setCart] = useState<any[]>([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [promoId, setPromoId] = useState('');
  const [promotions, setPromotions] = useState<any[]>([]);
  const [pointsToUse, setPointsToUse] = useState('');
  const [prefilledAppointmentId, setPrefilledAppointmentId] = useState<string | null>(null);
  const [sourceAppointment, setSourceAppointment] = useState<any | null>(null);

  const loadOrders = async () => {
    setOrdersLoading(true);
    setLoadError(null);
    try {
      const data = await getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setLoadError('Không thể tải danh sách đơn hàng. Vui lòng kiểm tra đăng nhập hoặc quyền truy cập.');
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleRefund = async (order: any) => {
    if (!window.confirm(`Hoàn/hủy đơn ${order.displayCode || order.orderId}? Thao tác sẽ trả lại tồn kho và hồi tố hoa hồng (không thể hoàn tác).`)) {
      return;
    }
    const reason = window.prompt('Lý do hoàn đơn (không bắt buộc):') || undefined;
    setRefundingId(order.orderId);
    try {
      await refundOrder(order.orderId, reason);
      toast.success('Đã hoàn đơn và hồi tố hoa hồng');
      loadOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Hoàn đơn không thành công');
    } finally {
      setRefundingId(null);
    }
  };

  const loadCatalog = async () => {
    setCatalogLoading(true);
    try {
      const [serviceData, productData, packageData, employeeData, roomData, promotionData] = await Promise.all([
        getServices(),
        getProducts(),
        getTreatmentPackages(),
        getEmployees(),
        getRooms(),
        getPromotions().catch(() => []),
      ]);
      setServices(serviceData);
      setProducts(productData);
      setPackages(packageData);
      setEmployees(employeeData);
      setRooms(roomData);
      const now = Date.now();
      setPromotions((Array.isArray(promotionData) ? promotionData : []).filter((promo: any) => (
        promo.isActive !== false
        && (!promo.effective || new Date(promo.effective).getTime() <= now)
        && (!promo.expiration || new Date(promo.expiration).getTime() >= now)
        && (promo.quantity == null || promo.quantity > 0)
      )));
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh mục sản phẩm/dịch vụ');
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    loadCatalog();
  }, []);

  // Chuyen khoan: tai ma VietQR cho don dang thanh toan
  useEffect(() => {
    if (!paymentOpen || payMethod !== 'BANK_TRANSFER' || !selectedOrder?.orderId) {
      setBankQr(null);
      return;
    }
    let cancelled = false;
    setBankQrLoading(true);
    getBankQr(selectedOrder.orderId)
      .then((info) => { if (!cancelled) setBankQr(info); })
      .catch((err) => {
        console.error(err);
        if (!cancelled) toast.error(err.response?.data?.message || 'Không tạo được mã QR chuyển khoản');
      })
      .finally(() => { if (!cancelled) setBankQrLoading(false); });
    return () => { cancelled = true; };
  }, [paymentOpen, payMethod, selectedOrder?.orderId]);

  // Poll trang thai don moi 4s khi dang cho khach quet QR — webhook bao co se tu ghi nhan
  useEffect(() => {
    if (!paymentOpen || payMethod !== 'BANK_TRANSFER' || !selectedOrder?.orderId) return;
    const orderId = selectedOrder.orderId;
    const interval = setInterval(async () => {
      try {
        const fresh = await getOrderById(orderId);
        if (fresh.orderStatus === 'PAID' || Number(fresh.remainingAmount || 0) <= 0) {
          clearInterval(interval);
          toast.success(sourceAppointment ? 'Đã thanh toán cho lịch hẹn' : '🎉 Đã nhận được tiền chuyển khoản, đơn hàng thanh toán thành công!');
          setPaymentOpen(false);
          setDetailOpen(false);
          setPayAmount('');
          setTxnRef('');
          loadOrders();
        } else if (Number(fresh.paidAmount || 0) > Number(selectedOrder.paidAmount || 0)) {
          setSelectedOrder(fresh);
          setPayAmount(String(fresh.remainingAmount));
          toast.info('Đã nhận một phần tiền chuyển khoản');
        }
      } catch (err) {
        console.error(err);
      }
    }, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentOpen, payMethod, selectedOrder?.orderId, sourceAppointment]);

  useEffect(() => {
    const appointmentId = searchParams.get('appointmentId');
    if (!appointmentId || prefilledAppointmentId === appointmentId || catalogLoading) return;

    const applyAppointment = async () => {
      setView('create');
      setCustomerMode('existing');
      setPrefilledAppointmentId(appointmentId);
      setSourceAppointment(null);

      const appointment = await getAppointmentById(appointmentId);
      setSourceAppointment(appointment);

      const customer = {
        customerId: appointment.customerId,
        name: appointment.customerName,
        phone: appointment.customerPhone,
        loyaltyPoints: 0,
      };
      setCustomersList((prev) => {
        const exists = prev.some((item: any) => item.customerId === appointment.customerId);
        return exists ? prev : [customer, ...prev];
      });
      setSelectedCustomer(customer);

      const scheduledDateTime = appointment.dateTime ? appointment.dateTime.slice(0, 16) : getCurrentDateTimeLocal();
      const appointmentItems = (appointment.details || []).map((detail: any) => {
        const service = services.find((item) => item.serviceId === detail.serviceId);
        return {
          itemType: 'SERVICE',
          itemId: detail.serviceId,
          name: detail.serviceName || service?.name || 'Dịch vụ',
          price: detail.price ?? service?.price ?? 0,
          quantity: 1,
          therapistId: detail.employeeId || '',
          roomId: appointment.roomId || '',
          scheduledDateTime,
          sourceAppointmentId: appointment.appointmentId,
        };
      });
      setCart(appointmentItems);
      toast.success('Đã tải lịch hẹn vào đơn hàng');
    };

    applyAppointment().catch((error) => {
      console.error(error);
      toast.error('Không thể lấy dữ liệu lịch hẹn để tạo đơn hàng');
    });
  }, [catalogLoading, prefilledAppointmentId, searchParams, services]);

  const searchCustomers = async (query: string) => {
    if (query.length < 2) return;
    try {
      const res = await getCustomers(query);
      setCustomersList(res);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (item: any, type: 'SERVICE' | 'PRODUCT' | 'PACKAGE') => {
    const itemId = item.serviceId || item.productId || item.treatmentPackageId;
    const existing = cart.find((cartItem) => cartItem.itemType === type && cartItem.itemId === itemId);

    if (existing) {
      setCart(cart.map((cartItem) => cartItem.itemId === existing.itemId ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem));
    } else {
      setCart([...cart, {
        itemType: type,
        itemId,
        name: item.name || item.packageName,
        price: item.price || item.packagePrice,
        image: item.image,
        barcode: item.barcode,
        sku: item.sku,
        quantity: 1,
        therapistId: '',
        roomId: '',
        scheduledDateTime: '',
      }]);
    }
    toast.success(`Đã thêm ${item.name || item.packageName} vào giỏ hàng`);
  };

  const addProductByBarcode = () => {
    const code = barcodeInput.trim();
    if (!code) return;
    const product = products.find((item) => item.barcode === code || item.sku === code);
    if (!product) {
      toast.error('Không tìm thấy sản phẩm theo mã vạch/SKU');
      return;
    }
    addToCart(product, 'PRODUCT');
    setBarcodeInput('');
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateCartItem = (index: number, fields: any) => {
    setCart(cart.map((item, itemIndex) => itemIndex === index ? { ...item, ...fields } : item));
  };

  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }

    const payload: any = {
      appointmentId: sourceAppointment?.appointmentId || undefined,
      items: cart.map((item) => ({
        itemType: item.itemType,
        productId: item.itemType === 'PRODUCT' ? item.itemId : null,
        serviceId: item.itemType === 'SERVICE' ? item.itemId : null,
        packageId: item.itemType === 'PACKAGE' ? item.itemId : null,
        quantity: item.quantity,
        therapistId: item.therapistId || null,
        roomId: item.roomId || null,
        scheduledDateTime: item.scheduledDateTime
          ? (item.scheduledDateTime.length === 16 ? `${item.scheduledDateTime}:00` : item.scheduledDateTime)
          : null,
      })),
    };

    if (customerMode === 'existing') {
      if (!selectedCustomer) {
        toast.error('Vui lòng chọn khách hàng');
        return;
      }
      payload.customerId = selectedCustomer.customerId;
    } else {
      if (!newCustomerForm.name || !newCustomerForm.phone) {
        toast.error('Tên và số điện thoại khách hàng mới không được để trống');
        return;
      }
      payload.newCustomer = {
        name: newCustomerForm.name.trim(),
        phone: newCustomerForm.phone.trim(),
        email: newCustomerForm.email.trim() || undefined,
        gender: newCustomerForm.gender,
        dateOfBirth: newCustomerForm.dateOfBirth || undefined,
        address: newCustomerForm.address.trim() || undefined,
      };
    }

    if (voucherCode) payload.voucherCode = voucherCode;
    if (promoId) payload.promotionId = promoId;
    if (customerMode === 'existing' && Number(pointsToUse) > 0) payload.loyaltyPointsToUse = Number(pointsToUse);

    try {
      const created = await createOrder(payload);
      toast.success('Khởi tạo đơn hàng thành công');
      setView('list');
      setCart([]);
      setVoucherCode('');
      setPromoId('');
      setPointsToUse('');
      setSelectedCustomer(null);
      setNewCustomerForm({ name: '', phone: '', email: '', gender: '', dateOfBirth: '', address: '' });
      loadOrders();
      setSelectedOrder(created);
      setPayAmount(created.remainingAmount.toString());
      setPaymentOpen(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng');
    }
  };

  const submitPayment = async () => {
    if (!selectedOrder) return;
    try {
      await payOrder(selectedOrder.orderId, {
        amount: Number(payAmount),
        paymentMethod: payMethod,
        transactionReference: txnRef,
        notes: 'Thanh toán hóa đơn POS',
      });
      toast.success(sourceAppointment ? 'Đã thanh toán cho lịch hẹn' : 'Xử lý thanh toán thành công');
      setPaymentOpen(false);
      setDetailOpen(false);
      setPayAmount('');
      setTxnRef('');
      loadOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi thanh toán');
    }
  };

  const viewDetail = async (order: any) => {
    try {
      const fullOrder = await getOrderById(order.orderId);
      setSelectedOrder(fullOrder);
      setDetailOpen(true);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải chi tiết đơn hàng');
    }
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);

  // Uoc tinh giam gia phia client (server tinh lai chinh xac khi tao don)
  const selectedPromo = promotions.find((promo) => promo.promotionId === promoId);
  const promoDiscountEstimate = useMemo(() => {
    if (!selectedPromo || cartSubtotal <= 0) return 0;
    let base = cartSubtotal;
    if ((selectedPromo.applyScope || 'ORDER').toUpperCase() === 'ITEM') {
      base = cart
        .filter((item) => item.itemType === (selectedPromo.targetType || '').toUpperCase() && item.itemId === selectedPromo.targetId)
        .reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
    }
    if (selectedPromo.minOrderValue && cartSubtotal < Number(selectedPromo.minOrderValue)) return 0;
    if ((selectedPromo.type || '').toUpperCase() === 'PERCENT') {
      const raw = base * Number(selectedPromo.percent || 0) / 100;
      const cap = Number(selectedPromo.maxDiscount || 0);
      return cap > 0 ? Math.min(raw, cap) : raw;
    }
    return Math.min(Number(selectedPromo.discount || 0), base);
  }, [selectedPromo, cart, cartSubtotal]);

  const availablePoints = customerMode === 'existing' ? Math.floor(Number(selectedCustomer?.loyaltyPoints || 0)) : 0;
  const amountAfterPromo = Math.max(0, cartSubtotal - promoDiscountEstimate);
  const maxUsablePoints = Math.min(availablePoints, Math.floor(amountAfterPromo / 1000));
  const loyaltyDiscountEstimate = Math.min(Number(pointsToUse || 0) * 1000, amountAfterPromo);
  const taxableEstimate = Math.max(0, cartSubtotal - promoDiscountEstimate - loyaltyDiscountEstimate);
  const taxEstimate = taxableEstimate * 10 / 110;
  const totalEstimate = taxableEstimate;

  const filteredOrders = useMemo(() => {
    const query = ordersSearch.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch = !query
        || order.displayCode?.toLowerCase().includes(query)
        || order.orderId?.toLowerCase().includes(query)
        || order.customerName?.toLowerCase().includes(query)
        || order.customerPhone?.includes(query);
      const ageDays = order.createdAt ? Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 86400000) : 0;
      const matchesStatus = orderStatusFilter === 'ALL'
        || (orderStatusFilter === 'OVERDUE'
          ? Number(order.remainingAmount || 0) > 0 && order.orderStatus !== 'CANCELLED' && ageDays >= 7
          : order.orderStatus === orderStatusFilter);
      return matchesSearch && matchesStatus;
    });
  }, [orders, ordersSearch, orderStatusFilter]);

  const orderSummary = useMemo(() => ({
    total: orders.length,
    revenue: orders.reduce((sum, order) => sum + Number(order.paidAmount || 0), 0),
    unpaid: orders.reduce((sum, order) => sum + Number(order.remainingAmount || 0), 0),
    open: orders.filter((order) => Number(order.remainingAmount || 0) > 0 && order.orderStatus !== 'CANCELLED').length,
  }), [orders]);

  const debtsByCustomer = useMemo(() => {
    const grouped = new Map<string, any>();
    orders.filter(order => Number(order.remainingAmount || 0) > 0 && order.orderStatus !== 'CANCELLED')
      .forEach(order => {
        const key = order.customerId || order.customerName || 'guest';
        const current = grouped.get(key) || {
          id: key, customerName: order.customerName || 'Khách lẻ', customerPhone: order.customerPhone || '',
          totalDebt: 0, orderCount: 0, oldestDays: 0,
        };
        const ageDays = order.createdAt ? Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 86400000)) : 0;
        current.totalDebt += Number(order.remainingAmount || 0);
        current.orderCount += 1;
        current.oldestDays = Math.max(current.oldestDays, ageDays);
        grouped.set(key, current);
      });
    return [...grouped.values()].sort((a, b) => b.totalDebt - a.totalDebt);
  }, [orders]);

  const columns: GridColDef[] = [
    { field: 'displayCode', headerName: 'Mã đơn', width: 150, renderCell: ({ row }) => row.displayCode || row.orderId },
    {
      field: 'customerName',
      headerName: 'Khách hàng',
      flex: 1,
      minWidth: 180,
      renderCell: ({ row }) => (
        <div className="orders-customer-cell">
          <strong title={row.customerName || 'Khách lẻ'}>{row.customerName || 'Khách lẻ'}</strong>
        </div>
      ),
    },
    { field: 'totalAmount', headerName: 'Tổng tiền', width: 140, renderCell: ({ value }) => <span className="orders-money orders-money--primary">{formatCurrency(value || 0)}</span> },
    { field: 'paidAmount', headerName: 'Đã thanh toán', width: 150, renderCell: ({ value }) => <span className="orders-money orders-money--paid">{formatCurrency(value || 0)}</span> },
    { field: 'remainingAmount', headerName: 'Còn lại', width: 130, renderCell: ({ value }) => <span className={Number(value) > 0 ? 'orders-money orders-money--due' : 'orders-money orders-money--paid'}>{formatCurrency(value || 0)}</span> },
    { field: 'orderStatus', headerName: 'Trạng thái', width: 160, renderCell: ({ value }) => <StatusChip status={value} type="order" /> },
    { field: 'createdAt', headerName: 'Ngày tạo', width: 170, renderCell: ({ value }) => formatDateTime(value) },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 300,
      sortable: false,
      renderCell: ({ row }) => (
        <div className="orders-actions">
          <Button size="small" onClick={(event) => { event.stopPropagation(); viewDetail(row); }} startIcon={<ReceiptIcon />} variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12, fontWeight: 700 }}>
            Chi tiết
          </Button>
          {row.remainingAmount > 0 && row.orderStatus !== 'CANCELLED' && (
            <Button size="small" onClick={(event) => { event.stopPropagation(); setSelectedOrder(row); setPayAmount(row.remainingAmount.toString()); setPaymentOpen(true); }} startIcon={<PaymentIcon />} variant="contained"
              sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12, fontWeight: 700, background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#fff' }}>
              Thanh toán
            </Button>
          )}
          {canRefund && (row.orderStatus === 'PAID' || row.orderStatus === 'COMPLETED' || row.orderStatus === 'PARTIALLY_PAID') && (
            <Button size="small" color="error" disabled={refundingId === row.orderId} onClick={(event) => { event.stopPropagation(); handleRefund(row); }} startIcon={<ReplayIcon />} variant="outlined"
              sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12, fontWeight: 700 }}>
              {refundingId === row.orderId ? 'Đang hoàn...' : 'Hoàn đơn'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const renderCatalogCard = (item: any, type: 'SERVICE' | 'PRODUCT' | 'PACKAGE') => {
    const id = item.serviceId || item.productId || item.treatmentPackageId;
    const name = item.name || item.packageName;
    const price = item.price || item.packagePrice;

    return (
      <div key={id} className="orders-catalog-card">
        {type === 'PRODUCT' && <img src={item.image || DEFAULT_PRODUCT_IMAGE} alt="" />}
        <div>
          <strong>{name}</strong>
          {type === 'PRODUCT' && <span>{item.barcode || item.sku || 'Chưa có mã vạch'}</span>}
          <p>{formatCurrency(price || 0)}</p>
        </div>
        <IconButton aria-label={`Thêm ${name} vào giỏ hàng`} onClick={() => addToCart(item, type)} className="orders-add-button">
          <AddShoppingCartIcon fontSize="small" />
        </IconButton>
      </div>
    );
  };

  return (
    <main className="orders-page animate-fadeIn">
      {view === 'list' ? (
        <>
          <PageHeader
            title="Quản lý đơn hàng & POS"
            subtitle={`${orders.length} hóa đơn spa`}
            action={{ label: 'Tạo đơn mới (POS)', onClick: () => setView('create'), icon: <PointOfSaleIcon /> }}
            extra={<Button variant="outlined" onClick={() => setDebtOpen(true)} startIcon={<AccountBalanceWalletIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>Công nợ khách hàng</Button>}
          />

          {loadError && <Alert severity="warning" className="orders-alert">{loadError}</Alert>}

          <section className="orders-summary" aria-label="Tóm tắt đơn hàng">
            <div className="orders-summary-card"><span><ReceiptIcon /></span><div><strong>{ordersLoading ? '...' : orderSummary.total}</strong><p>Tổng đơn</p></div></div>
            <div className="orders-summary-card"><span><AccountBalanceWalletIcon /></span><div><strong>{ordersLoading ? '...' : formatCurrency(orderSummary.revenue)}</strong><p>Đã thu</p></div></div>
            <div className="orders-summary-card"><span><PaymentIcon /></span><div><strong>{ordersLoading ? '...' : formatCurrency(orderSummary.unpaid)}</strong><p>Còn phải thu</p></div></div>
            <div className="orders-summary-card"><span><ShoppingBagIcon /></span><div><strong>{ordersLoading ? '...' : orderSummary.open}</strong><p>Đơn chờ thanh toán</p></div></div>
          </section>

          <section className="orders-toolbar" aria-label="Bộ lọc đơn hàng">
            <TextField
              placeholder="Tìm theo mã đơn, khách hàng hoặc số điện thoại..."
              size="small"
              value={ordersSearch}
              onChange={e => setOrdersSearch(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'var(--text-tertiary)' }} /></InputAdornment> } }}
              sx={{ flex: '1 1 320px', ...inputSx }}
            />
            <FormControl size="small" sx={{ minWidth: 220, ...inputSx }}>
              <InputLabel>Trạng thái</InputLabel>
              <Select value={orderStatusFilter} label="Trạng thái" onChange={e => setOrderStatusFilter(e.target.value)}>
                <MenuItem value="ALL">Tất cả trạng thái</MenuItem>
                <MenuItem value="PENDING_PAYMENT">Chưa thanh toán</MenuItem>
                <MenuItem value="PARTIALLY_PAID">Thanh toán một phần</MenuItem>
                <MenuItem value="OVERDUE">Quá hạn từ 7 ngày</MenuItem>
                <MenuItem value="PAID">Đã thanh toán</MenuItem>
                <MenuItem value="CANCELLED">Đã hủy</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" onClick={loadOrders} disabled={ordersLoading}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, borderColor: 'var(--border-color)', color: 'var(--text-secondary)', minHeight: 40 }}>
              Làm mới
            </Button>
          </section>

          <section className="orders-panel">
            {isMobile ? (
              <OrdersListMobile
                rows={filteredOrders}
                loading={ordersLoading}
                emptyMessage={ordersSearch || orderStatusFilter !== 'ALL' ? 'Không tìm thấy đơn hàng phù hợp' : 'Chưa có đơn hàng'}
                canRefund={canRefund}
                refundingId={refundingId}
                onViewDetail={viewDetail}
                onPay={(row) => { setSelectedOrder(row); setPayAmount(row.remainingAmount.toString()); setPaymentOpen(true); }}
                onRefund={handleRefund}
              />
            ) : ordersLoading ? (
              <div className="orders-skeleton" aria-busy="true" aria-label="Đang tải đơn hàng">
                {Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} variant="rounded" height={48} />)}
              </div>
            ) : (
              <DataGrid
                rows={filteredOrders}
                columns={columns}
                getRowId={row => row.orderId}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                pageSizeOptions={[10, 20]}
                autoHeight
                disableRowSelectionOnClick
                onRowClick={({ row }) => viewDetail(row)}
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' },
                  '& .MuiDataGrid-row': { cursor: 'pointer' },
                }}
                localeText={{ noRowsLabel: ordersSearch || orderStatusFilter !== 'ALL' ? 'Không tìm thấy đơn hàng phù hợp' : 'Chưa có đơn hàng' }}
              />
            )}
          </section>

          <Dialog open={debtOpen} onClose={() => setDebtOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 800 }}>Công nợ theo khách hàng</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'grid', gap: 1.5, mt: 1 }}>
                {debtsByCustomer.map(debt => (
                  <Box key={debt.id} sx={{ display: 'grid', gridTemplateColumns: '1fr 130px 110px 130px', gap: 2, alignItems: 'center', p: 1.5, border: '1px solid var(--border-color)', borderRadius: 2 }}>
                    <div><strong>{debt.customerName}</strong><Typography variant="caption" sx={{ display: 'block' }} color="text.secondary">{debt.customerPhone || 'Chưa có SĐT'}</Typography></div>
                    <Typography variant="body2">{debt.orderCount} đơn còn nợ</Typography>
                    <Typography variant="body2" color={debt.oldestDays >= 7 ? 'error' : 'text.secondary'}>Cũ nhất {debt.oldestDays} ngày</Typography>
                    <strong style={{ color: '#DC2626', textAlign: 'right' }}>{formatCurrency(debt.totalDebt)}</strong>
                  </Box>
                ))}
                {debtsByCustomer.length === 0 && <Typography color="text.secondary">Không có công nợ cần thu.</Typography>}
              </Box>
            </DialogContent>
            <DialogActions><Button onClick={() => setDebtOpen(false)} sx={{ textTransform: 'none' }}>Đóng</Button></DialogActions>
          </Dialog>
        </>
      ) : (
        <>
          <PageHeader
            title="Quầy POS bán hàng"
            subtitle="Khởi tạo hóa đơn và lịch hẹn dịch vụ trực tiếp"
            action={{ label: 'Quay lại danh sách', onClick: () => setView('list') }}
          />

          {catalogLoading && <Alert severity="info" className="orders-alert">Đang tải danh mục sản phẩm, dịch vụ và phòng.</Alert>}

          <div className="orders-pos-grid">
            <div>
              <Card className="orders-pos-card" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Bước 1: Chọn khách hàng</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Button disabled={!!sourceAppointment} variant={customerMode === 'existing' ? 'contained' : 'outlined'} onClick={() => setCustomerMode('existing')} sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}>Khách hàng cũ</Button>
                    <Button disabled={!!sourceAppointment} variant={customerMode === 'new' ? 'contained' : 'outlined'} onClick={() => setCustomerMode('new')} sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}>Tạo khách hàng mới</Button>
                  </Box>

                  {customerMode === 'existing' ? (
                    <Autocomplete
                      options={customersList}
                      value={selectedCustomer}
                      getOptionLabel={(option) => `${option.name} - ${option.phone}`}
                      onInputChange={(_, value) => searchCustomers(value)}
                      onChange={(_, value) => !sourceAppointment && setSelectedCustomer(value)}
                      disabled={!!sourceAppointment}
                      renderInput={(params) => (
                        <TextField {...params} label="Tìm khách hàng (nhập SĐT hoặc tên)" size="small" fullWidth sx={inputSx} />
                      )}
                    />
                  ) : (
                    <div className="orders-form-grid">
                      <TextField label="Họ tên *" size="small" fullWidth value={newCustomerForm.name} onChange={e => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })} sx={inputSx} />
                      <TextField label="Số điện thoại *" size="small" fullWidth value={newCustomerForm.phone} onChange={e => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })} sx={inputSx} />
                      <TextField label="Email" size="small" fullWidth value={newCustomerForm.email} onChange={e => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })} sx={inputSx} />
                      <FormControl fullWidth size="small" sx={inputSx}>
                        <InputLabel>Giới tính</InputLabel>
                        <Select value={newCustomerForm.gender} label="Giới tính" displayEmpty onChange={e => setNewCustomerForm({ ...newCustomerForm, gender: e.target.value })}>
                          <MenuItem value="" disabled>Chọn giới tính</MenuItem>
                          <MenuItem value="MALE">Nam</MenuItem>
                          <MenuItem value="FEMALE">Nữ</MenuItem>
                          <MenuItem value="OTHER">Khác</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField label="Ngày sinh" type="date" slotProps={{ inputLabel: { shrink: true } }} size="small" fullWidth value={newCustomerForm.dateOfBirth} onChange={e => setNewCustomerForm({ ...newCustomerForm, dateOfBirth: e.target.value })} sx={inputSx} />
                      <TextField label="Địa chỉ" size="small" fullWidth value={newCustomerForm.address} onChange={e => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })} sx={inputSx} />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="orders-pos-card">
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Bước 2: Chọn dịch vụ & sản phẩm</Typography>
                  <Tabs value={catalogTab} onChange={(_, val) => setCatalogTab(val)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tab label="Dịch vụ" sx={{ textTransform: 'none', fontWeight: 700 }} />
                    <Tab label="Sản phẩm" sx={{ textTransform: 'none', fontWeight: 700 }} />
                    <Tab label="Gói liệu trình" sx={{ textTransform: 'none', fontWeight: 700 }} />
                  </Tabs>

                  {catalogTab === 0 && <div className="orders-catalog-grid">{services.map(item => renderCatalogCard(item, 'SERVICE'))}</div>}

                  {catalogTab === 1 && (
                    <div>
                      <TextField
                        label="Quét/nhập mã vạch hoặc SKU"
                        size="small"
                        fullWidth
                        value={barcodeInput}
                        onChange={e => setBarcodeInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addProductByBarcode();
                          }
                        }}
                        sx={{ mb: 2, ...inputSx }}
                      />
                      <div className="orders-catalog-grid">{products.map(item => renderCatalogCard(item, 'PRODUCT'))}</div>
                    </div>
                  )}

                  {catalogTab === 2 && <div className="orders-catalog-grid">{packages.map(item => renderCatalogCard(item, 'PACKAGE'))}</div>}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="orders-pos-card orders-cart-card">
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Giỏ hàng & thanh toán</Typography>

                  {cart.length === 0 ? (
                    <div className="orders-empty-cart">
                      <AddShoppingCartIcon />
                      <strong>Chưa có sản phẩm nào</strong>
                      <p>Chọn dịch vụ, sản phẩm hoặc gói liệu trình để bắt đầu tạo đơn.</p>
                    </div>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                      {cart.map((item, idx) => (
                        <Box key={`${item.itemId}-${idx}`} className="orders-cart-item">
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1 }}>
                            <div className="orders-cart-item__main">
                              {item.itemType === 'PRODUCT' && <img src={item.image || DEFAULT_PRODUCT_IMAGE} alt="" />}
                              <div>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{item.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{item.itemType} - {item.barcode || item.sku ? `${item.barcode || item.sku} - ` : ''}{formatCurrency(item.price)}</Typography>
                              </div>
                            </div>
                            <IconButton size="small" aria-label="Xóa khỏi giỏ hàng" onClick={() => removeFromCart(idx)} sx={{ color: '#EF4444' }}><DeleteIcon fontSize="small" /></IconButton>
                          </Box>

                          {item.itemType === 'SERVICE' && (
                            <div className="orders-schedule-controls">
                              <div className="orders-form-grid orders-form-grid--compact">
                                <FormControl fullWidth size="small" sx={inputSx}>
                                  <InputLabel>Kỹ thuật viên</InputLabel>
                                  <Select value={item.therapistId} label="Kỹ thuật viên" onChange={e => updateCartItem(idx, { therapistId: e.target.value })}>
                                    {employees.map(employee => <MenuItem key={employee.employeeId} value={employee.employeeId}>{employee.name}</MenuItem>)}
                                  </Select>
                                </FormControl>
                                <FormControl fullWidth size="small" sx={inputSx}>
                                  <InputLabel>Phòng</InputLabel>
                                  <Select value={item.roomId} label="Phòng" onChange={e => updateCartItem(idx, { roomId: e.target.value })}>
                                    {rooms.map(room => <MenuItem key={room.roomId} value={room.roomId}>{room.roomName}</MenuItem>)}
                                  </Select>
                                </FormControl>
                              </div>
                              <div className="orders-inline-control">
                                <TextField label="Ngày giờ phục vụ" type="datetime-local" size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }}
                                  value={item.scheduledDateTime} onChange={e => updateCartItem(idx, { scheduledDateTime: e.target.value })} sx={inputSx} />
                                <Button variant="outlined" size="small" onClick={() => updateCartItem(idx, { scheduledDateTime: getCurrentDateTimeLocal() })}
                                  sx={{ borderRadius: 2, textTransform: 'none', minWidth: 86, height: 40 }}>
                                  Hiện tại
                                </Button>
                              </div>
                            </div>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <FormControl fullWidth size="small" sx={inputSx}>
                      <InputLabel>Khuyến mãi</InputLabel>
                      <Select value={promoId} label="Khuyến mãi" onChange={e => setPromoId(e.target.value)}>
                        <MenuItem value="">Không áp dụng</MenuItem>
                        {promotions.map((promo) => (
                          <MenuItem key={promo.promotionId} value={promo.promotionId}>{promo.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField label="Mã Voucher (nếu có)" size="small" fullWidth value={voucherCode} onChange={e => setVoucherCode(e.target.value)} sx={inputSx} />

                    {customerMode === 'existing' && selectedCustomer && (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          label={`Quy đổi điểm (còn ${availablePoints.toLocaleString('vi-VN')} điểm)`}
                          type="number"
                          size="small"
                          fullWidth
                          value={pointsToUse}
                          onChange={e => {
                            const value = Math.floor(Math.max(0, Math.min(Number(e.target.value || 0), maxUsablePoints)));
                            setPointsToUse(e.target.value === '' ? '' : String(value));
                          }}
                          helperText="1 điểm = 1.000đ"
                          slotProps={{ htmlInput: { step: 1, min: 0 } }}
                          disabled={availablePoints <= 0}
                          sx={inputSx}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={maxUsablePoints <= 0}
                          onClick={() => setPointsToUse(String(maxUsablePoints))}
                          sx={{ borderRadius: 2, textTransform: 'none', whiteSpace: 'nowrap', height: 40, mb: 2.5 }}
                        >
                          Dùng tối đa
                        </Button>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">Tạm tính:</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(cartSubtotal)}</Typography></Box>
                    {promoDiscountEstimate > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">Khuyến mãi ({selectedPromo?.name}):</Typography><Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>-{formatCurrency(promoDiscountEstimate)}</Typography></Box>
                    )}
                    {loyaltyDiscountEstimate > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">Quy đổi {Number(pointsToUse)} điểm:</Typography><Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>-{formatCurrency(loyaltyDiscountEstimate)}</Typography></Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">VAT 10% (đã gồm trong giá):</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(taxEstimate)}</Typography></Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}><Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Tổng tiền thanh toán:</Typography><Typography variant="subtitle1" color="primary" sx={{ fontWeight: 900 }}>{formatCurrency(totalEstimate)}</Typography></Box>
                    {(voucherCode || customerMode === 'existing') && (
                      <Typography variant="caption" color="text.secondary">
                        Tổng tiền chính xác (gồm voucher, ưu đãi hạng thành viên) sẽ được hệ thống tính khi tạo đơn.
                      </Typography>
                    )}
                  </Box>
                </CardContent>

                <Box sx={{ p: 2, background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-color)' }}>
                  <Button variant="contained" fullWidth size="large" onClick={handleCheckout}
                    sx={{ textTransform: 'none', borderRadius: 3, fontWeight: 800, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>
                    Tạo đơn hàng & thanh toán
                  </Button>
                </Box>
              </Card>
            </div>
          </div>
        </>
      )}

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', width: 'min(680px, calc(100vw - 32px))', background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 0 }}>Chi tiết đơn hàng #{selectedOrder?.displayCode || selectedOrder?.orderId}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {selectedOrder && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div className="orders-detail-grid">
                <div><Typography variant="caption" color="text.secondary">Khách hàng</Typography><Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedOrder.customerName}</Typography></div>
                <div><Typography variant="caption" color="text.secondary">Số điện thoại</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedOrder.customerPhone}</Typography></div>
                <div><Typography variant="caption" color="text.secondary">Trạng thái</Typography><Box><StatusChip status={selectedOrder.orderStatus} type="order" /></Box></div>
                <div><Typography variant="caption" color="text.secondary">Ngày tạo</Typography><Typography variant="body2">{formatDateTime(selectedOrder.createdAt)}</Typography></div>
              </div>

              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Sản phẩm / dịch vụ đã chọn</Typography>
              {selectedOrder.orderItems?.map((item: any) => (
                <Box key={item.orderItemId} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="body2">{item.productName || item.serviceName || item.packageName} x{item.quantity}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(item.amount)}</Typography>
                </Box>
              ))}

              <Divider />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">Tạm tính:</Typography><Typography variant="body2">{formatCurrency(selectedOrder.subtotal)}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">Giảm giá:</Typography><Typography variant="body2">{formatCurrency((selectedOrder.promoDiscount || 0) + (selectedOrder.voucherDiscount || 0) + (selectedOrder.membershipDiscount || 0) + (selectedOrder.loyaltyDiscount || 0))}</Typography></Box>
                {Number(selectedOrder.loyaltyPointsUsed || 0) > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">Điểm đã quy đổi:</Typography><Typography variant="body2">{selectedOrder.loyaltyPointsUsed} điểm (-{formatCurrency(selectedOrder.loyaltyDiscount || 0)})</Typography></Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">VAT (đã gồm trong giá):</Typography><Typography variant="body2">{formatCurrency(selectedOrder.taxAmount || 0)}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Tổng tiền:</Typography><Typography variant="subtitle2" color="primary" sx={{ fontWeight: 900 }}>{formatCurrency(selectedOrder.totalAmount)}</Typography></Box>
              </Box>

              {selectedOrder.payments?.length > 0 && (
                <>
                  <Divider />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Lịch sử thanh toán</Typography>
                  {selectedOrder.payments.map((payment: any) => (
                    <Box key={payment.paymentId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption">{formatDateTime(payment.processedAt)} ({payment.paymentMethod})</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>+{formatCurrency(payment.amount)}</Typography>
                    </Box>
                  ))}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDetailOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Đóng</Button>
          <Button onClick={() => window.print()} variant="contained" sx={{ borderRadius: 2, textTransform: 'none', background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#fff' }}>In hóa đơn</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={paymentOpen} onClose={() => setPaymentOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', width: 'min(440px, calc(100vw - 32px))', background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 0 }}>Thanh toán đơn hàng</DialogTitle>
        <DialogContent sx={{ pt: '16px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2">Số tiền còn lại cần thanh toán: <strong style={{ color: '#EF4444' }}>{formatCurrency(selectedOrder?.remainingAmount ?? 0)}</strong></Typography>
          <TextField label="Số tiền thanh toán (VNĐ)" type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} fullWidth size="small" sx={inputSx} />
          <FormControl fullWidth size="small" sx={inputSx}>
            <InputLabel>Phương thức thanh toán</InputLabel>
            <Select value={payMethod} label="Phương thức thanh toán" onChange={e => setPayMethod(e.target.value)}>
              <MenuItem value="CASH">Tiền mặt</MenuItem>
              <MenuItem value="BANK_TRANSFER">Chuyển khoản (quét QR)</MenuItem>
              <MenuItem value="MOMO">Ví MoMo</MenuItem>
              <MenuItem value="VNPAY">VNPay</MenuItem>
            </Select>
          </FormControl>

          {payMethod === 'BANK_TRANSFER' && (
            <Box sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
              background: 'var(--bg-tertiary)', borderRadius: '12px', p: 2,
            }}>
              {bankQrLoading && <Typography variant="body2">Đang tạo mã QR...</Typography>}
              {bankQr && (
                <>
                  <img
                    src={bankQr.qrUrl}
                    alt="Mã VietQR thanh toán"
                    style={{ width: 240, maxWidth: '100%', borderRadius: 12, background: '#fff' }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {bankQr.accountName} — {bankQr.accountNumber}
                  </Typography>
                  <Typography variant="body2">
                    Số tiền: <strong style={{ color: 'var(--primary)' }}>{formatCurrency(Number(bankQr.amount || 0))}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                    Nội dung chuyển khoản: <strong>{bankQr.memo}</strong>
                    <br />Khách quét QR bằng app ngân hàng — hệ thống sẽ tự xác nhận khi nhận được tiền.
                  </Typography>
                </>
              )}
            </Box>
          )}

          <TextField label="Mã giao dịch / tham chiếu" value={txnRef} onChange={e => setTxnRef(e.target.value)} fullWidth size="small" sx={inputSx} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setPaymentOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>
            {payMethod === 'BANK_TRANSFER' ? 'Đóng (chờ chuyển khoản)' : 'Hủy'}
          </Button>
          <Button onClick={submitPayment} disabled={!payAmount || Number(payAmount) <= 0} variant="contained"
            sx={{ borderRadius: 2, textTransform: 'none', background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#fff' }}>
            {payMethod === 'BANK_TRANSFER' ? 'Xác nhận thủ công' : 'Xác nhận thanh toán'}
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
};

export default OrdersPage;
