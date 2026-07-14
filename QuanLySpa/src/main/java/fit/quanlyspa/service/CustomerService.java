package fit.quanlyspa.service;

import fit.quanlyspa.dto.request.customer.CustomerRequest;
import fit.quanlyspa.dto.response.PagedResponse;
import fit.quanlyspa.dto.response.customer.CustomerResponse;
import fit.quanlyspa.entity.Customer;
import fit.quanlyspa.enums.StatusOfAppointment;
import fit.quanlyspa.exception.AppException;
import fit.quanlyspa.exception.ErrorCode;
import fit.quanlyspa.repository.AppointmentRepository;
import fit.quanlyspa.repository.CustomerRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CustomerService {

    CustomerRepository customerRepository;
    AppointmentRepository appointmentRepository;
    DisplayCodeService displayCodeService;

    // ===== CREATE =====
    @Transactional
    public CustomerResponse create(CustomerRequest request) {
        // Business Rule: Phone uniqueness
        if (request.getPhone() != null && customerRepository.existsByPhone(request.getPhone())) {
            throw new AppException(ErrorCode.CUSTOMER_PHONE_EXISTS);
        }
        // Business Rule: Email uniqueness
        if (request.getEmail() != null && customerRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.CUSTOMER_EMAIL_EXISTS);
        }

        Customer customer = Customer.builder()
                .displayCode(displayCodeService.nextCustomerCode())
                .name(request.getName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .gender(request.getGender())
                .dateOfBirth(request.getDateOfBirth())
                .address(request.getAddress())
                .skinType(request.getSkinType())
                .allergyInfo(request.getAllergyInfo())
                .note(request.getNote())
                .referredBy(request.getReferredBy())
                .loyaltyPoints(0)
                .isActive(true)
                .build();

        customer = customerRepository.save(customer);
        log.info("Customer created: {} ({})", customer.getName(), customer.getCustomerId());
        return toResponse(customer);
    }

    // ===== READ =====
    @Transactional(readOnly = true)
    public CustomerResponse getById(String id) {
        return toResponse(findById(id));
    }

    @Transactional(readOnly = true)
    public PagedResponse<CustomerResponse> getAll(String search, Pageable pageable) {
        Page<Customer> page = customerRepository.searchCustomers(search, pageable);
        return PagedResponse.from(page.map(this::toResponse));
    }

    // ===== UPDATE =====
    @Transactional
    public CustomerResponse update(String id, CustomerRequest request) {
        Customer customer = findById(id);

        // Business Rule: Phone uniqueness (exclude self)
        if (request.getPhone() != null && !request.getPhone().equals(customer.getPhone())
                && customerRepository.existsByPhone(request.getPhone())) {
            throw new AppException(ErrorCode.CUSTOMER_PHONE_EXISTS);
        }
        // Business Rule: Email uniqueness (exclude self)
        if (request.getEmail() != null && !request.getEmail().equals(customer.getEmail())
                && customerRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.CUSTOMER_EMAIL_EXISTS);
        }

        customer.setName(request.getName());
        customer.setPhone(request.getPhone());
        customer.setEmail(request.getEmail());
        customer.setGender(request.getGender());
        customer.setDateOfBirth(request.getDateOfBirth());
        customer.setAddress(request.getAddress());
        customer.setSkinType(request.getSkinType());
        customer.setAllergyInfo(request.getAllergyInfo());
        customer.setNote(request.getNote());
        customer.setReferredBy(request.getReferredBy());

        customer = customerRepository.save(customer);
        log.info("Customer updated: {}", customer.getCustomerId());
        return toResponse(customer);
    }

    // ===== DELETE (Soft delete) =====
    @Transactional
    public void delete(String id) {
        Customer customer = findById(id);

        // Business Rule: Cannot delete customer with active appointments
        List<?> active = appointmentRepository.findUpcomingAppointments(LocalDateTime.now(),
                org.springframework.data.domain.PageRequest.of(0, 1));
        // More precise check
        long activeCount = customer.getAppointments().stream()
                .filter(a -> a.getStatusOfAppointment() == StatusOfAppointment.PENDING
                          || a.getStatusOfAppointment() == StatusOfAppointment.CONFIRMED
                          || a.getStatusOfAppointment() == StatusOfAppointment.CHECKED_IN
                          || a.getStatusOfAppointment() == StatusOfAppointment.IN_PROGRESS)
                .count();
        if (activeCount > 0) {
            throw new AppException(ErrorCode.CUSTOMER_HAS_ACTIVE_APPOINTMENTS);
        }

        customer.setActive(false);
        customerRepository.save(customer);
        log.info("Customer soft-deleted: {}", id);
    }

    // ===== LOYALTY POINTS =====
    @Transactional
    public void addLoyaltyPoints(String customerId, double points, String reason) {
        Customer customer = findById(customerId);
        customer.setLoyaltyPoints(customer.getLoyaltyPoints() + points);
        customerRepository.save(customer);
        log.info("Added {} loyalty points to customer {} ({})", points, customerId, reason);
    }

    @Transactional
    public void deductLoyaltyPoints(String customerId, double points) {
        Customer customer = findById(customerId);
        // Business Rule: Cannot have negative loyalty points
        if (customer.getLoyaltyPoints() < points) {
            throw new AppException(ErrorCode.INSUFFICIENT_LOYALTY_POINTS);
        }
        customer.setLoyaltyPoints(customer.getLoyaltyPoints() - points);
        customerRepository.save(customer);
        log.info("Deducted {} loyalty points from customer {}", points, customerId);
    }

    // ===== HELPER =====
    public Customer findById(String id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));
    }

    private CustomerResponse toResponse(Customer c) {
        String tierName = c.getMembership() != null && c.getMembership().getTier() != null
                ? c.getMembership().getTier().getTierName() : null;
        int totalAppts = c.getAppointments() != null ? c.getAppointments().size() : 0;
        int totalOrders = c.getOrders() != null ? c.getOrders().size() : 0;

        return CustomerResponse.builder()
                .customerId(c.getCustomerId())
                .displayCode(c.getDisplayCode())
                .name(c.getName())
                .phone(c.getPhone())
                .email(c.getEmail())
                .gender(c.getGender())
                .dateOfBirth(c.getDateOfBirth())
                .address(c.getAddress())
                .skinType(c.getSkinType())
                .allergyInfo(c.getAllergyInfo())
                .note(c.getNote())
                .loyaltyPoints(c.getLoyaltyPoints())
                .isActive(c.isActive())
                .referredBy(c.getReferredBy())
                .membershipTier(tierName)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .totalAppointments(totalAppts)
                .totalOrders(totalOrders)
                .build();
    }
}
