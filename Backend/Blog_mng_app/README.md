# Module: `blog-app` (`Blog_mng_app`)

**Purpose:** Runnable **Spring Boot** application: wires classpath scanning, JPA entity scan, repository scan, and starts an embedded Tomcat server. This is the module you run with `mvn spring-boot:run` or `java -jar`.

**Packaging:** Executable JAR (`spring-boot-maven-plugin`). Depends on `blog-service` and `spring-boot-starter-web`.

---

## File-by-file explanations

| File | Explanation |
|------|-------------|
| `java/com/bolg/BlogApplication.java` | `@SpringBootApplication` entry point. **`@ComponentScan`** includes both `com.blog` (controllers, services, repositories, kafka) and `com.bolg` (legacy package name). **`@EntityScan`** on `com.blog.model` loads JPA entities from `blog-api`. **`@EnableJpaRepositories`** on `com.blog.repository` registers Spring Data repositories from `blog-service`. The package name `com.bolg` is intentional (typo preserved to match folder layout). |

---

## Runtime classpath

At runtime, `blog-app` brings in:

- `blog-service` → `blog-api` + JPA + Kafka + repositories and `@Service` implementations  
- `spring-boot-starter-web` → REST, Jackson, Tomcat  

Configuration is typically loaded from **`Backend/application.properties`** when that file is on the classpath or copied into resources (your project may copy it from `Backend/` into the app module—verify your build).

---

## Related documentation

- [Backend README](../README.md) (build and run commands)
- [Backend docs index](../docs/README.md)
- [blog-api README](../Blog_mng_api/README.md) / [blog-service README](../Blog_mng_sevice/README.md)
