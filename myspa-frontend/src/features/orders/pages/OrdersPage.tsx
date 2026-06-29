import React, { useEffect, useMemo, useState } from 'react';
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
import { getOrders, createOrder, payOrder, getOrderById } from '@/api/orders';
import { getServices, getProducts, getTreatmentPackages, getEmployees, getRooms } from '@/api/catalog';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DeleteIcon from '@mui/icons-material/Delete';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import PaymentIcon from '@mui/icons-material/Payment';
import SearchIcon from '@mui/icons-material/Search';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import './OrdersPage.css';

const DEFAULT_PRODUCT_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72"><rect width="72" height="72" rx="10" fill="%23F3F4F6"/><path d="M17 49l11-14 9 10 6-8 12 12H17z" fill="%23D97706"/><circle cx="47" cy="24" r="6" fill="%23F59E0B"/></svg>';

const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px' } };

const OrdersPage: React.FC = () => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [ordersSearch, setOrdersSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [txnRef, setTxnRef] = useState('');

  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'FEMALE',
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

  const loadCatalog = async () => {
    setCatalogLoading(true);
    try {
      const [serviceData, productData, packageData, employeeData, roomData] = await Promise.all([
        getServices(),
        getProducts(),
        getTreatmentPackages(),
        getEmployees(),
        getRooms(),
      ]);
      setServices(serviceData);
      setProducts(productData);
      setPackages(packageData);
      setEmployees(employeeData);
      setRooms(roomData);
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
      items: cart.map((item) => ({
        itemType: item.itemType,
        productId: item.itemType === 'PRODUCT' ? item.itemId : null,
        serviceId: item.itemType === 'SERVICE' ? item.itemId : null,
        packageId: item.itemType === 'PACKAGE' ? item.itemId : null,
        quantity: item.quantity,
        therapistId: item.therapistId || null,
        roomId: item.roomId || null,
        scheduledDateTime: item.scheduledDateTime ? new Date(item.scheduledDateTime).toISOString() : null,
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
      payload.newCustomer = newCustomerForm;
    }

    if (voucherCode) payload.voucherCode = voucherCode;
    if (promoId) payload.promotionId = promoId;

    try {
      const created = await createOrder(payload);
      toast.success('Khởi tạo đơn hàng thành công');
      setView('list');
      setCart([]);
      setVoucherCode('');
      setPromoId('');
      setSelectedCustomer(null);
      setNewCustomerForm({ name: '', phone: '', email: '', gender: 'FEMALE', dateOfBirth: '', address: '' });
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
      toast.success('Xử lý thanh toán thành công');
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

  const filteredOrders = useMemo(() => {
    const query = ordersSearch.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch = !query
        || order.orderId?.toLowerCase().includes(query)
        || order.customerName?.toLowerCase().includes(query)
        || order.customerPhone?.includes(query);
      const matchesStatus = orderStatusFilter === 'ALL' || order.orderStatus === orderStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, ordersSearch, orderStatusFilter]);

  const orderSummary = useMemo(() => ({
    total: orders.length,
    revenue: orders.reduce((sum, order) => sum + Number(order.paidAmount || 0), 0),
    unpaid: orders.reduce((sum, order) => sum + Number(order.remainingAmount || 0), 0),
    open: orders.filter((order) => Number(order.remainingAmount || 0) > 0 && order.orderStatus !== 'CANCELLED').length,
  }), [orders]);

  const columns: GridColDef[] = [
    { field: 'orderId', headerName: 'Mã đơn', width: 220 },
    {
      field: 'customerName',
      headerName: 'Khách hàng',
      flex: 1,
      minWidth: 180,
      renderCell: ({ row }) => (
        <div className="orders-customer-cell">
          <strong>{row.customerName || 'Khách lẻ'}</strong>
          <span>{row.customerPhone || 'Chưa có số điện thoại'}</span>
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
      width: 210,
      sortable: false,
      renderCell: ({ row }) => (
        <div className="orders-actions">
          <Button size="small" onClick={() => viewDetail(row)} startIcon={<ReceiptIcon />} variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12, fontWeight: 700 }}>
            Chi tiết
          </Button>
          {row.remainingAmount > 0 && row.orderStatus !== 'CANCELLED' && (
            <Button size="small" onClick={() => { setSelectedOrder(row); setPayAmount(row.remainingAmount.toString()); setPaymentOpen(true); }} startIcon={<PaymentIcon />} variant="contained"
              sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12, fontWeight: 700, background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#fff' }}>
              Thanh toán
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
            {ordersLoading ? (
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
                sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }}
                localeText={{ noRowsLabel: ordersSearch || orderStatusFilter !== 'ALL' ? 'Không tìm thấy đơn hàng phù hợp' : 'Chưa có đơn hàng' }}
              />
            )}
          </section>
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
                    <Button variant={customerMode === 'existing' ? 'contained' : 'outlined'} onClick={() => setCustomerMode('existing')} sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}>Khách hàng cũ</Button>
                    <Button variant={customerMode === 'new' ? 'contained' : 'outlined'} onClick={() => setCustomerMode('new')} sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}>Tạo khách hàng mới</Button>
                  </Box>

                  {customerMode === 'existing' ? (
                    <Autocomplete
                      options={customersList}
                      getOptionLabel={(option) => `${option.name} - ${option.phone}`}
                      onInputChange={(_, value) => searchCustomers(value)}
                      onChange={(_, value) => setSelectedCustomer(value)}
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
                        <Select value={newCustomerForm.gender} label="Giới tính" onChange={e => setNewCustomerForm({ ...newCustomerForm, gender: e.target.value })}>
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

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <TextField label="Mã Voucher" size="small" fullWidth value={voucherCode} onChange={e => setVoucherCode(e.target.value)} sx={{ mb: 1, ...inputSx }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">Tạm tính:</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(cartSubtotal)}</Typography></Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">Thuế (10% VAT):</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(cartSubtotal * 0.1)}</Typography></Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}><Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Tổng tiền thanh toán:</Typography><Typography variant="subtitle1" color="primary" sx={{ fontWeight: 900 }}>{formatCurrency(cartSubtotal * 1.1)}</Typography></Box>
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
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 0 }}>Chi tiết đơn hàng #{selectedOrder?.orderId}</DialogTitle>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">Giảm giá:</Typography><Typography variant="body2">{formatCurrency((selectedOrder.promoDiscount || 0) + (selectedOrder.voucherDiscount || 0) + (selectedOrder.membershipDiscount || 0))}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">VAT (10%):</Typography><Typography variant="body2">{formatCurrency(selectedOrder.taxAmount || 0)}</Typography></Box>
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
              <MenuItem value="BANK_TRANSFER">Chuyển khoản</MenuItem>
              <MenuItem value="MOMO">Ví MoMo</MenuItem>
              <MenuItem value="VNPAY">VNPay</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Mã giao dịch / tham chiếu" value={txnRef} onChange={e => setTxnRef(e.target.value)} fullWidth size="small" sx={inputSx} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setPaymentOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Hủy</Button>
          <Button onClick={submitPayment} disabled={!payAmount || Number(payAmount) <= 0} variant="contained"
            sx={{ borderRadius: 2, textTransform: 'none', background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#fff' }}>
            Xác nhận thanh toán
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
};

export default OrdersPage;
