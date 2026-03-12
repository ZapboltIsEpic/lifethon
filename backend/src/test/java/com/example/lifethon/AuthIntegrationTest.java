package com.example.lifethon;

import com.example.lifethon.entity.User;
import com.example.lifethon.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Integration tests covering all HTTP-layer behaviour.
 * Replaces AuthControllerTest and UserControllerTest entirely.
 *
 * Every @Test is self-contained: it creates its own user, runs its
 * assertions, and the @AfterEach cleans up. No @Order dependencies.
 *
 * Requires Docker running on the host.
 * Run with: ./mvnw test -Dtest=AuthIntegrationTest
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
@DisplayName("HTTP layer integration tests")
class AuthIntegrationTest {

    // ── Postgres container (shared for all tests in this class) ───────────────

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

    @LocalServerPort int            port;
    @Autowired       UserRepository userRepository;
    @Autowired       PasswordEncoder passwordEncoder;

    WebTestClient client;

    // Each test registers with a unique email to stay fully isolated
    String testEmail;
    static final String PASS = "Integration-Pass-123";

    @BeforeEach
    void setUp() {
        client = WebTestClient
            .bindToServer()
            .baseUrl("http://localhost:" + port)
            .build();
        // Unique email per test — no cleanup race conditions
        testEmail = "test-" + UUID.randomUUID() + "@example.com";
    }

    @AfterEach
    void tearDown() {
        userRepository.findByEmail(testEmail).ifPresent(userRepository::delete);
    }

    // ── Shared helpers ────────────────────────────────────────────────────────

