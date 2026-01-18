package com.blog.config;

import com.blog.service.CryptoService;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import java.util.HashMap;
import java.util.Map;

/**
 * Configuration class for handling encrypted secrets in Spring Boot.
 * 
 * This configuration:
 * - Loads encrypted properties from application.properties
 * - Decrypts them using CryptoService
 * - Makes decrypted values available via environment or property sources
 * 
 * Properties that end with .encrypted will be automatically decrypted
 * and made available without the .encrypted suffix.
 * 
 * Example:
 *   db.password.encrypted=xyz123...  -> decrypted and available as db.password
 * 
 * @author Blog Management System
 * @version 1.0
 */
@Configuration
public class SecretsConfig {

    private static final Logger logger = LoggerFactory.getLogger(SecretsConfig.class);

    @Autowired
    private CryptoService cryptoService;

    @Autowired
    private Environment environment;

    /**
     * Cache for decrypted properties to avoid repeated decryption.
     */
    private final Map<String, String> decryptedProperties = new HashMap<>();

    /**
     * Decrypts all properties ending with .encrypted after bean initialization.
     */
    @PostConstruct
    public void decryptSecrets() {
        logger.info("Initializing encrypted secrets decryption...");

        // List of property keys to check for encryption
        String[] encryptedPropertyKeys = {
            "spring.datasource.password.encrypted",
            "spring.datasource.username.encrypted",
            "jwt.secret.encrypted",
            "spring.mail.password.encrypted",
            "spring.mail.username.encrypted",
            "api.key.encrypted"
        };

        for (String encryptedKey : encryptedPropertyKeys) {
            String encryptedValue = environment.getProperty(encryptedKey);
            if (encryptedValue != null && !encryptedValue.trim().isEmpty()) {
                try {
                    String decryptedValue = cryptoService.decrypt(encryptedValue);
                    // Store without .encrypted suffix
                    String plainKey = encryptedKey.replace(".encrypted", "");
                    decryptedProperties.put(plainKey, decryptedValue);
                    logger.info("Decrypted property: {} -> {} (hidden)", plainKey, "***");
                } catch (Exception e) {
                    logger.error("Failed to decrypt property: " + encryptedKey, e);
                    throw new IllegalStateException("Failed to decrypt encrypted property: " + encryptedKey, e);
                }
            }
        }

        logger.info("Encrypted secrets decryption completed. {} properties decrypted.", decryptedProperties.size());
    }

    /**
     * Gets a decrypted property value.
     * 
     * @param key the property key (without .encrypted suffix)
     * @return decrypted value or null if not found
     */
    public String getDecryptedProperty(String key) {
        // First check decrypted cache
        String value = decryptedProperties.get(key);
        if (value != null) {
            return value;
        }

        // Then check environment (may be set via other means)
        value = environment.getProperty(key);
        if (value != null && !value.isEmpty() && cryptoService.isEncrypted(value)) {
            // Automatically decrypt if it looks encrypted
            try {
                return cryptoService.decrypt(value);
            } catch (Exception e) {
                logger.warn("Failed to auto-decrypt property: " + key, e);
            }
        }

        return value;
    }

    /**
     * Bean to provide decrypted datasource password.
     * This will be used by DataSourceConfig.
     */
    @Bean
    public String datasourcePassword() {
        String password = getDecryptedProperty("spring.datasource.password");
        if (password == null) {
            // Fallback to plain property if no encrypted version
            password = environment.getProperty("spring.datasource.password");
        }
        return password;
    }

    /**
     * Bean to provide decrypted datasource username.
     * This will be used by DataSourceConfig.
     */
    @Bean
    public String datasourceUsername() {
        String username = getDecryptedProperty("spring.datasource.username");
        if (username == null) {
            // Fallback to plain property if no encrypted version
            username = environment.getProperty("spring.datasource.username");
        }
        return username;
    }

    /**
     * Bean to provide decrypted JWT secret.
     */
    @Bean
    public String jwtSecret() {
        String secret = getDecryptedProperty("jwt.secret");
        if (secret == null) {
            // Fallback to plain property if no encrypted version
            secret = environment.getProperty("jwt.secret");
        }
        return secret;
    }
}
