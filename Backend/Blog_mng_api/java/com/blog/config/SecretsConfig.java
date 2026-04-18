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
                    // Wrong APP_SECRET_KEY, corrupted ciphertext, or legacy algorithm mismatch.
                    // Do not fail startup: callers (e.g. DataSourceConfig) can fall back to plain properties.
                    logger.error(
                        "Failed to decrypt {}. Ciphertext must be produced with the same key as APP_SECRET_KEY "
                            + "(re-run GenerateEncryptedSecrets or remove this property to use plain values).",
                        encryptedKey,
                        e);
                }
            }
        }

        logger.info("Encrypted secrets decryption completed. {} properties decrypted.", decryptedProperties.size());
    }

    /**
     * Value only if it came from a successful *.encrypted property at startup (not plain env fallback).
     */
    public String getFromDecryptedCache(String key) {
        return decryptedProperties.get(key);
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
     * Never returns null (Spring would otherwise register a NullBean and break @Value("#{@jwtSecret}")).
     */
    @Bean
    public String jwtSecret() {
        String secret = getDecryptedProperty("jwt.secret");
        if (secret == null) {
            secret = environment.getProperty("jwt.secret");
        }
        if (secret == null) {
            logger.warn(
                "jwt.secret is unset and jwt.secret.encrypted could not be decrypted. "
                    + "Set jwt.secret or fix APP_SECRET_KEY / ciphertext; using empty string for the jwtSecret bean.");
            return "";
        }
        return secret;
    }
}
