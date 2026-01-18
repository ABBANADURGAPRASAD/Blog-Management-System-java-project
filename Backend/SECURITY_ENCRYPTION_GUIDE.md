# Encryption & Security Guide

This document explains how to use the encryption system for protecting sensitive configuration values in your Spring Boot application.

## Overview

The application includes a complete AES-256-GCM encryption system for securing sensitive data like:
- Database passwords
- API keys
- JWT secrets
- SMTP/Email passwords
- Any other sensitive configuration values

## Architecture

### Components

1. **CryptoUtil** (`com.blog.util.CryptoUtil`)
   - Core encryption/decryption utility using AES-256-GCM
   - Provides methods to generate keys, encrypt, and decrypt

2. **GenerateEncryptedSecrets** (`com.blog.util.GenerateEncryptedSecrets`)
   - One-time tool to generate encrypted secrets
   - Interactive CLI for encrypting sensitive values

3. **CryptoService** (`com.blog.service.CryptoService`)
   - Spring service for runtime encryption/decryption
   - Handles secret key loading from environment or file

4. **SecretsConfig** (`com.blog.config.SecretsConfig`)
   - Configuration class that decrypts encrypted properties at startup
   - Makes decrypted values available to Spring context

5. **DataSourceConfig** (`com.blog.config.DataSourceConfig`)
   - Configures DataSource with decrypted database credentials

## Quick Start

### Step 1: Generate Secret Key and Encrypt Secrets

Run the encryption tool:

```bash
cd Backend
mvn compile exec:java -Dexec.mainClass="com.blog.util.GenerateEncryptedSecrets" -Dexec.classpathScope=compile
```

Or compile and run directly:
```bash
cd Backend
mvn compile
java -cp Blog_mng_api/target/classes:$(mvn dependency:build-classpath -q -DincludeScope=compile -Dmdep.outputFile=/dev/stdout) com.blog.util.GenerateEncryptedSecrets
```

The tool will:
1. Generate a new AES-256 secret key
2. Prompt you for sensitive values to encrypt
3. Save encrypted values to `secrets.enc` or print them to console

### Step 2: Store the Secret Key

**Option A: Environment Variable (Recommended for Production)**
```bash
export APP_SECRET_KEY="<your_generated_secret_key>"
```

**Option B: External File (Recommended for Production)**
```bash
sudo mkdir -p /etc/myapp
sudo chmod 700 /etc/myapp
echo "<your_generated_secret_key>" | sudo tee /etc/myapp/secret.key
sudo chmod 600 /etc/myapp/secret.key
```

**Option C: Local File (Development Only)**
```bash
echo "<your_generated_secret_key>" > secret.key
chmod 600 secret.key
```

### Step 3: Update application.properties

Add encrypted properties to `application.properties`:

```properties
# Use encrypted password
spring.datasource.password.encrypted=<encrypted_value_from_tool>

# Or use plain password (fallback)
spring.datasource.password=plainpassword
```

**Important**: Properties with `.encrypted` suffix take precedence over plain properties.

### Step 4: Verify Secret Key Loading

Start the application and check logs. You should see:
```
Secret key loaded from environment variable: APP_SECRET_KEY
```
or
```
Secret key loaded from file: /etc/myapp/secret.key
```

## Secret Key Loading Priority

The system loads the secret key in this order:

1. **Environment Variable**: `APP_SECRET_KEY`
2. **Custom File Path**: Property `secret.key.file.path` in application.properties
3. **Default External File**: `/etc/myapp/secret.key`
4. **Local File**: `secret.key` (in application root)

## Using Encrypted Properties

### Database Password

```properties
# Encrypted (recommended)
spring.datasource.password.encrypted=xyz123encryptedvalue...

# Plain (fallback, not recommended for production)
spring.datasource.password=root
```

The `DataSourceConfig` automatically uses the decrypted password when creating the DataSource.

### JWT Secret

```properties
# Encrypted
jwt.secret.encrypted=xyz123encryptedvalue...

# Plain (fallback)
jwt.secret=my-secret-key
```

Use in your service:
```java
@Autowired
@Value("#{@jwtSecret}")
private String jwtSecret;
```

### Mail Password

```properties
# Encrypted
spring.mail.password.encrypted=xyz123encryptedvalue...

# Plain (fallback)
spring.mail.password=myemailpassword
```

