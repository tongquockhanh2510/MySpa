package fit.quanlyspa.entity;

import fit.quanlyspa.enums.StatusOfEmployee;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.Set;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "employees")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Employee {
    @Id
    @Column(name = "employee_id")
    String employeeId;
    String name;
    String phone;
    String email;
    @Column(name = "status_of_employee")
    StatusOfEmployee statusOfEmployee;
    String position;
    @Column(name = "base_salary")
    double baseSalary;
    @OneToMany(mappedBy = "employee")
    Set<Salary> salaries;
    @OneToMany(mappedBy = "employee")
    Set<Product> products;
    @OneToMany(mappedBy = "employee")
    Set<Service>  services;
    @OneToMany(mappedBy = "employee")
    List<AppoinmentDetail> appoinmentDetails;
}
