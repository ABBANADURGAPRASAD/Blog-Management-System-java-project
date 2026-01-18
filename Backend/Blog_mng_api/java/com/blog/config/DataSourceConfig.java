package com.blog.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

/**
 * Configuration class for DataSource with encrypted password support.
 * 
 * This configuration:
 * - Loads database connection properties
 * - Uses decrypted password from SecretsConfig
 * - Creates and configures HikariCP DataSource
 * 
 * If encrypted properties are provided (with .encrypted suffix),
 * they will be automatically decrypted and used.
 * Otherwise, plain properties will be used as fallback.
 * 
 * @author Blog Management System
 * @version 1.0
 */
@Configuration
public class DataSourceConfig {

    private static final Logger logger = LoggerFactory.getLogger(DataSourceConfig.class);

    @Autowired
    private SecretsConfig secretsConfig;

    @Autowired
    private Environment environment;

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.driver-class-name:com.mysql.cj.jdbc.Driver}")
    private String driverClassName;

    /**
     * Creates a DataSource bean with decrypted credentials.
     * 
     * @return configured DataSource
     */
    @Bean
    @Primary
    public DataSource dataSource() {
        logger.info("Configuring DataSource with encrypted password support...");

        // Get decrypted credentials from SecretsConfig
        String username = secretsConfig.getDecryptedProperty("spring.datasource.username");
        String password = secretsConfig.getDecryptedProperty("spring.datasource.password");

        // Fallback to plain properties if decrypted values are not available
        if (username == null) {
            username = environment.getProperty("spring.datasource.username", "root");
            logger.warn("Using plain username from properties (consider using encrypted property)");
        }

        if (password == null) {
            password = environment.getProperty("spring.datasource.password", "");
            logger.warn("Using plain password from properties (consider using encrypted property)");
        } else {
            logger.info("✅ Using decrypted database password");
        }

        // Configure HikariCP
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(datasourceUrl);
        config.setDriverClassName(driverClassName);
        config.setUsername(username);
        config.setPassword(password);

        // Connection pool settings (optional, adjust as needed)
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);
        config.setLeakDetectionThreshold(60000);

        logger.info("DataSource configured successfully");
        return new HikariDataSource(config);
    }
}
