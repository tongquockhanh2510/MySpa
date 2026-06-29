package fit.quanlyspa.service;

import fit.quanlyspa.dto.request.treatment.PackageConversionRequest;
import fit.quanlyspa.dto.response.treatment.PackageConversionResponse;
import fit.quanlyspa.entity.Customer;
import fit.quanlyspa.entity.CustomerTreatment;
import fit.quanlyspa.entity.CustomerTreatmentId;
import fit.quanlyspa.entity.PackageConversion;
import fit.quanlyspa.entity.TreatmentPackage;
import fit.quanlyspa.entity.TreatmentSchedule;
import fit.quanlyspa.entity.Voucher;
import fit.quanlyspa.enums.ConversionType;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
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

    @InjectMocks PackageConversionService packageConversionService;

    @Test
    void createDiscountConversionCreatesCustomerVoucherAndConsumesSourceSessions() {
        CustomerTreatment source = sourceTreatment(4);
        when(customerTreatmentRepository.findById(new CustomerTreatmentId("customer-1", "source-package"))).thenReturn(Optional.of(source));
        when(voucherRepository.save(any(Voucher.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(packageConversionRepository.save(any(PackageConversion.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(customerTreatmentRepository.save(any(CustomerTreatment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PackageConversionRequest request = new PackageConversionRequest();
        request.setCustomerId("customer-1");
        request.setPackageId("source-package");
        request.setConversionType(ConversionType.TO_DISCOUNT);
        request.setConversionValue(300_000);

        PackageConversionResponse response = packageConversionService.create(request);

        ArgumentCaptor<Voucher> voucherCaptor = ArgumentCaptor.forClass(Voucher.class);
        verify(voucherRepository).save(voucherCaptor.capture());
        Voucher voucher = voucherCaptor.getValue();

        assertEquals("AMOUNT", voucher.getVoucherType());
        assertEquals(BigDecimal.valueOf(300_000.0), voucher.getDiscountValue());
        assertEquals(source.getCustomer(), voucher.getCustomer());
        assertNotNull(response.getVoucherCode());
        assertEquals(0, source.getRemainingSessions());
        assertNotNull(source.getPackageConversion());
    }

    @Test
    void createPackageConversionCreatesTargetTreatmentAndSchedulesConvertedSessions() {
        CustomerTreatment source = sourceTreatment(5);
        TreatmentPackage targetPackage = packageEntity("target-package", "Target", 10, 1_000_000);
        CustomerTreatmentId sourceId = new CustomerTreatmentId("customer-1", "source-package");
        CustomerTreatmentId targetId = new CustomerTreatmentId("customer-1", "target-package");

        when(customerTreatmentRepository.findById(sourceId)).thenReturn(Optional.of(source));
        when(customerTreatmentRepository.findById(targetId)).thenReturn(Optional.empty());
        when(treatmentPackageRepository.findById("target-package")).thenReturn(Optional.of(targetPackage));
        when(customerTreatmentRepository.save(any(CustomerTreatment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(packageConversionRepository.save(any(PackageConversion.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PackageConversionRequest request = new PackageConversionRequest();
        request.setCustomerId("customer-1");
        request.setPackageId("source-package");
        request.setConversionType(ConversionType.TO_PACKAGE);
        request.setConversionValue(250_000);
        request.setTargetPackageId("target-package");

        PackageConversionResponse response = packageConversionService.create(request);

        ArgumentCaptor<CustomerTreatment> treatmentCaptor = ArgumentCaptor.forClass(CustomerTreatment.class);
        verify(customerTreatmentRepository, times(2)).save(treatmentCaptor.capture());
        CustomerTreatment targetTreatment = treatmentCaptor.getAllValues().get(0);

        assertEquals(targetId, targetTreatment.getId());
        assertEquals(2, targetTreatment.getRemainingSessions());
        assertEquals(LocalDate.now().plusDays(365), targetTreatment.getExpiryDate());
        assertEquals(2, response.getConvertedSessions());
        assertEquals("target-package", response.getTargetPackageId());
        assertEquals(0, source.getRemainingSessions());

        ArgumentCaptor<TreatmentSchedule> scheduleCaptor = ArgumentCaptor.forClass(TreatmentSchedule.class);
        verify(treatmentScheduleRepository, times(2)).save(scheduleCaptor.capture());
        assertEquals(1, scheduleCaptor.getAllValues().get(0).getSessionNumber());
        assertEquals(2, scheduleCaptor.getAllValues().get(1).getSessionNumber());
    }

    @Test
    void createPackageConversionRejectsMissingTargetPackage() {
        CustomerTreatment source = sourceTreatment(2);
        when(customerTreatmentRepository.findById(new CustomerTreatmentId("customer-1", "source-package"))).thenReturn(Optional.of(source));

        PackageConversionRequest request = new PackageConversionRequest();
        request.setCustomerId("customer-1");
        request.setPackageId("source-package");
        request.setConversionType(ConversionType.TO_PACKAGE);
        request.setConversionValue(100_000);

        AppException ex = assertThrows(AppException.class, () -> packageConversionService.create(request));

        assertEquals(ErrorCode.VALIDATION_ERROR, ex.getErrorCode());
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
