package fit.quanlyspa.configuration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class SchemaMaintenanceRunner implements CommandLineRunner {

    private static final Set<String> ORDER_ITEM_REFERENCE_COLUMNS = Set.of("product_id", "service_id", "package_id");

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        removeWrongUniqueIndexesOnOrderItems();
        ensureOrderAppointmentColumn();
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
