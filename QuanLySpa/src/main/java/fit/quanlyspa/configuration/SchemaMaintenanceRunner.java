package fit.quanlyspa.configuration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

import fit.quanlyspa.service.DisplayCodeService;

@Component
@RequiredArgsConstructor
@Slf4j
public class SchemaMaintenanceRunner implements CommandLineRunner {

    private static final Set<String> ORDER_ITEM_REFERENCE_COLUMNS = Set.of("product_id", "service_id", "package_id");

    private final JdbcTemplate jdbcTemplate;
    private final DisplayCodeService displayCodeService;

    @Override
    public void run(String... args) {
        ensureDisplayCodeInfrastructure();
        removeWrongUniqueIndexesOnOrderItems();
        ensureOrderAppointmentColumn();
        normalizeCommissionRates();
        backfillCategoryTypes();
        ensureCommissionIdempotencyConstraint();
        normalizeLoyaltyPoints();
        backfillPromotionLimits();
        backfillDisplayCodes();
    }

    private void ensureDisplayCodeInfrastructure() {
        try {
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS display_code_sequences (
                        code_key VARCHAR(80) PRIMARY KEY,
                        last_value BIGINT NOT NULL
                    )
                    """);
        } catch (Exception e) {
            log.warn("Could not create display code sequence table: {}", e.getMessage(), e);
        }
    }

    private void backfillDisplayCodes() {
        try {
            backfillSimple("customers", "customer_id", "CUSTOMER");
            backfillSimple("employees", "employee_id", "EMPLOYEE");
            backfillServices();
            backfillDated("orders", "order_id", "created_at", "ORDER");
            backfillDated("appointments", "appointment_id", "date_time", "APPOINTMENT");
        } catch (Exception e) {
            log.warn("Could not backfill display codes: {}", e.getMessage(), e);
        }
    }

    private void backfillSimple(String table, String idColumn, String type) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT " + idColumn + " AS id FROM " + table +
                        " WHERE display_code IS NULL OR display_code = '' ORDER BY " + idColumn);
        for (Map<String, Object> row : rows) {
            String id = String.valueOf(row.get("id"));
            String code = legacyCode(id) ? id : "CUSTOMER".equals(type)
                    ? displayCodeService.nextCustomerCode()
                    : displayCodeService.nextEmployeeCode();
            jdbcTemplate.update("UPDATE " + table + " SET display_code = ? WHERE " + idColumn + " = ?", code, id);
        }
    }

    private void backfillServices() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
                SELECT s.service_id AS id, c.name AS category_name
                FROM services s LEFT JOIN categories c ON c.category_id = s.category_id
                WHERE s.display_code IS NULL OR s.display_code = ''
                ORDER BY s.service_id
                """);
        for (Map<String, Object> row : rows) {
            String id = String.valueOf(row.get("id"));
            String category = row.get("category_name") == null ? null : String.valueOf(row.get("category_name"));
            String code = legacyCode(id) ? id : displayCodeService.nextServiceCode(category);
            jdbcTemplate.update("UPDATE services SET display_code = ? WHERE service_id = ?", code, id);
        }
    }

