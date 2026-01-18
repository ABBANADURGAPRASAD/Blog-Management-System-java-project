package com.blog.service;

import com.blog.util.CryptoUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Spring Service for encryption and decryption operations.
 * 
 * This service:
 * - Loads the secret key from environment variable (APP_SECRET_KEY) or file
 * - Provides methods to encrypt and decrypt strings at runtime
 * - Handles key loading with proper error handling
 * 
 * The secret key is loaded in the following priority:
 * 1. Environment variable: APP_SECRET_KEY
 * 2. External file: Path specified by secret.key.file.path (default: /etc/myapp/secret.key)
 * 3. Local file: secret.key (in application root or classpath)
 * 
 * @author Blog Management System
 * @version 1.0
 */
@Service
public class CryptoService {

    private static final Logger logger = LoggerFactory.getLogger(CryptoService.class);

    /**
     * Environment variable name for the secret key.
     */
    private static final String ENV_SECRET_KEY = "APP_SECRET_KEY";

    /**
     * Default path for secret key file.
     */
    private static final String DEFAULT_SECRET_KEY_FILE = "/etc/myapp/secret.key";

    /**
     * Local secret key file name.
     */
    private static final String LOCAL_SECRET_KEY_FILE = "secret.key";

    /**
     * Custom secret key file path from application properties.
     * Can be set via: secret.key.file.path=/path/to/secret.key
     */
    @Value("${secret.key.file.path:}")
    private String customSecretKeyFilePath;

    private String secretKey;

    /**
     * Lazy initialization of the secret key.
     * The key is loaded only when first needed.
     * 
     * @return Base64-encoded secret key
     * @throws IllegalStateException if the key cannot be loaded
     */
    private String getSecretKey() {
        if (secretKey == null) {
            secretKey = loadSecretKey();
        }
        return secretKey;
    }

    /**
     * Loads the secret key from environment variable or file.
     * 
     * @return Base64-encoded secret key
     * @throws IllegalStateException if the key cannot be found or loaded
     */
    private String loadSecretKey() {
        // Try environment variable first
        String key = System.getenv(ENV_SECRET_KEY);
        if (key != null && !key.trim().isEmpty()) {
            logger.info("Secret key loaded from environment variable: {}", ENV_SECRET_KEY);
            return key.trim();
        }

        // Try custom file path from properties
        if (customSecretKeyFilePath != null && !customSecretKeyFilePath.trim().isEmpty()) {
            key = loadKeyFromFile(customSecretKeyFilePath);
            if (key != null) {
                logger.info("Secret key loaded from custom file: {}", customSecretKeyFilePath);
                return key;
            }
        }

        // Try default external file path
        key = loadKeyFromFile(DEFAULT_SECRET_KEY_FILE);
        if (key != null) {
            logger.info("Secret key loaded from default file: {}", DEFAULT_SECRET_KEY_FILE);
            return key;
        }

        // Try local file (for development)
        key = loadKeyFromFile(LOCAL_SECRET_KEY_FILE);
        if (key != null) {
            logger.warn("Secret key loaded from local file: {}. This should only be used in development!", LOCAL_SECRET_KEY_FILE);
            return key;
        }

        // If no key found, throw exception
        String errorMessage = String.format(
            "Secret key not found! Please provide it via:\n" +
            "  1. Environment variable: %s\n" +
            "  2. File at: %s\n" +
            "  3. Custom file path via property: secret.key.file.path\n" +
            "  4. Local file: %s (development only)",
            ENV_SECRET_KEY, DEFAULT_SECRET_KEY_FILE, LOCAL_SECRET_KEY_FILE
        );
        logger.error(errorMessage);
        throw new IllegalStateException(errorMessage);
    }

    /**
     * Loads the secret key from a file.
     * 
     * @param filePath Path to the secret key file
     * @return Base64-encoded secret key or null if file not found
     */
    private String loadKeyFromFile(String filePath) {
        try {
            Path path = Paths.get(filePath);
            if (Files.exists(path) && Files.isReadable(path)) {
                String key = Files.readString(path).trim();
                if (!key.isEmpty()) {
                    return key;
                }
            }
        } catch (IOException e) {
            logger.debug("Could not read secret key from file {}: {}", filePath, e.getMessage());
        }
        return null;
    }

    /**
     * Encrypts a plain text string.
     * 
     * @param plainText the text to encrypt
     * @return Base64-encoded encrypted string
     * @throws RuntimeException if encryption fails
     */
    public String encrypt(String plainText) {
        try {
            return CryptoUtil.encrypt(plainText, getSecretKey());
        } catch (CryptoUtil.CryptoException e) {
            logger.error("Encryption failed", e);
            throw new RuntimeException("Failed to encrypt value", e);
        }
    }

    /**
     * Decrypts an encrypted string.
     * 
     * @param encryptedText Base64-encoded encrypted string
     * @return decrypted plain text string
     * @throws RuntimeException if decryption fails
     */
    public String decrypt(String encryptedText) {
        if (encryptedText == null || encryptedText.trim().isEmpty()) {
            return encryptedText;
        }

        try {
            return CryptoUtil.decrypt(encryptedText.trim(), getSecretKey());
        } catch (CryptoUtil.CryptoException e) {
            logger.error("Decryption failed for encrypted value", e);
            throw new RuntimeException("Failed to decrypt value. Make sure the secret key is correct and the encrypted value is valid.", e);
        }
    }

    /**
     * Checks if a string appears to be encrypted (starts with Base64 pattern).
     * This is a heuristic check and may not be 100% accurate.
     * 
     * @param value the value to check
     * @return true if value might be encrypted
     */
    public boolean isEncrypted(String value) {
        if (value == null || value.trim().isEmpty()) {
            return false;
        }
        // Encrypted values are Base64-encoded, typically longer than 16 characters
        // and contain only Base64 characters
        String trimmed = value.trim();
        return trimmed.length() > 16 && trimmed.matches("^[A-Za-z0-9+/=]+$");
    }
}
