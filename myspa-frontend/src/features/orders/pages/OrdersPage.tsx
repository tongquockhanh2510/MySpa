import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Autocomplete, Tabs, Tab, Box, Card, CardContent,
  Typography, IconButton, Select, MenuItem, FormControl, InputLabel, Divider
} from '@mui/material';
import { toast } from 'sonner';
import PageHeader from '@components/common/PageHeader';
import StatusChip from '@components/common/StatusChip';
import { formatCurrency, formatDateTime } from '@utils/formatters';

// API imports
import { getCustomers } from '@/api/customers';
import { getOrders, createOrder, payOrder, getOrderById } from '@/api/orders';
import { getServices, getProducts, getTreatmentPackages, getEmployees, getRooms } from '@/api/catalog';

// Icons
import ReceiptIcon from '@mui/icons-material/Receipt';
import DeleteIcon from '@mui/icons-material/Delete';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import PaymentIcon from '@mui/icons-material/Payment';

const OrdersPage: React.FC = () => {
  // Navigation / Views
  const [view, setView] = useState<'list' | 'create'>('list');
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  
  // Dialog states
  const [detailOpen, setDetailOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [txnRef, setTxnRef] = useState('');

  // POS / Order Creation states
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '', phone: '', email: '', gender: 'FEMALE', dateOfBirth: '', address: ''
  });

  // Catalog states
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [catalogTab, setCatalogTab] = useState(0);

  // Cart
  const [cart, setCart] = useState<any[]>([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [promoId, setPromoId] = useState('');

  // Fetch initial data
  useEffect(() => {
    loadOrders();
    loadCatalog();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err: any) {
      toast.error('Không thể tải danh sách đơn hàng');
    }
  };

  const loadCatalog = async () => {
    try {
      const [s, p, pk, emp, rm] = await Promise.all([
        getServices(), getProducts(), getTreatmentPackages(), getEmployees(), getRooms()
      ]);
      setServices(s);
      setProducts(p);
      setPackages(pk);
      setEmployees(emp);
      setRooms(rm);
    } catch (err) {
      toast.error('Lỗi khi tải danh mục sản phẩm/dịch vụ');
    }
  };

  const searchCustomers = async (query: string) => {
    if (query.length < 2) return;
    try {
      const res = await getCustomers(query);
      setCustomersList(res);
    } catch (err) {
      console.error(err);
    }
  };

  // Cart actions
  const addToCart = (item: any, type: 'SERVICE' | 'PRODUCT' | 'PACKAGE') => {
    const existing = cart.find(c => c.itemType === type && c.itemId === (item.serviceId || item.productId || item.treatmentPackageId));
    if (existing) {
      setCart(cart.map(c => c.itemId === existing.itemId ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, {
        itemType: type,
        itemId: item.serviceId || item.productId || item.treatmentPackageId,
        name: item.name || item.packageName,
        price: item.price || item.packagePrice,
        quantity: 1,
        therapistId: '',
        roomId: '',
        scheduledDateTime: ''
      }]);
    }
    toast.success(`Đã thêm ${item.name || item.packageName} vào giỏ hàng`);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateCartItem = (index: number, fields: any) => {
    setCart(cart.map((item, i) => i === index ? { ...item, ...fields } : item));
  };

  // Submit Order
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }

    const payload: any = {
      items: cart.map(c => ({
        itemType: c.itemType,
        productId: c.itemType === 'PRODUCT' ? c.itemId : null,
        serviceId: c.itemType === 'SERVICE' ? c.itemId : null,
        packageId: c.itemType === 'PACKAGE' ? c.itemId : null,
        quantity: c.quantity,
        therapistId: c.therapistId || null,
        roomId: c.roomId || null,
        scheduledDateTime: c.scheduledDateTime ? new Date(c.scheduledDateTime).toISOString() : null
      }))
    };

    if (customerMode === 'existing') {
      if (!selectedCustomer) {
        toast.error('Vui lòng chọn khách hàng');
        return;
      }
      payload.customerId = selectedCustomer.customerId;
    } else {
      if (!newCustomerForm.name || !newCustomerForm.phone) {
        toast.error('Tên và Số điện thoại khách hàng mới không được để trống');
        return;
      }
      payload.newCustomer = newCustomerForm;
    }

    if (voucherCode) payload.voucherCode = voucherCode;
    if (promoId) payload.promoId = promoId;

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
      
      // Auto open payment dialog for the new order
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
        notes: 'Thanh toán hóa đơn POS'
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
      toast.error('Không thể tải chi tiết đơn hàng');
    }
  };

  // Calculate cart sums
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const columns: GridColDef[] = [
    { field: 'orderId', headerName: 'Mã đơn', width: 220 },
    { field: 'customerName', headerName: 'Khách hàng', flex: 1, minWidth: 160 },
    { field: 'customerPhone', headerName: 'Điện thoại', width: 130 },
    { field: 'totalAmount', headerName: 'Tổng tiền', width: 140, renderCell: ({ value }) => <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(value)}</span> },
    { field: 'paidAmount', headerName: 'Đã thanh toán', width: 140, renderCell: ({ value }) => <span style={{ fontWeight: 600, color: '#059669' }}>{formatCurrency(value)}</span> },
    { field: 'remainingAmount', headerName: 'Còn lại', width: 130, renderCell: ({ value }) => <span style={{ fontWeight: 600, color: value > 0 ? '#EF4444' : '#059669' }}>{formatCurrency(value)}</span> },
    { field: 'orderStatus', headerName: 'Trạng thái', width: 160, renderCell: ({ value }) => <StatusChip status={value} type="order" /> },
    { field: 'createdAt', headerName: 'Ngày tạo', width: 160, renderCell: ({ value }) => formatDateTime(value) },
    {
      field: 'actions', headerName: 'Thao tác', width: 200, sortable: false,
      renderCell: ({ row }) => (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', height: '100%' }}>
          <Button size="small" onClick={() => viewDetail(row)} startIcon={<ReceiptIcon />} variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>
            Chi tiết
          </Button>
          {row.remainingAmount > 0 && row.orderStatus !== 'CANCELLED' && (
            <Button size="small" onClick={() => { setSelectedOrder(row); setPayAmount(row.remainingAmount.toString()); setPaymentOpen(true); }} startIcon={<PaymentIcon />} variant="contained"
              sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12, background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#fff' }}>
              Thanh toán
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fadeIn">
      {view === 'list' ? (
        <>
          <PageHeader title="Quản lý đơn hàng & POS" subtitle="Quản lý hóa đơn spa" action={{ label: 'Tạo đơn mới (POS)', onClick: () => setView('create') }} />
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            <DataGrid rows={orders} columns={columns} getRowId={r => r.orderId}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} pageSizeOptions={[10, 20]} autoHeight disableRowSelectionOnClick
              sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { background: 'var(--bg-tertiary)' } }} />
          </div>
        </>
      ) : (
        <>
          <PageHeader title="Quầy POS bán hàng" subtitle="Khởi tạo hóa đơn và lịch hẹn dịch vụ trực tiếp" action={{ label: 'Quay lại danh sách', onClick: () => setView('list') }} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 24 }}>
            {/* Left: Customer & Catalog */}
            <div>
              <Card sx={{ mb: 3, borderRadius: 3, background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Bước 1: Chọn Khách hàng</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button variant={customerMode === 'existing' ? 'contained' : 'outlined'} onClick={() => setCustomerMode('existing')} sx={{ textTransform: 'none', borderRadius: 2 }}>Khách hàng cũ</Button>
                    <Button variant={customerMode === 'new' ? 'contained' : 'outlined'} onClick={() => setCustomerMode('new')} sx={{ textTransform: 'none', borderRadius: 2 }}>Tạo khách hàng mới</Button>
                  </Box>

                  {customerMode === 'existing' ? (
                    <Autocomplete
                      options={customersList}
                      getOptionLabel={(option) => `${option.name} - ${option.phone}`}
                      onInputChange={(_, value) => searchCustomers(value)}
                      onChange={(_, value) => setSelectedCustomer(value)}
                      renderInput={(params) => (
                        <TextField {...params} label="Tìm khách hàng (Nhập SĐT hoặc Tên)" size="small" fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                      )}
                    />
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <TextField label="Họ tên *" size="small" fullWidth value={newCustomerForm.name} onChange={e => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                      <TextField label="Số điện thoại *" size="small" fullWidth value={newCustomerForm.phone} onChange={e => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                      <TextField label="Email" size="small" fullWidth value={newCustomerForm.email} onChange={e => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                      <FormControl fullWidth size="small">
                        <InputLabel>Giới tính</InputLabel>
                        <Select value={newCustomerForm.gender} label="Giới tính" onChange={e => setNewCustomerForm({ ...newCustomerForm, gender: e.target.value })} sx={{ borderRadius: '10px' }}>
                          <MenuItem value="MALE">Nam</MenuItem>
                          <MenuItem value="FEMALE">Nữ</MenuItem>
                          <MenuItem value="OTHER">Khác</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField label="Ngày sinh" type="date" slotProps={{ inputLabel: { shrink: true } }} size="small" fullWidth value={newCustomerForm.dateOfBirth} onChange={e => setNewCustomerForm({ ...newCustomerForm, dateOfBirth: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                      <TextField label="Địa chỉ" size="small" fullWidth value={newCustomerForm.address} onChange={e => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 3, background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Bước 2: Chọn Dịch vụ & Sản phẩm</Typography>
                  <Tabs value={catalogTab} onChange={(_, val) => setCatalogTab(val)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tab label="Dịch vụ" sx={{ textTransform: 'none', fontWeight: 600 }} />
                    <Tab label="Sản phẩm" sx={{ textTransform: 'none', fontWeight: 600 }} />
                    <Tab label="Gói liệu trình" sx={{ textTransform: 'none', fontWeight: 600 }} />
                  </Tabs>

                  {catalogTab === 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {services.map(s => (
                        <div key={s.serviceId} style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{s.name}</Typography>
                            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>{formatCurrency(s.price)}</Typography>
                          </div>
                          <IconButton onClick={() => addToCart(s, 'SERVICE')} sx={{ color: 'var(--primary)' }}><AddShoppingCartIcon fontSize="small" /></IconButton>
                        </div>
                      ))}
                    </div>
                  )}

                  {catalogTab === 1 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {products.map(p => (
                        <div key={p.productId} style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{p.name}</Typography>
                            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>{formatCurrency(p.price)}</Typography>
                          </div>
                          <IconButton onClick={() => addToCart(p, 'PRODUCT')} sx={{ color: 'var(--primary)' }}><AddShoppingCartIcon fontSize="small" /></IconButton>
                        </div>
                      ))}
                    </div>
                  )}

                  {catalogTab === 2 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {packages.map(pk => (
                        <div key={pk.treatmentPackageId} style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{pk.packageName}</Typography>
                            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>{formatCurrency(pk.packagePrice)}</Typography>
                          </div>
                          <IconButton onClick={() => addToCart(pk, 'PACKAGE')} sx={{ color: 'var(--primary)' }}><AddShoppingCartIcon fontSize="small" /></IconButton>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Cart & Calculation */}
            <div>
              <Card sx={{ borderRadius: 3, background: 'var(--bg-card)', border: '1px solid var(--border-color)', minHeight: 500, display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Giỏ hàng & Thanh toán</Typography>
                  
                  {cart.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', my: 4 }}>Chưa có sản phẩm nào trong giỏ hàng</Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                      {cart.map((item, idx) => (
                        <Box key={idx} sx={{ borderBottom: '1px solid var(--border-color)', pb: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <div>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{item.itemType} - {formatCurrency(item.price)}</Typography>
                            </div>
                            <IconButton size="small" onClick={() => removeFromCart(idx)} sx={{ color: '#EF4444' }}><DeleteIcon fontSize="small" /></IconButton>
                          </Box>

                          {/* Scheduling controls if Service/Package */}
                          {item.itemType === 'SERVICE' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Kỹ thuật viên</InputLabel>
                                  <Select value={item.therapistId} label="Kỹ thuật viên" onChange={e => updateCartItem(idx, { therapistId: e.target.value })} sx={{ borderRadius: 2 }}>
                                    {employees.map(e => <MenuItem key={e.employeeId} value={e.employeeId}>{e.name}</MenuItem>)}
                                  </Select>
                                </FormControl>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Phòng</InputLabel>
                                  <Select value={item.roomId} label="Phòng" onChange={e => updateCartItem(idx, { roomId: e.target.value })} sx={{ borderRadius: 2 }}>
                                    {rooms.map(r => <MenuItem key={r.roomId} value={r.roomId}>{r.roomName}</MenuItem>)}
                                  </Select>
                                </FormControl>
                              </div>
                              <TextField label="Ngày giờ phục vụ" type="datetime-local" size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }}
                                value={item.scheduledDateTime} onChange={e => updateCartItem(idx, { scheduledDateTime: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            </div>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* Calculations */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <TextField label="Mã Voucher" size="small" fullWidth value={voucherCode} onChange={e => setVoucherCode(e.target.value)} sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Tạm tính:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(cartSubtotal)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Thuế (10% VAT):</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(cartSubtotal * 0.1)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Tổng tiền thanh toán:</Typography>
                      <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 800 }}>{formatCurrency(cartSubtotal * 1.1)}</Typography>
                    </Box>
                  </Box>
                </CardContent>

                <Box sx={{ p: 2, background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-color)' }}>
                  <Button variant="contained" fullWidth size="large" onClick={handleCheckout}
                    sx={{ textTransform: 'none', borderRadius: 3, fontWeight: 700, background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>
                    Tạo đơn hàng & Thanh toán
                  </Button>
                </Box>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', minWidth: 600, background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17, pb: 0 }}>Chi tiết đơn hàng #{selectedOrder?.orderId}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {selectedOrder && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><Typography variant="caption" color="text.secondary">Khách hàng</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedOrder.customerName}</Typography></div>
                <div><Typography variant="caption" color="text.secondary">Số điện thoại</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedOrder.customerPhone}</Typography></div>
                <div><Typography variant="caption" color="text.secondary">Trạng thái</Typography><Box><StatusChip status={selectedOrder.orderStatus} type="order" /></Box></div>
                <div><Typography variant="caption" color="text.secondary">Ngày tạo</Typography><Typography variant="body2">{formatDateTime(selectedOrder.createdAt)}</Typography></div>
              </div>

              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Sản phẩm / Dịch vụ đã chọn</Typography>
              {selectedOrder.orderItems?.map((item: any) => (
                <Box key={item.orderItemId} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{item.productName || item.serviceName || item.packageName} x{item.quantity}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(item.amount)}</Typography>
                </Box>
              ))}

              <Divider />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">Tạm tính:</Typography><Typography variant="body2">{formatCurrency(selectedOrder.subtotal)}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">Giảm giá:</Typography><Typography variant="body2">{formatCurrency(selectedOrder.promoDiscount + selectedOrder.voucherDiscount + selectedOrder.membershipDiscount)}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">VAT (10%):</Typography><Typography variant="body2">{formatCurrency(selectedOrder.taxAmount)}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Tổng tiền:</Typography><Typography variant="subtitle2" color="primary" sx={{ fontWeight: 800 }}>{formatCurrency(selectedOrder.totalAmount)}</Typography></Box>
              </Box>

              {selectedOrder.payments?.length > 0 && (
                <>
                  <Divider />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Lịch sử thanh toán</Typography>
                  {selectedOrder.payments.map((p: any) => (
                    <Box key={p.paymentId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption">{formatDateTime(p.processedAt)} ({p.paymentMethod})</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>+{formatCurrency(p.amount)}</Typography>
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

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onClose={() => setPaymentOpen(false)} slotProps={{ paper: { sx: { borderRadius: '16px', minWidth: 400, background: 'var(--bg-secondary)' } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17, pb: 0 }}>Thanh toán đơn hàng</DialogTitle>
        <DialogContent sx={{ pt: '16px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2">Số tiền còn lại cần thanh toán: <strong style={{ color: '#EF4444' }}>{formatCurrency(selectedOrder?.remainingAmount ?? 0)}</strong></Typography>
          
          <TextField label="Số tiền thanh toán (VNĐ)" type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} fullWidth size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />

          <FormControl fullWidth size="small">
            <InputLabel>Phương thức thanh toán</InputLabel>
            <Select value={payMethod} label="Phương thức thanh toán" onChange={e => setPayMethod(e.target.value)} sx={{ borderRadius: '10px' }}>
              <MenuItem value="CASH">Tiền mặt</MenuItem>
              <MenuItem value="BANK_TRANSFER">Chuyển khoản</MenuItem>
              <MenuItem value="MOMO">Ví MoMo</MenuItem>
              <MenuItem value="VNPAY">VNPay</MenuItem>
            </Select>
          </FormControl>

          <TextField label="Mã giao dịch / Tham chiếu" value={txnRef} onChange={e => setTxnRef(e.target.value)} fullWidth size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setPaymentOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Hủy</Button>
          <Button onClick={submitPayment} disabled={!payAmount || Number(payAmount) <= 0} variant="contained"
            sx={{ borderRadius: 2, textTransform: 'none', background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#fff' }}>
            Xác nhận thanh toán
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
