package com.example.lifethon.controller;

import com.example.lifethon.entity.User;
import com.example.lifethon.service.AuthService;
import com.example.lifethon.service.InvalidCredentialsException;
import com.example.lifethon.service.UserService;
import com.example.lifethon.util.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@DisplayName("UserController")
class UserControllerTest {

    @Autowired MockMvc      mvc;
    @Autowired ObjectMapper json;
    @MockBean  UserService  userService;
    @MockBean  AuthService  authService;
    @MockBean  JwtUtil      jwtUtil;

    private static final String BEARER = "Bearer valid-token";

    private User sampleUser() {
        User u = new User();
        u.setId(1L);
        u.setEmail("user@example.com");
        u.setFirstName("Alice");
        u.setLastName("Smith");
        u.setIsActive(true);
        u.setRole(User.Role.USER);
        u.setAuthProvider(User.AuthProvider.LOCAL);
        return u;
    }

    @BeforeEach
    void stubJwt() {
        // All authenticated endpoints extract userId from JWT
        lenient().when(jwtUtil.extractUserId("valid-token")).thenReturn(1L);
    }

    // ── GET /api/users ────────────────────────────────────────────────────────

    @Test @DisplayName("GET /api/users returns user list")
    void getAllUsers() throws Exception {
        when(userService.getAllUsers()).thenReturn(List.of(sampleUser()));

        mvc.perform(get("/api/users"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].email").value("user@example.com"));
    }

    // ── GET /api/users/{id} ───────────────────────────────────────────────────

    @Test @DisplayName("GET /api/users/1 returns user")
    void getUserById_found() throws Exception {
        when(userService.getUserById(1L)).thenReturn(Optional.of(sampleUser()));

        mvc.perform(get("/api/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1));
    }

    @Test @DisplayName("GET /api/users/999 returns 404")
    void getUserById_notFound() throws Exception {
        when(userService.getUserById(999L)).thenReturn(Optional.empty());

        mvc.perform(get("/api/users/999"))
            .andExpect(status().isNotFound());
    }

    // ── DELETE /api/users/{id} ────────────────────────────────────────────────

    @Test @DisplayName("DELETE /api/users/1 returns 204")
    void deleteUser() throws Exception {
        doNothing().when(userService).deleteUser(1L);

        mvc.perform(delete("/api/users/1"))
            .andExpect(status().isNoContent());
    }

    // ── POST /api/users/change-password ──────────────────────────────────────

    @Nested @DisplayName("POST /api/users/change-password")
    class ChangePassword {

        @Test @DisplayName("200 on success")
        void success() throws Exception {
            doNothing().when(authService).changePassword(1L, "oldpass", "newpass1");

            mvc.perform(post("/api/users/change-password")
                    .header("Authorization", BEARER)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of(
                        "currentPassword", "oldpass",
                        "newPassword", "newpass1"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password updated successfully"));
        }

        @Test @DisplayName("401 for wrong current password")
        void wrongCurrentPassword() throws Exception {
            doThrow(new InvalidCredentialsException("Current password is incorrect"))
                .when(authService).changePassword(anyLong(), anyString(), anyString());

            mvc.perform(post("/api/users/change-password")
                    .header("Authorization", BEARER)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of(
                        "currentPassword", "wrong",
                        "newPassword", "newpass1"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Current password is incorrect"));
        }

        @Test @DisplayName("400 for Google account")
        void googleAccountRejected() throws Exception {
            doThrow(new IllegalArgumentException("Password change is not available for GOOGLE accounts."))
                .when(authService).changePassword(anyLong(), any(), anyString());

            mvc.perform(post("/api/users/change-password")
                    .header("Authorization", BEARER)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of(
                        "currentPassword", "anything",
                        "newPassword", "newpass1"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("GOOGLE")));
        }

        @Test @DisplayName("401 when Authorization header is missing")
        void noAuthHeader() throws Exception {
            mvc.perform(post("/api/users/change-password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of(
                        "currentPassword", "old",
                        "newPassword", "newpass1"))))
                .andExpect(status().isUnauthorized());
        }
    }

    // ── POST /api/users/change-email ──────────────────────────────────────────

    @Nested @DisplayName("POST /api/users/change-email")
    class ChangeEmail {

        @Test @DisplayName("200 on success")
        void success() throws Exception {
            doNothing().when(authService).changeEmail(1L, "new@example.com", "password123");

            mvc.perform(post("/api/users/change-email")
                    .header("Authorization", BEARER)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of(
                        "newEmail", "new@example.com",
                        "currentPassword", "password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Email updated. Please log in again."));
        }

        @Test @DisplayName("400 when new email already in use")
        void emailTaken() throws Exception {
            doThrow(new IllegalArgumentException("Email is already in use"))
                .when(authService).changeEmail(anyLong(), anyString(), any());

            mvc.perform(post("/api/users/change-email")
                    .header("Authorization", BEARER)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of(
                        "newEmail", "taken@example.com",
                        "currentPassword", "password123"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email is already in use"));
        }

        @Test @DisplayName("401 for wrong password")
        void wrongPassword() throws Exception {
            doThrow(new InvalidCredentialsException("Current password is incorrect"))
                .when(authService).changeEmail(anyLong(), anyString(), anyString());

            mvc.perform(post("/api/users/change-email")
                    .header("Authorization", BEARER)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(Map.of(
                        "newEmail", "new@example.com",
                        "currentPassword", "wrong"))))
                .andExpect(status().isUnauthorized());
        }
    }
}