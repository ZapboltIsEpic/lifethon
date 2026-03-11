package com.example.lifethon.controller;

import com.example.lifethon.service.AuthService;
import com.example.lifethon.service.InvalidCredentialsException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@DisplayName("AuthController")
class AuthControllerTest {

    @Autowired MockMvc     mvc;
    @Autowired ObjectMapper json;
    @MockBean  AuthService  authService;

    // ── Fixture ───────────────────────────────────────────────────────────────

    private AuthService.AuthResponse mockAuthResponse(String provider) {
        return new AuthService.AuthResponse(
            "Success", "access-token", "refresh-token",
            1L, "user@example.com", provider
        );
    }

    // ── POST /api/auth/login ──────────────────────────────────────────────────

    @Nested @DisplayName("POST /api/auth/login")
    class Login {

        @Test @DisplayName("200 with token for valid credentials")
        void success() throws Exception {
            when(authService.authenticate("user@example.com", "password123"))
                .thenReturn(mockAuthResponse("LOCAL"));

            mvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of(
                        "email", "user@example.com",
                        "password", "password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("access-token"))
                .andExpect(jsonPath("$.email").value("user@example.com"))
                .andExpect(jsonPath("$.authProvider").value("LOCAL"))
                .andExpect(cookie().exists("refreshToken"));
        }

        @Test @DisplayName("401 for invalid credentials")
        void invalidCredentials() throws Exception {
            when(authService.authenticate(anyString(), anyString()))
                .thenThrow(new InvalidCredentialsException("Invalid email or password"));

            mvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of(
                        "email", "user@example.com",
                        "password", "wrong"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
        }

        @Test @DisplayName("400 for blank email")
        void blankEmail() throws Exception {
            when(authService.authenticate(eq(""), anyString()))
                .thenThrow(new IllegalArgumentException("Email is required"));

            mvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of("email", "", "password", "pass"))))
                .andExpect(status().isBadRequest());
        }
    }

    // ── POST /api/auth/register ───────────────────────────────────────────────

    @Nested @DisplayName("POST /api/auth/register")
    class Register {

        @Test @DisplayName("201 with token on successful registration")
        void success() throws Exception {
            when(authService.register("new@example.com", "password123", "Alice", "Smith"))
                .thenReturn(mockAuthResponse("LOCAL"));

            mvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of(
                        "email", "new@example.com",
                        "password", "password123",
                        "firstName", "Alice",
                        "lastName", "Smith"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("access-token"))
                .andExpect(cookie().exists("refreshToken"));
        }

        @Test @DisplayName("400 when email already exists")
        void duplicateEmail() throws Exception {
            when(authService.register(anyString(), anyString(), any(), any()))
                .thenThrow(new IllegalArgumentException("Email already exists"));

            mvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of(
                        "email", "taken@example.com",
                        "password", "password123",
                        "firstName", "Alice",
                        "lastName", "Smith"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email already exists"));
        }
    }

    // ── POST /api/auth/refresh ────────────────────────────────────────────────

    @Nested @DisplayName("POST /api/auth/refresh")
    class Refresh {

        @Test @DisplayName("200 and rotates cookie on valid refresh token")
        void success() throws Exception {
            when(authService.refreshToken("valid-rt")).thenReturn(mockAuthResponse("LOCAL"));

            mvc.perform(post("/api/auth/refresh")
                    .cookie(new jakarta.servlet.http.Cookie("refreshToken", "valid-rt")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("access-token"))
                .andExpect(cookie().exists("refreshToken"));
        }

        @Test @DisplayName("401 when no refresh cookie present")
        void missingCookie() throws Exception {
            mvc.perform(post("/api/auth/refresh"))
                .andExpect(status().isUnauthorized());
        }

        @Test @DisplayName("401 and clears cookie on invalid refresh token")
        void invalidRefreshToken() throws Exception {
            when(authService.refreshToken("bad-rt"))
                .thenThrow(new InvalidCredentialsException("Invalid refresh token"));

            mvc.perform(post("/api/auth/refresh")
                    .cookie(new jakarta.servlet.http.Cookie("refreshToken", "bad-rt")))
                .andExpect(status().isUnauthorized())
                .andExpect(cookie().maxAge("refreshToken", 0));
        }
    }

    // ── POST /api/auth/logout ─────────────────────────────────────────────────

    @Nested @DisplayName("POST /api/auth/logout")
    class Logout {

        @Test @DisplayName("200 and clears refresh cookie")
        void success() throws Exception {
            mvc.perform(post("/api/auth/logout")
                    .header("Authorization", "Bearer some-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully"))
                .andExpect(cookie().maxAge("refreshToken", 0));
        }

        @Test @DisplayName("200 even without Authorization header")
        void noHeader() throws Exception {
            mvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk());
        }
    }

    // ── POST /api/auth/google ─────────────────────────────────────────────────

    @Nested @DisplayName("POST /api/auth/google")
    class GoogleLogin {

        @Test @DisplayName("200 with GOOGLE provider in response")
        void success() throws Exception {
            when(authService.googleLogin("google-id-token"))
                .thenReturn(mockAuthResponse("GOOGLE"));

            mvc.perform(post("/api/auth/google")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of("idToken", "google-id-token"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authProvider").value("GOOGLE"))
                .andExpect(cookie().exists("refreshToken"));
        }

        @Test @DisplayName("401 for invalid Google token")
        void invalidToken() throws Exception {
            when(authService.googleLogin(anyString()))
                .thenThrow(new InvalidCredentialsException("Invalid Google token"));

            mvc.perform(post("/api/auth/google")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of("idToken", "bad-token"))))
                .andExpect(status().isUnauthorized());
        }
    }
}