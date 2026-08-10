package fit.quanlyspa.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origin-patterns:}")
    private String extraAllowedOriginPatterns;

    @Bean
    public CorsFilter corsFilter() {
        List<String> allowedOriginPatterns = new ArrayList<>(List.of("http://localhost:*", "http://127.0.0.1:*"));
        if (StringUtils.hasText(extraAllowedOriginPatterns)) {
            Arrays.stream(extraAllowedOriginPatterns.split(","))
                    .map(String::trim)
                    .filter(StringUtils::hasText)
                    .forEach(allowedOriginPatterns::add);
        }

        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(allowedOriginPatterns);
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization", "Content-Disposition"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
