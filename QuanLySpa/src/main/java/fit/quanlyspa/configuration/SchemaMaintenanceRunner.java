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
        Integer existingCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM information_schema.statistics
                WHERE table_schema = DATABASE()
                  AND table_name = 'order_items'
                  AND index_name = ?
                """, Integer.class, indexName);

        if (existingCount != null && existingCount > 0) {
            return;
        }

        jdbcTemplate.execute("CREATE INDEX `" + indexName + "` ON order_items (`" + columnName + "`)");
    }

    private record IndexInfo(String indexName, String columnName) {
    }
}