    /** Register testEmail/PASS and return the access token. */
    private String registerAndGetToken() {
        AtomicReference<String> token = new AtomicReference<>();
        client.post().uri("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(Map.of(
                "email", testEmail, "password", PASS,
                "firstName", "Test", "lastName", "User"))
            .exchange()
            .expectStatus().isCreated()
            .expectBody(Map.class)
            .consumeWith(r -> token.set(r.getResponseBody().get("token").toString()));
        return token.get();
    }

    /** Login with given credentials and return the access token. */
    private String loginAndGetToken(String email, String password) {
        AtomicReference<String> token = new AtomicReference<>();
        client.post().uri("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(Map.of("email", email, "password", password))
            .exchange()
            .expectStatus().isOk()
            .expectBody(Map.class)
            .consumeWith(r -> token.set(r.getResponseBody().get("token").toString()));
        return token.get();
    }

    /** Create a GOOGLE-provider user directly in the DB (bypasses auth flow). */
    private User createGoogleUser() {
        User u = new User();
        u.setEmail(testEmail);
        u.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        u.setFirstName("Google");
        u.setLastName("User");
        u.setIsActive(true);
        u.setRole(User.Role.USER);
        u.setAuthProvider(User.AuthProvider.GOOGLE);
        return userRepository.save(u);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  POST /api/auth/register
    // ═══════════════════════════════════════════════════════════════════════════

    @Nested @DisplayName("POST /api/auth/register")
    class Register {

        @Test @DisplayName("201 with access token, userId, and LOCAL authProvider")
        void success() {
            client.post().uri("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of(
                    "email", testEmail, "password", PASS,
                    "firstName", "Alice", "lastName", "Smith"))
                .exchange()
                .expectStatus().isCreated()
                .expectHeader().valueMatches("Set-Cookie", ".*refreshToken.*HttpOnly.*")
                .expectBody()
                    .jsonPath("$.token").isNotEmpty()
                    .jsonPath("$.userId").isNotEmpty()
                    .jsonPath("$.email").isEqualTo(testEmail)
                    .jsonPath("$.authProvider").isEqualTo("LOCAL");
        }

        @Test @DisplayName("400 when email is already registered")
        void duplicateEmail() {
            registerAndGetToken(); // create user first

            client.post().uri("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of(
                    "email", testEmail, "password", PASS,
                    "firstName", "X", "lastName", "Y"))
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody().jsonPath("$.error").value(
                    org.hamcrest.Matchers.containsString("already exists"));
        }

        @Test @DisplayName("400 when password is shorter than 6 characters")
        void passwordTooShort() {
            client.post().uri("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of(
                    "email", testEmail, "password", "abc",
                    "firstName", "X", "lastName", "Y"))
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody().jsonPath("$.error").value(
                    org.hamcrest.Matchers.containsString("6 characters"));
        }

        @Test @DisplayName("400 when email is blank")
        void blankEmail() {
            client.post().uri("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of(
                    "email", "", "password", PASS,
                    "firstName", "X", "lastName", "Y"))
                .exchange()
                .expectStatus().isBadRequest();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  POST /api/auth/login
    // ═══════════════════════════════════════════════════════════════════════════

    @Nested @DisplayName("POST /api/auth/login")
    class Login {

        @Test @DisplayName("200 with token and HttpOnly refresh cookie")
        void success() {
            registerAndGetToken();

            client.post().uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("email", testEmail, "password", PASS))
                .exchange()
                .expectStatus().isOk()
                .expectHeader().valueMatches("Set-Cookie", ".*refreshToken.*HttpOnly.*")
                .expectBody()
                    .jsonPath("$.token").isNotEmpty()
                    .jsonPath("$.email").isEqualTo(testEmail)
                    .jsonPath("$.authProvider").isEqualTo("LOCAL");
        }

        @Test @DisplayName("401 for wrong password")
        void wrongPassword() {
            registerAndGetToken();

            client.post().uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("email", testEmail, "password", "wrong-password"))
                .exchange()
                .expectStatus().isUnauthorized()
                .expectBody().jsonPath("$.error").isNotEmpty();
        }

        @Test @DisplayName("401 for non-existent email")
        void unknownEmail() {
            client.post().uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("email", "nobody@example.com", "password", PASS))
                .exchange()
                .expectStatus().isUnauthorized();
        }

        @Test @DisplayName("400 when email field is blank")
        void blankEmail() {
            client.post().uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("email", "", "password", PASS))
                .exchange()
                .expectStatus().isBadRequest();
        }

        @Test @DisplayName("401 when attempting to log in as GOOGLE account via password")
        void googleAccountBlockedFromLocalLogin() {
            createGoogleUser();

            client.post().uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("email", testEmail, "password", PASS))
                .exchange()
                .expectStatus().isUnauthorized()
                .expectBody().jsonPath("$.error").value(
                    org.hamcrest.Matchers.containsString("GOOGLE"));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  POST /api/auth/refresh
    // ═══════════════════════════════════════════════════════════════════════════

    @Nested @DisplayName("POST /api/auth/refresh")
    class Refresh {

        @Test @DisplayName("200 with new access token and rotated refresh cookie")
        void success() {
            // Login to get a refresh cookie
            client.post().uri("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of(
                    "email", testEmail, "password", PASS,
                    "firstName", "T", "lastName", "U"))
                .exchange().expectStatus().isCreated();

            AtomicReference<String> refreshCookie = new AtomicReference<>();
            client.post().uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("email", testEmail, "password", PASS))
                .exchange()
                .expectStatus().isOk()
                .expectHeader().valueMatches("Set-Cookie", ".*refreshToken.*")
                .expectBody(Map.class)
                .consumeWith(r -> {
                    // Extract the raw cookie value from the Set-Cookie header
                    String setCookie = r.getResponseHeaders().getFirst("Set-Cookie");
                    // Format: "refreshToken=<value>; Path=...; ..."
                    String val = setCookie.split(";")[0].split("=", 2)[1];
                    refreshCookie.set(val);
                });

            client.post().uri("/api/auth/refresh")
                .cookie("refreshToken", refreshCookie.get())
                .exchange()
                .expectStatus().isOk()
                .expectHeader().valueMatches("Set-Cookie", ".*refreshToken.*HttpOnly.*")
                .expectBody()
                    .jsonPath("$.token").isNotEmpty();
        }

        @Test @DisplayName("401 when no refresh cookie is sent")
        void noCookie() {
            client.post().uri("/api/auth/refresh")
                .exchange()
                .expectStatus().isUnauthorized();
        }

        @Test @DisplayName("401 and clears cookie for a garbage refresh token")
        void invalidToken() {
            client.post().uri("/api/auth/refresh")
                .cookie("refreshToken", "garbage-token")
                .exchange()
                .expectStatus().isUnauthorized()
                .expectHeader().valueMatches("Set-Cookie", ".*refreshToken.*Max-Age=0.*");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  POST /api/auth/logout
    // ═══════════════════════════════════════════════════════════════════════════

    @Nested @DisplayName("POST /api/auth/logout")
    class Logout {

        @Test @DisplayName("200 and clears the refresh cookie")
        void success() {
            String token = registerAndGetToken();

            client.post().uri("/api/auth/logout")
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk()
                .expectHeader().valueMatches("Set-Cookie", ".*refreshToken.*Max-Age=0.*")
                .expectBody().jsonPath("$.message").isEqualTo("Logged out successfully");
        }

        @Test @DisplayName("200 even when no Authorization header is sent")
        void noHeader() {
            client.post().uri("/api/auth/logout")
                .exchange()
                .expectStatus().isOk()
                .expectBody().jsonPath("$.message").isEqualTo("Logged out successfully");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  POST /api/auth/verify
    // ═══════════════════════════════════════════════════════════════════════════

    @Nested @DisplayName("POST /api/auth/verify")
    class Verify {

        @Test @DisplayName("200 for a valid access token")
        void validToken() {
            String token = registerAndGetToken();

            client.post().uri("/api/auth/verify")
                .header("Authorization", "Bearer " + token)
                .exchange()
                .expectStatus().isOk();
        }

        @Test @DisplayName("401 for a garbage token")
        void garbageToken() {
            client.post().uri("/api/auth/verify")
                .header("Authorization", "Bearer garbage")
                .exchange()
                .expectStatus().isUnauthorized();
        }

        @Test @DisplayName("401 when Authorization header is missing")
        void noHeader() {
            client.post().uri("/api/auth/verify")
                .exchange()
                .expectStatus().isUnauthorized();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  GET /api/users  &  GET /api/users/{id}
    // ═══════════════════════════════════════════════════════════════════════════

    @Nested @DisplayName("GET /api/users")
    class GetUsers {

        @Test @DisplayName("200 and list contains the registered user")
        void getAllUsers() {
            registerAndGetToken();

            client.get().uri("/api/users")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                    .jsonPath("$").isArray()
                    .jsonPath("$[?(@.email == '" + testEmail + "')]").isNotEmpty();
        }

        @Test @DisplayName("GET /api/users/{id} → 200 for existing user")
        void getUserById_found() {
            registerAndGetToken();
            Long id = userRepository.findByEmail(testEmail).get().getId();

            client.get().uri("/api/users/" + id)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                    .jsonPath("$.email").isEqualTo(testEmail)
                    .jsonPath("$.id").isEqualTo(id.intValue());
        }

        @Test @DisplayName("GET /api/users/{id} → 404 for non-existent id")
        void getUserById_notFound() {
            client.get().uri("/api/users/999999")
                .exchange()
                .expectStatus().isNotFound();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  DELETE /api/users/{id}
    // ═══════════════════════════════════════════════════════════════════════════

    @Nested @DisplayName("DELETE /api/users/{id}")
    class DeleteUser {

        @Test @DisplayName("204 and user no longer exists")
        void success() {
            registerAndGetToken();
            Long id = userRepository.findByEmail(testEmail).get().getId();

            client.delete().uri("/api/users/" + id)
                .exchange()
                .expectStatus().isNoContent();

            // Verify gone
            client.get().uri("/api/users/" + id)
                .exchange()
                .expectStatus().isNotFound();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  POST /api/users/change-password
    // ═══════════════════════════════════════════════════════════════════════════

    @Nested @DisplayName("POST /api/users/change-password")
    class ChangePassword {

        @Test @DisplayName("200 and new password works for login; old password rejected")
        void success() {
            String token     = registerAndGetToken();
            String newPass   = "New-Secure-Pass-456";

            client.post().uri("/api/users/change-password")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("currentPassword", PASS, "newPassword", newPass))
                .exchange()
                .expectStatus().isOk()
                .expectBody().jsonPath("$.message").isEqualTo("Password updated successfully");

            // Old password must now be rejected
            client.post().uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("email", testEmail, "password", PASS))
                .exchange()
                .expectStatus().isUnauthorized();

            // New password must work
            client.post().uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("email", testEmail, "password", newPass))
                .exchange()
                .expectStatus().isOk();
        }

        @Test @DisplayName("401 when current password is wrong")
        void wrongCurrentPassword() {
            String token = registerAndGetToken();

            client.post().uri("/api/users/change-password")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("currentPassword", "wrong-password", "newPassword", "NewPass1!"))
                .exchange()
                .expectStatus().isUnauthorized()
                .expectBody().jsonPath("$.error").value(
                    org.hamcrest.Matchers.containsString("incorrect"));
        }

        @Test @DisplayName("400 when new password is too short")
        void newPasswordTooShort() {
            String token = registerAndGetToken();

            client.post().uri("/api/users/change-password")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("currentPassword", PASS, "newPassword", "abc"))
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody().jsonPath("$.error").value(
                    org.hamcrest.Matchers.containsString("6 characters"));
        }

        @Test @DisplayName("400 for GOOGLE account — error message names the provider")
        void googleAccountBlocked() {
            // Get a token by temporarily giving the google user a LOCAL provider,
            // then swap it back. Simpler: just get the userId and call with a
            // manually-minted JWT — but easiest is: create google user directly
            // and call the endpoint with its id embedded in a real token via login.
            // Since GOOGLE users can't login locally, we grab the id and call
            // change-password with a fabricated auth header via a LOCAL user
            // whose userId maps to the google user — too complex.
            //
            // Cleanest approach: register a LOCAL user, then flip authProvider in DB.
            registerAndGetToken();
            User user = userRepository.findByEmail(testEmail).get();
            user.setAuthProvider(User.AuthProvider.GOOGLE);
            userRepository.save(user);

            // Get a token for this user via the DB-seeded approach:
            // we can't login via /api/auth/login (blocked for GOOGLE users),
            // so we hit the endpoint with a valid JWT from register (before we flipped).
            // Re-register a fresh LOCAL user whose userId we'll use.
            String localEmail = "local-" + UUID.randomUUID() + "@example.com";
            AtomicReference<String> tokenRef = new AtomicReference<>();
            client.post().uri("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of(
                    "email", localEmail, "password", PASS,
                    "firstName", "T", "lastName", "U"))
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .consumeWith(r -> tokenRef.set(r.getResponseBody().get("token").toString()));

            // Flip that second user to GOOGLE too
            User localUser = userRepository.findByEmail(localEmail).get();
            localUser.setAuthProvider(User.AuthProvider.GOOGLE);
            userRepository.save(localUser);

            // Now call change-password with this user's valid token
            client.post().uri("/api/users/change-password")
                .header("Authorization", "Bearer " + tokenRef.get())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("currentPassword", PASS, "newPassword", "NewPass1!"))
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody().jsonPath("$.error").value(
                    org.hamcrest.Matchers.containsString("GOOGLE"));

            userRepository.findByEmail(localEmail).ifPresent(userRepository::delete);
        }

        @Test @DisplayName("401 when Authorization header is missing")
        void noAuthHeader() {
            client.post().uri("/api/users/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("currentPassword", PASS, "newPassword", "NewPass1!"))
                .exchange()
                .expectStatus().isUnauthorized();
        }

        @Test @DisplayName("401 when Authorization header has no Bearer prefix")
        void malformedHeader() {
            client.post().uri("/api/users/change-password")
                .header("Authorization", "just-a-token")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("currentPassword", PASS, "newPassword", "NewPass1!"))
                .exchange()
                .expectStatus().isUnauthorized();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  POST /api/users/change-email
    // ═══════════════════════════════════════════════════════════════════════════

    @Nested @DisplayName("POST /api/users/change-email")
    class ChangeEmail {

        @Test @DisplayName("200 and new email works for login; old email rejected")
        void success() {
            String token    = registerAndGetToken();
            String newEmail = "changed-" + UUID.randomUUID() + "@example.com";

            client.post().uri("/api/users/change-email")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("newEmail", newEmail, "currentPassword", PASS))
                .exchange()
                .expectStatus().isOk()
                .expectBody().jsonPath("$.message").isEqualTo("Email updated. Please log in again.");

            // Old email should no longer work
            client.post().uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("email", testEmail, "password", PASS))
                .exchange()
                .expectStatus().isUnauthorized();

            // New email should work
            client.post().uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("email", newEmail, "password", PASS))
                .exchange()
                .expectStatus().isOk();

            userRepository.findByEmail(newEmail).ifPresent(userRepository::delete);
        }

        @Test @DisplayName("400 when new email is already taken")
        void emailTaken() {
            String token       = registerAndGetToken();
            String existingEmail = "existing-" + UUID.randomUUID() + "@example.com";

            // Create the "existing" user
            User other = new User();
            other.setEmail(existingEmail);
            other.setPassword(passwordEncoder.encode(PASS));
            other.setIsActive(true);
            other.setRole(User.Role.USER);
            other.setAuthProvider(User.AuthProvider.LOCAL);
            userRepository.save(other);

            client.post().uri("/api/users/change-email")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("newEmail", existingEmail, "currentPassword", PASS))
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody().jsonPath("$.error").value(
                    org.hamcrest.Matchers.containsString("already in use"));

            userRepository.findByEmail(existingEmail).ifPresent(userRepository::delete);
        }

        @Test @DisplayName("401 when current password is wrong")
        void wrongPassword() {
            String token = registerAndGetToken();

            client.post().uri("/api/users/change-email")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of(
                    "newEmail", "new-" + UUID.randomUUID() + "@example.com",
                    "currentPassword", "wrong-password"))
                .exchange()
                .expectStatus().isUnauthorized()
                .expectBody().jsonPath("$.error").value(
                    org.hamcrest.Matchers.containsString("incorrect"));
        }

        @Test @DisplayName("200 for GOOGLE user — no password check required")
        void googleUserNoPasswordCheck() {
            // Register, flip to GOOGLE in DB, get a fresh token
            AtomicReference<String> tokenRef = new AtomicReference<>();
            client.post().uri("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of(
                    "email", testEmail, "password", PASS,
                    "firstName", "G", "lastName", "U"))
                .exchange()
                .expectStatus().isCreated()
                .expectBody(Map.class)
                .consumeWith(r -> tokenRef.set(r.getResponseBody().get("token").toString()));

            User user = userRepository.findByEmail(testEmail).get();
            user.setAuthProvider(User.AuthProvider.GOOGLE);
            userRepository.save(user);

            String newEmail = "google-changed-" + UUID.randomUUID() + "@example.com";

            client.post().uri("/api/users/change-email")
                .header("Authorization", "Bearer " + tokenRef.get())
                .contentType(MediaType.APPLICATION_JSON)
                // null / missing password — should succeed for GOOGLE user
                .bodyValue(Map.of("newEmail", newEmail))
                .exchange()
                .expectStatus().isOk();

            userRepository.findByEmail(newEmail).ifPresent(userRepository::delete);
        }

        @Test @DisplayName("401 when Authorization header is missing")
        void noAuthHeader() {
            client.post().uri("/api/users/change-email")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("newEmail", "x@x.com", "currentPassword", PASS))
                .exchange()
                .expectStatus().isUnauthorized();
        }
    }
}