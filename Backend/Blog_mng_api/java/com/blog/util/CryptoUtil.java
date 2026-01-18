package com.blog.util;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Utility class for AES-256-GCM encryption and decryption.
 * 
 * This class provides methods to:
 * - Generate AES-256 secret keys
 * - Encrypt plain text strings
 * - Decrypt encrypted strings
 * 
 * Uses AES-256-GCM (Galois/Counter Mode) which provides authenticated encryption,
 * ensuring both confidentiality and authenticity of the encrypted data.
 * 
 * @author Blog Management System
 * @version 1.0
 */
public class CryptoUtil {

    /**
     * Private constructor to prevent instantiation.
     * This is a utility class with static methods only.
     */
    private CryptoUtil() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int KEY_SIZE = 256; // AES-256
    private static final int GCM_IV_LENGTH = 12; // 12 bytes for GCM
    private static final int GCM_TAG_LENGTH = 128; // 128 bits for authentication tag

    /**
     * Generates a new AES-256 secret key.
     * 
     * @return Base64-encoded secret key string
     * @throws CryptoException if key generation fails
     */
    public static String generateSecretKey() throws CryptoException {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance(ALGORITHM);
            keyGenerator.init(KEY_SIZE, new SecureRandom());
            SecretKey secretKey = keyGenerator.generateKey();
            return Base64.getEncoder().encodeToString(secretKey.getEncoded());
        } catch (Exception e) {
            throw new CryptoException("Failed to generate secret key", e);
        }
    }

    /**
     * Encrypts a plain text string using AES-256-GCM.
     * 
     * The encrypted result includes the IV (Initialization Vector) prepended to the ciphertext,
     * all Base64-encoded for easy storage.
     * 
     * @param plainText the text to encrypt
     * @param secretKeyBase64 Base64-encoded secret key
     * @return Base64-encoded encrypted string (IV + ciphertext)
     * @throws CryptoException if encryption fails
     */
    public static String encrypt(String plainText, String secretKeyBase64) throws CryptoException {
        if (plainText == null || plainText.isEmpty()) {
            throw new CryptoException("Plain text cannot be null or empty");
        }
        if (secretKeyBase64 == null || secretKeyBase64.isEmpty()) {
            throw new CryptoException("Secret key cannot be null or empty");
        }

        try {
            // Decode the secret key
            byte[] keyBytes = Base64.getDecoder().decode(secretKeyBase64);
            SecretKey secretKey = new SecretKeySpec(keyBytes, ALGORITHM);

            // Generate random IV
            byte[] iv = new byte[GCM_IV_LENGTH];
            SecureRandom random = new SecureRandom();
            random.nextBytes(iv);

            // Initialize cipher
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            // Encrypt
            byte[] plainTextBytes = plainText.getBytes(StandardCharsets.UTF_8);
            byte[] cipherText = cipher.doFinal(plainTextBytes);

            // Prepend IV to ciphertext
            byte[] encryptedWithIv = new byte[GCM_IV_LENGTH + cipherText.length];
            System.arraycopy(iv, 0, encryptedWithIv, 0, GCM_IV_LENGTH);
            System.arraycopy(cipherText, 0, encryptedWithIv, GCM_IV_LENGTH, cipherText.length);

            // Return Base64-encoded result
            return Base64.getEncoder().encodeToString(encryptedWithIv);
        } catch (Exception e) {
            throw new CryptoException("Encryption failed", e);
        }
    }

    /**
     * Decrypts an encrypted string using AES-256-GCM.
     * 
     * The encrypted string should contain the IV prepended to the ciphertext,
     * both Base64-encoded.
     * 
     * @param encryptedText Base64-encoded encrypted string (IV + ciphertext)
     * @param secretKeyBase64 Base64-encoded secret key
     * @return decrypted plain text string
     * @throws CryptoException if decryption fails
     */
    public static String decrypt(String encryptedText, String secretKeyBase64) throws CryptoException {
        if (encryptedText == null || encryptedText.isEmpty()) {
            throw new CryptoException("Encrypted text cannot be null or empty");
        }
        if (secretKeyBase64 == null || secretKeyBase64.isEmpty()) {
            throw new CryptoException("Secret key cannot be null or empty");
        }

        try {
            // Decode the secret key
            byte[] keyBytes = Base64.getDecoder().decode(secretKeyBase64);
            SecretKey secretKey = new SecretKeySpec(keyBytes, ALGORITHM);

            // Decode the encrypted data
            byte[] encryptedWithIv = Base64.getDecoder().decode(encryptedText);

            // Extract IV and ciphertext
            if (encryptedWithIv.length < GCM_IV_LENGTH) {
                throw new CryptoException("Invalid encrypted data format");
            }

            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] cipherText = new byte[encryptedWithIv.length - GCM_IV_LENGTH];
            System.arraycopy(encryptedWithIv, 0, iv, 0, GCM_IV_LENGTH);
            System.arraycopy(encryptedWithIv, GCM_IV_LENGTH, cipherText, 0, cipherText.length);

            // Initialize cipher
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            // Decrypt
            byte[] plainTextBytes = cipher.doFinal(cipherText);
            return new String(plainTextBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new CryptoException("Decryption failed", e);
        }
    }

    /**
     * Custom exception for encryption/decryption errors.
     */
    public static class CryptoException extends Exception {
        public CryptoException(String message) {
            super(message);
        }

        public CryptoException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
