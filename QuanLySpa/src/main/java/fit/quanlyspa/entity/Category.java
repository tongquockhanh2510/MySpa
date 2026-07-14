package fit.quanlyspa.entity;

import fit.quanlyspa.enums.CategoryType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "categories")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Category {
    @Id
            @Column(name = "category_id")
    String categoryId;
    String name;
    @Enumerated(EnumType.STRING)
    @Column(name = "category_type")
    CategoryType type;
    @OneToMany(mappedBy = "category")
    Set<Product> products;
    @OneToMany(mappedBy = "category")
    Set<Service> services;
}