    private void backfillDated(String table, String idColumn, String dateColumn, String type) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT " + idColumn + " AS id, " + dateColumn + " AS event_date FROM " + table +
                        " WHERE display_code IS NULL OR display_code = '' ORDER BY " + dateColumn + ", " + idColumn);
        for (Map<String, Object> row : rows) {
            String id = String.valueOf(row.get("id"));
            Object rawDate = row.get("event_date");
            LocalDate date = rawDate instanceof LocalDateTime value ? value.toLocalDate()
                    : rawDate instanceof java.sql.Timestamp value ? value.toLocalDateTime().toLocalDate()
                    : rawDate instanceof java.sql.Date value ? value.toLocalDate()
                    : LocalDate.now();
            String code = legacyCode(id) ? id : "ORDER".equals(type)
                    ? displayCodeService.nextOrderCode(date)
                    : displayCodeService.nextAppointmentCode(date);
            jdbcTemplate.update("UPDATE " + table + " SET display_code = ? WHERE " + idColumn + " = ?", code, id);
        }
    }

    private boolean legacyCode(String id) {
        return id != null && id.matches("(?i)^(cust|customer|emp|employee|srv|service|order|appt|appointment)-[a-z0-9-]+$");
    }

    private void backfillPromotionLimits() {
        for (String table : List.of("amount_promotion", "percent_promotion")) {
            try {
                jdbcTemplate.update("UPDATE " + table + " SET initial_quantity = quantity "
                        + "WHERE initial_quantity IS NULL AND quantity IS NOT NULL");
            } catch (Exception e) {
                log.warn("Could not backfill promotion limits for {}: {}", table, e.getMessage());
            }
        }
    }

    private void normalizeLoyaltyPoints() {
        try {
            jdbcTemplate.update("UPDATE customers SET loyalty_points = FLOOR(loyalty_points) WHERE loyalty_points IS NOT NULL");
            jdbcTemplate.update("UPDATE memberships SET points_balance = FLOOR(points_balance), points_earned_total = FLOOR(points_earned_total)");
        } catch (Exception e) {
            log.warn("Could not normalize loyalty points: {}", e.getMessage(), e);
        }
    }

    private void ensureCommissionIdempotencyConstraint() {
        try {
            jdbcTemplate.update("""
                    DELETE newer FROM commissions newer
                    JOIN commissions older
                      ON newer.employee_id = older.employee_id
                     AND newer.commission_type = older.commission_type
                     AND newer.reference_id = older.reference_id
                     AND newer.commission_id > older.commission_id
                    WHERE newer.reference_id IS NOT NULL
                    """);
            Integer count = jdbcTemplate.queryForObject("""
                    SELECT COUNT(*) FROM information_schema.statistics
                    WHERE table_schema = DATABASE()
                      AND table_name = 'commissions'
                      AND index_name = 'uk_commission_employee_type_reference'
                    """, Integer.class);
            if (count == null || count == 0) {
                jdbcTemplate.execute("""
                        ALTER TABLE commissions
                        ADD CONSTRAINT uk_commission_employee_type_reference
                        UNIQUE (employee_id, commission_type, reference_id)
                        """);
            }
        } catch (Exception e) {
            log.warn("Could not ensure commission idempotency constraint: {}", e.getMessage(), e);
        }
    }

    private void backfillCategoryTypes() {
        try {
            jdbcTemplate.update("""
                    UPDATE categories c SET category_type = 'SERVICE'
                    WHERE (category_type IS NULL OR category_type = '')
                      AND EXISTS (SELECT 1 FROM services s WHERE s.category_id = c.category_id)
                    """);
            jdbcTemplate.update("""
                    UPDATE categories SET category_type = 'PRODUCT'
                    WHERE category_type IS NULL OR category_type = ''
                    """);
        } catch (Exception e) {
            log.warn("Could not backfill category types: {}", e.getMessage(), e);
        }
    }

    /** Convert legacy fractional rates (0.10) to percentage points (10). */
    private void normalizeCommissionRates() {
        try {
            int services = jdbcTemplate.update("""
                    UPDATE services SET commission_rate = commission_rate * 100
                    WHERE commission_rate > 0 AND commission_rate < 1
                    """);
            int employees = jdbcTemplate.update("""
                    UPDATE employees SET commission_rate = commission_rate * 100
                    WHERE commission_rate > 0 AND commission_rate < 1
                    """);
            if (services + employees > 0) {
                log.info("Normalized {} legacy commission rates to percentage points", services + employees);
            }
        } catch (Exception e) {
            log.warn("Could not normalize legacy commission rates: {}", e.getMessage(), e);
        }
    }

    private void ensureOrderAppointmentColumn() {
        try {
            Integer columnCount = jdbcTemplate.queryForObject("""
                    SELECT COUNT(*)
                    FROM information_schema.columns
                    WHERE table_schema = DATABASE()
                      AND table_name = 'orders'
                      AND column_name = 'appointment_id'
                    """, Integer.class);

            if (columnCount == null || columnCount == 0) {
                jdbcTemplate.execute("ALTER TABLE orders ADD COLUMN appointment_id VARCHAR(255) NULL");
                log.info("Added nullable orders.appointment_id column");
            }

            ensureIndex("orders", "idx_orders_appointment_id", "appointment_id");

            Integer fkCount = jdbcTemplate.queryForObject("""
                    SELECT COUNT(*)
                    FROM information_schema.key_column_usage
                    WHERE table_schema = DATABASE()
                      AND table_name = 'orders'
                      AND column_name = 'appointment_id'
                      AND referenced_table_name = 'appointments'
                    """, Integer.class);

            if (fkCount == null || fkCount == 0) {
                jdbcTemplate.execute("""
                        ALTER TABLE orders
                        ADD CONSTRAINT fk_orders_appointment
                        FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
                        """);
                log.info("Added orders.appointment_id foreign key");
            }
        } catch (Exception e) {
            log.warn("Could not maintain orders.appointment_id schema: {}", e.getMessage(), e);
        }
    }

    private void removeWrongUniqueIndexesOnOrderItems() {
        try {
            List<IndexInfo> uniqueIndexes = jdbcTemplate.query("""
                    SELECT index_name, column_name
                    FROM information_schema.statistics
                    WHERE table_schema = DATABASE()
                      AND table_name = 'order_items'
                      AND non_unique = 0
                      AND seq_in_index = 1
                      AND column_name IN ('product_id', 'service_id', 'package_id')
                      AND index_name NOT IN ('PRIMARY')
                      AND index_name IN (
                          SELECT index_name
                          FROM information_schema.statistics
                          WHERE table_schema = DATABASE()
                            AND table_name = 'order_items'
                          GROUP BY index_name
                          HAVING COUNT(*) = 1
                      )
                    """, (rs, rowNum) -> new IndexInfo(rs.getString("index_name"), rs.getString("column_name")));

            for (IndexInfo index : uniqueIndexes) {
                if (!ORDER_ITEM_REFERENCE_COLUMNS.contains(index.columnName())) {
                    continue;
                }

                ensureNonUniqueIndex(index.columnName());
                jdbcTemplate.execute("ALTER TABLE order_items DROP INDEX `" + index.indexName().replace("`", "``") + "`");
                log.info("Removed wrong unique index {} on order_items.{}", index.indexName(), index.columnName());
            }
        } catch (Exception e) {
            log.warn("Could not maintain order_items indexes: {}", e.getMessage(), e);
        }
    }

    private void ensureNonUniqueIndex(String columnName) {
        String indexName = "idx_order_items_" + columnName;
        ensureIndex("order_items", indexName, columnName);
    }

    private void ensureIndex(String tableName, String indexName, String columnName) {
        Integer existingCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM information_schema.statistics
                WHERE table_schema = DATABASE()
                  AND table_name = ?
                  AND index_name = ?
                """, Integer.class, tableName, indexName);

        if (existingCount != null && existingCount > 0) {
            return;
        }

        jdbcTemplate.execute("CREATE INDEX `" + indexName.replace("`", "``") + "` ON `"
                + tableName.replace("`", "``") + "` (`" + columnName.replace("`", "``") + "`)");
    }

    private record IndexInfo(String indexName, String columnName) {
    }
}