### Custom Properties

Access decrypted values in your services:

```java
@Autowired
private SecretsConfig secretsConfig;

public void example() {
    String decryptedValue = secretsConfig.getDecryptedProperty("my.secret.property");
}
```

Or use `CryptoService` directly:

```java
@Autowired
private CryptoService cryptoService;

public void example() {
    String encrypted = cryptoService.encrypt("sensitive data");
    String decrypted = cryptoService.decrypt(encrypted);
}
```

## Security Best Practices

### ✅ DO

1. **Store secret key securely**
   - Use environment variables in containerized deployments
   - Use secure file systems with proper permissions (600) in production
   - Never commit secret keys to version control

2. **Use encrypted properties**
   - Always use `.encrypted` suffix for sensitive values
   - Remove plain text values after encrypting

3. **Rotate keys regularly**
   - Generate new keys periodically
   - Re-encrypt all secrets with new key

4. **Limit file permissions**
   ```bash
   chmod 600 secret.key
   chmod 600 secrets.enc
   ```

5. **Use different keys per environment**
   - Development, staging, and production should have separate keys

### ❌ DON'T

1. **Never commit secret keys**
   - Ensure `.gitignore` includes `*.key`, `*.enc`, `secret.key`, `secrets.enc`

2. **Don't hardcode keys**
   - Never hardcode secret keys in source code
   - Always use environment variables or secure files

3. **Don't log decrypted values**
   - Avoid logging decrypted sensitive data
   - Use masking in logs if necessary

4. **Don't use plain properties in production**
   - Always encrypt sensitive values before deploying to production

## Example Workflow

### Development

1. Generate secret key and encrypt values
2. Save key to `secret.key` (local file, in .gitignore)
3. Add encrypted properties to `application.properties`
4. Run application locally

### Production Deployment

1. Generate production secret key
2. Encrypt production values
3. Store key securely:
   - Kubernetes: Store as Secret, inject as env var
   - Docker: Use secret management (Docker Secrets, AWS Secrets Manager, etc.)
   - VM: Store in `/etc/myapp/secret.key` with 600 permissions
4. Set `APP_SECRET_KEY` environment variable or configure file path
5. Deploy application with encrypted properties

## Troubleshooting

### Error: "Secret key not found"

**Solution**: Ensure the secret key is available via one of these methods:
- Set `APP_SECRET_KEY` environment variable
- Place key file at `/etc/myapp/secret.key`
- Set `secret.key.file.path` property
- Place `secret.key` file in application root (dev only)

### Error: "Decryption failed"

**Possible causes**:
1. Wrong secret key being used
2. Encrypted value was corrupted
3. Encrypted value was not Base64-encoded correctly

**Solution**: 
- Verify the secret key matches the one used for encryption
- Re-encrypt the value using `GenerateEncryptedSecrets`

### Application still using plain password

**Check**:
1. Is the encrypted property name correct? (must end with `.encrypted`)
2. Is `SecretsConfig` being loaded? (check component scan)
3. Are both encrypted and plain properties present? (encrypted takes precedence)

## Advanced Usage

### Custom Secret Key Path

```properties
secret.key.file.path=/custom/path/to/secret.key
```

### Programmatic Encryption/Decryption

```java
@Autowired
private CryptoService cryptoService;

// Encrypt
String encrypted = cryptoService.encrypt("sensitive data");

// Decrypt
String decrypted = cryptoService.decrypt(encrypted);

// Check if value is encrypted
boolean isEnc = cryptoService.isEncrypted(someValue);
```

### Testing with Encrypted Values

In test properties:
```properties
spring.datasource.password.encrypted=${TEST_ENCRYPTED_PASSWORD}
```

Set `TEST_ENCRYPTED_PASSWORD` in test environment.

## Files Generated

After running the encryption tool, these files may be created:

- `secret.key` - Secret key file (should NOT be committed)
- `secrets.enc` - Encrypted secrets file (should NOT be committed)

Both files are automatically added to `.gitignore`.

## Support

For issues or questions, refer to:
- `ExampleEncryptedConfigService.java` - Example usage patterns
- `CryptoUtil.java` - Core encryption implementation
- `CryptoService.java` - Spring service implementation
