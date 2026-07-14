package fit.quanlyspa.repository;

import fit.quanlyspa.entity.AppoinmentDetail;
import fit.quanlyspa.entity.AppoimentDetalId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppoinmentDetailRepository extends JpaRepository<AppoinmentDetail, AppoimentDetalId> {

}
