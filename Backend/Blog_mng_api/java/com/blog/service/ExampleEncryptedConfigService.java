package com.blog.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Example service demonstrating how to use encrypted configuration values.
 * 
 * This service shows how to:
 * - Inject decrypted values using @Value with property references
 * - Use CryptoService directly for runtime encryption/decryption
 * - Access decrypted properties from SecretsConfig
 * 
 * This is a reference implementation. You can use these patterns
 * in your own services that need access to sensitive configuration.
 * 
 * @author Blog Management System
 * @version 1.0
 */
@Service
public class ExampleEncryptedConfigService {

    private static final Logger logger = LoggerFactory.getLogger(ExampleEncryptedConfigService.class);

    @Autowired
    private CryptoService cryptoService;

    @Autowired
    private com.blog.config.SecretsConfig secretsConfig;

    /**
     * Example 1: Inject decrypted JWT secret using bean from SecretsConfig.
     * The jwtSecret bean in SecretsConfig handles decryption automatically.
     */
    @Autowired
    @Value("#{@jwtSecret}")
    private String jwtSecret;

    /**
     * Example 2: Get decrypted property directly from SecretsConfig.
     * This is useful when you need to access encrypted properties dynamically.
     */
    public void demonstrateDecryptedProperties() {
        // Get decrypted database username (if encrypted)
        String dbUsername = secretsConfig.getDecryptedProperty("spring.datasource.username");
        logger.info("Decrypted DB Username: {}", dbUsername != null ? "***" : "not set");

        // Get decrypted JWT secret
        String jwtSecretValue = secretsConfig.getDecryptedProperty("jwt.secret");
        logger.info("JWT Secret available: {}", jwtSecretValue != null);

        // Get decrypted mail password
        String mailPassword = secretsConfig.getDecryptedProperty("spring.mail.password");
        logger.info("Mail Password available: {}", mailPassword != null);
    }

    /**
     * Example 3: Use CryptoService for runtime encryption/decryption.
     * This is useful when you need to encrypt/decrypt values at runtime
     * (e.g., storing sensitive user data, encrypting API responses).
     */
    public void demonstrateRuntimeEncryption() {
        try {
            String sensitiveData = "This is sensitive information";
            
            // Encrypt
            String encrypted = cryptoService.encrypt(sensitiveData);
            logger.info("Encrypted value: {}", encrypted);

            // Decrypt
            String decrypted = cryptoService.decrypt(encrypted);
            logger.info("Decrypted value matches: {}", sensitiveData.equals(decrypted));

        } catch (Exception e) {
            logger.error("Encryption/Decryption failed", e);
        }
    }

    /**
     * Example 4: Get JWT secret (injected via @Value).
     */
    public String getJwtSecret() {
        return jwtSecret;
    }

    /**
     * Example 5: Check if a value appears to be encrypted.
     */
    public boolean isValueEncrypted(String value) {
        return cryptoService.isEncrypted(value);
    }
}
