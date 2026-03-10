package com.example.lifethon.controller;

import com.example.lifethon.entity.User;
import com.example.lifethon.service.AuthService;
import com.example.lifethon.service.InvalidCredentialsException;
import com.example.lifethon.service.UserService;
import com.example.lifethon.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class UserController {

    private final UserService userService;
    private final AuthService authService;
    private final JwtUtil     jwtUtil;

    // ── Existing CRUD ─────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(user));
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        return ResponseEntity.ok(userService.updateUser(id, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // ── Credential endpoints ──────────────────────────────────────────────────

    /**
     * POST /api/users/change-password
     * Body: { "currentPassword": "...", "newPassword": "..." }
     * Header: Authorization: Bearer <access-token>
     */
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody ChangePasswordRequest req) {
        Long userId = extractUserId(authHeader);
        if (userId == null)
            return ResponseEntity.status(401).body(new ErrorResponse("Unauthorized"));
        try {
            authService.changePassword(userId, req.getCurrentPassword(), req.getNewPassword());
            return ResponseEntity.ok(new MessageResponse("Password updated successfully"));
        } catch (InvalidCredentialsException e) {
            return ResponseEntity.status(401).body(new ErrorResponse(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * POST /api/users/change-email
     * Body: { "newEmail": "...", "currentPassword": "..." }
     * Header: Authorization: Bearer <access-token>
     *
     * Note: frontend should log the user out after success
     * because the stored email in the JWT will be stale.
     */
    @PostMapping("/change-email")
    public ResponseEntity<?> changeEmail(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody ChangeEmailRequest req) {
        Long userId = extractUserId(authHeader);
        if (userId == null)
            return ResponseEntity.status(401).body(new ErrorResponse("Unauthorized"));
        try {
            authService.changeEmail(userId, req.getNewEmail(), req.getCurrentPassword());
            return ResponseEntity.ok(new MessageResponse("Email updated. Please log in again."));
        } catch (InvalidCredentialsException e) {
            return ResponseEntity.status(401).body(new ErrorResponse(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage()));
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Long extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        try { return jwtUtil.extractUserId(authHeader.substring(7)); }
        catch (Exception e) { return null; }
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public static class ChangePasswordRequest {
        private String currentPassword, newPassword;
        public String getCurrentPassword() { return currentPassword; }
        public void setCurrentPassword(String v) { currentPassword = v; }
        public String getNewPassword()      { return newPassword; }
        public void setNewPassword(String v)      { newPassword = v; }
    }

    public static class ChangeEmailRequest {
        private String newEmail, currentPassword;
        public String getNewEmail()         { return newEmail; }
        public void setNewEmail(String v)         { newEmail = v; }
        public String getCurrentPassword()  { return currentPassword; }
        public void setCurrentPassword(String v)  { currentPassword = v; }
    }

    public static class ErrorResponse {
        private String error;
        public ErrorResponse(String e) { this.error = e; }
        public String getError() { return error; }
    }

    public static class MessageResponse {
        private String message;
        public MessageResponse(String m) { this.message = m; }
        public String getMessage() { return message; }
    }
}