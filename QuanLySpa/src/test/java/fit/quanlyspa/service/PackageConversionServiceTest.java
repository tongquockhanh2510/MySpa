package fit.quanlyspa.service;

import fit.quanlyspa.dto.request.order.OrderRequest;
import fit.quanlyspa.dto.request.treatment.PackageConversionRequest;
import fit.quanlyspa.dto.response.order.OrderResponse;
import fit.quanlyspa.dto.response.treatment.PackageConversionResponse;
import fit.quanlyspa.entity.Customer;
import fit.quanlyspa.entity.CustomerTreatment;
import fit.quanlyspa.entity.CustomerTreatmentId;
import fit.quanlyspa.entity.PackageConversion;
import fit.quanlyspa.entity.TreatmentPackage;
import fit.quanlyspa.entity.Voucher;
import fit.quanlyspa.enums.ConversionType;
import fit.quanlyspa.enums.OrderStatus;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.CustomerTreatmentRepository;
import fit.quanlyspa.repository.PackageConversionRepository;
import fit.quanlyspa.repository.ProductRepository;
import fit.quanlyspa.repository.TreatmentPackageRepository;
import fit.quanlyspa.repository.TreatmentScheduleRepository;
import fit.quanlyspa.repository.VoucherRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PackageConversionServiceTest {

    @Mock PackageConversionRepository packageConversionRepository;
    @Mock CustomerTreatmentRepository customerTreatmentRepository;
    @Mock ProductRepository productRepository;
    @Mock TreatmentPackageRepository treatmentPackageRepository;
    @Mock TreatmentScheduleRepository treatmentScheduleRepository;
    @Mock VoucherRepository voucherRepository;
    @Mock OrderService orderService;
    @Mock CommissionService commissionService;

    @InjectMocks PackageConversionService packageConversionService;

    @Test
    void createDiscountConversionCreatesCreditVoucherWithServerComputedValue() {
        // Goi 1.000.000d / 10 buoi, con 4 buoi → gia tri quy doi server tinh = 400.000d
        CustomerTreatment source = sourceTreatment(4);
        when(customerTreatmentRepository.findById(new CustomerTreatmentId("customer-1", "source-package"))).thenReturn(Optional.of(source));
        when(voucherRepository.save(any(Voucher.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(packageConversionRepository.save(any(PackageConversion.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(customerTreatmentRepository.save(any(CustomerTreatment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PackageConversionRequest request = new PackageConversionRequest();
        request.setCustomerId("customer-1");
        request.setPackageId("source-package");
        request.setConversionType(ConversionType.TO_DISCOUNT);
        // client gui gia tri sai → server phai bo qua va tu tinh
        request.setConversionValue(999_999);

        PackageConversionResponse response = packageConversionService.create(request);

        ArgumentCaptor<Voucher> voucherCaptor = ArgumentCaptor.forClass(Voucher.class);
        verify(voucherRepository).save(voucherCaptor.capture());
        Voucher voucher = voucherCaptor.getValue();

        assertEquals("AMOUNT", voucher.getVoucherType());
        assertEquals(0, voucher.getDiscountValue().compareTo(BigDecimal.valueOf(400_000)));
        assertEquals(source.getCustomer(), voucher.getCustomer());
        assertEquals(400_000, response.getConversionValue());
        assertNotNull(response.getVoucherCode());
        assertEquals(0, source.getRemainingSessions());
        assertNotNull(source.getPackageConversion());
        verify(orderService, never()).createOrder(any(), anyString());
    }

    @Test
    void createPackageConversionCreatesConversionOrderWithTopUpAmount() {
        // Con 5/10 buoi cua goi 1.000.000d → tin dung 500.000d; goi moi 1.000.000d → bu 550.000d (gom VAT)
        CustomerTreatment source = sourceTreatment(5);
        TreatmentPackage targetPackage = packageEntity("target-package", "Target", 10, 1_000_000);
        CustomerTreatmentId sourceId = new CustomerTreatmentId("customer-1", "source-package");

        when(customerTreatmentRepository.findById(sourceId)).thenReturn(Optional.of(source));
        when(treatmentPackageRepository.findById("target-package")).thenReturn(Optional.of(targetPackage));
        when(voucherRepository.save(any(Voucher.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(packageConversionRepository.save(any(PackageConversion.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(customerTreatmentRepository.save(any(CustomerTreatment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderService.createOrder(any(OrderRequest.class), anyString())).thenReturn(OrderResponse.builder()
                .orderId("order-cv-1")
                .orderStatus(OrderStatus.PENDING_PAYMENT)
                .voucherDiscount(BigDecimal.valueOf(500_000))
                .totalAmount(BigDecimal.valueOf(550_000))
                .build());

        PackageConversionRequest request = new PackageConversionRequest();
        request.setCustomerId("customer-1");
        request.setPackageId("source-package");
        request.setConversionType(ConversionType.TO_PACKAGE);
        request.setTargetPackageId("target-package");

        PackageConversionResponse response = packageConversionService.create(request);

        ArgumentCaptor<OrderRequest> orderCaptor = ArgumentCaptor.forClass(OrderRequest.class);
        verify(orderService).createOrder(orderCaptor.capture(), anyString());
        OrderRequest orderRequest = orderCaptor.getValue();

        assertEquals("customer-1", orderRequest.getCustomerId());
        assertEquals(1, orderRequest.getItems().size());
        assertEquals("target-package", orderRequest.getItems().get(0).getPackageId());
        assertNotNull(orderRequest.getVoucherCode());

        assertEquals("order-cv-1", response.getOrderId());
        assertEquals(550_000, response.getTopUpAmount());
        assertEquals(500_000, response.getConversionValue());
        // tin dung dung het → khong co voucher hoan du
        assertNull(response.getLeftoverVoucherCode());
        assertEquals(0, source.getRemainingSessions());
        // khong bu tien → khong duoc tu dong xac nhan thanh toan
        verify(orderService, never()).processPayment(anyString(), any(), anyString());
    }

    @Test
    void createPackageConversionRejectsMissingTargetPackage() {
        CustomerTreatment source = sourceTreatment(2);
        when(customerTreatmentRepository.findById(new CustomerTreatmentId("customer-1", "source-package"))).thenReturn(Optional.of(source));

        PackageConversionRequest request = new PackageConversionRequest();
        request.setCustomerId("customer-1");
        request.setPackageId("source-package");
        request.setConversionType(ConversionType.TO_PACKAGE);

        AppException ex = assertThrows(AppException.class, () -> packageConversionService.create(request));

        assertEquals(ErrorCode.VALIDATION_ERROR, ex.getErrorCode());
        verify(orderService, never()).createOrder(any(), anyString());
    }

    private CustomerTreatment sourceTreatment(int remainingSessions) {
        Customer customer = new Customer();
        customer.setCustomerId("customer-1");
        customer.setName("Customer");

        TreatmentPackage sourcePackage = packageEntity("source-package", "Source", 10, 1_000_000);

        CustomerTreatment treatment = new CustomerTreatment();
        treatment.setId(new CustomerTreatmentId("customer-1", "source-package"));
        treatment.setCustomer(customer);
        treatment.setTreatmentPackage(sourcePackage);
        treatment.setRemainingSessions(remainingSessions);
        treatment.setPurchaseDate(LocalDate.now().minusMonths(1));
        treatment.setExpiryDate(LocalDate.now().plusMonths(11));
        return treatment;
    }

    private TreatmentPackage packageEntity(String id, String name, int totalSessions, double packagePrice) {
        TreatmentPackage pack = new TreatmentPackage();
        pack.setTreatmentPackageId(id);
        pack.setPackageName(name);
        pack.setTotalSessions(totalSessions);
        pack.setPackagePrice(packagePrice);
        return pack;
    }
}
