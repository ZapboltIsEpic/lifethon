package com.example.lifethon;

import com.example.lifethon.entity.User;
import com.example.lifethon.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Full-stack integration tests.
 *
 * Spins up a real PostgreSQL container via Testcontainers, starts the entire
 * Spring context on a random port, and exercises the HTTP API end-to-end.
 *
 * Requires Docker to be running on the host machine.
 *
 * Run with:  ./mvnw test -Dtest=AuthIntegrationTest -Pintegration
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Auth Integration")
class AuthIntegrationTest {

    // ── Shared Postgres container (one instance for all tests in this class) ──

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("lifethon_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",      postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    // ── Spring wiring ─────────────────────────────────────────────────────────

    @LocalServerPort          int            port;
    @Autowired TestRestTemplate restTemplate;
    @Autowired UserRepository   userRepository;

    private String baseUrl() { return "http://localhost:" + port; }

    // ── Shared state across ordered tests ─────────────────────────────────────

    static String accessToken;
    static String registeredEmail = "integration@example.com";
    static String registeredPass  = "secure-password-123";

    @BeforeEach
    void ensureClean() {
        // Only delete the test user; leave other data intact between tests
        userRepository.findByEmail(registeredEmail).ifPresent(userRepository::delete);
    }

    // ── Registration ──────────────────────────────────────────────────────────

    @Test @Order(1)
    @DisplayName("POST /api/auth/register → 201 and access token in body")
    void register_success() {
        var body = Map.of(
            "email",     registeredEmail,
            "password",  registeredPass,
            "firstName", "Integration",
            "lastName",  "Test"
        );

        ResponseEntity<Map> res = restTemplate.postForEntity(
            baseUrl() + "/api/auth/register", body, Map.class);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(res.getBody()).containsKey("token");
        assertThat((String) res.getBody().get("authProvider")).isEqualTo("LOCAL");

        accessToken = (String) res.getBody().get("token");
    }

    @Test @Order(2)
    @DisplayName("POST /api/auth/register → 400 on duplicate email")
    void register_duplicateEmail() {
        // Pre-create the user
        register_success();

        var body = Map.of(
            "email", registeredEmail, "password", "anypass",
            "firstName", "X", "lastName", "Y"
        );

        ResponseEntity<Map> res = restTemplate.postForEntity(
            baseUrl() + "/api/auth/register", body, Map.class);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat((String) res.getBody().get("error")).contains("already exists");
    }

    // ── Login ──────────────────────────────────────────────────────────────────

    @Test @Order(3)
    @DisplayName("POST /api/auth/login → 200 with token")
    void login_success() {
        register_success(); // ensure user exists

        var body = Map.of("email", registeredEmail, "password", registeredPass);

        ResponseEntity<Map> res = restTemplate.postForEntity(
            baseUrl() + "/api/auth/login", body, Map.class);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).containsKey("token");

        // Cookie should be set
        HttpHeaders headers = res.getHeaders();
        assertThat(headers.get(HttpHeaders.SET_COOKIE))
            .anyMatch(c -> c.contains("refreshToken") && c.contains("HttpOnly"));
    }

    @Test @Order(4)
    @DisplayName("POST /api/auth/login → 401 for wrong password")
    void login_wrongPassword() {
        register_success();

        var body = Map.of("email", registeredEmail, "password", "wrong-password");

        ResponseEntity<Map> res = restTemplate.postForEntity(
            baseUrl() + "/api/auth/login", body, Map.class);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    // ── Change password ────────────────────────────────────────────────────────

    @Test @Order(5)
    @DisplayName("POST /api/users/change-password → 200 and new password works")
    void changePassword_thenLoginWithNew() {
        register_success();

        // Get a token
        var loginRes = restTemplate.postForEntity(
            baseUrl() + "/api/auth/login",
            Map.of("email", registeredEmail, "password", registeredPass),
            Map.class);
        String token = (String) loginRes.getBody().get("token");

        // Change password
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        String newPassword = "new-secure-password-456";
        ResponseEntity<Map> changeRes = restTemplate.exchange(
            baseUrl() + "/api/users/change-password",
            HttpMethod.POST,
            new HttpEntity<>(Map.of("currentPassword", registeredPass, "newPassword", newPassword), headers),
            Map.class);

        assertThat(changeRes.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Old password should now fail
        ResponseEntity<Map> oldLogin = restTemplate.postForEntity(
            baseUrl() + "/api/auth/login",
            Map.of("email", registeredEmail, "password", registeredPass),
            Map.class);
        assertThat(oldLogin.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        // New password should work
        ResponseEntity<Map> newLogin = restTemplate.postForEntity(
            baseUrl() + "/api/auth/login",
            Map.of("email", registeredEmail, "password", newPassword),
            Map.class);
        assertThat(newLogin.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    // ── Change email ───────────────────────────────────────────────────────────

    @Test @Order(6)
    @DisplayName("POST /api/users/change-email → 200 and new email works for login")
    void changeEmail_thenLoginWithNew() {
        register_success();

        var loginRes = restTemplate.postForEntity(
            baseUrl() + "/api/auth/login",
            Map.of("email", registeredEmail, "password", registeredPass),
            Map.class);
        String token = (String) loginRes.getBody().get("token");

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        String newEmail = "changed-integration@example.com";
        userRepository.findByEmail(newEmail).ifPresent(userRepository::delete);

        ResponseEntity<Map> changeRes = restTemplate.exchange(
            baseUrl() + "/api/users/change-email",
            HttpMethod.POST,
            new HttpEntity<>(Map.of("newEmail", newEmail, "currentPassword", registeredPass), headers),
            Map.class);

        assertThat(changeRes.getStatusCode()).isEqualTo(HttpStatus.OK);

        // New email should work for login
        ResponseEntity<Map> newLogin = restTemplate.postForEntity(
            baseUrl() + "/api/auth/login",
            Map.of("email", newEmail, "password", registeredPass),
            Map.class);
        assertThat(newLogin.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Cleanup
        userRepository.findByEmail(newEmail).ifPresent(userRepository::delete);
    }

    // ── Verify token ───────────────────────────────────────────────────────────

    @Test @Order(7)
    @DisplayName("POST /api/auth/verify → 200 for valid token, 401 for invalid")
    void verifyToken() {
        register_success();

        var loginRes = restTemplate.postForEntity(
            baseUrl() + "/api/auth/login",
            Map.of("email", registeredEmail, "password", registeredPass),
            Map.class);
        String token = (String) loginRes.getBody().get("token");

        // Valid token
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        ResponseEntity<Map> validRes = restTemplate.exchange(
            baseUrl() + "/api/auth/verify", HttpMethod.POST,
            new HttpEntity<>(headers), Map.class);
        assertThat(validRes.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Invalid token
        headers.setBearerAuth("garbage-token");
        ResponseEntity<Map> invalidRes = restTemplate.exchange(
            baseUrl() + "/api/auth/verify", HttpMethod.POST,
            new HttpEntity<>(headers), Map.class);
        assertThat(invalidRes.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}