package fit.quanlyspa.configuration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.pricing")
public class PricingProperties {
    /** Vietnamese consumer-facing prices are VAT-inclusive by default. */
    private boolean vatInclusive = true;
    /** VAT rate in percentage points, for example 10 means 10%. */
    private BigDecimal vatRate = BigDecimal.TEN;
}
