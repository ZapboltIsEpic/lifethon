package com.example.lifethon.controller;

import com.example.lifethon.service.AuthService;
import com.example.lifethon.service.InvalidCredentialsException;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AuthController {

    @Autowired
    private AuthService authService;

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Sets the refresh token as an HttpOnly cookie on the response. */
    private void setRefreshCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(false)               // set to true in production (requires HTTPS)
                .path("/api/auth/refresh")   // cookie only sent to the refresh endpoint
                .maxAge(Duration.ofDays(7))
                .sameSite("Lax")             // use "None" + secure=true for cross-site
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /** Clears the refresh token cookie. */
    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/api/auth/refresh")
                .maxAge(Duration.ZERO)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    // ── Endpoints ─────────────────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request,
            HttpServletResponse response) {
        try {
            AuthService.AuthResponse auth = authService.authenticate(
                    request.getEmail(), request.getPassword());

            // Refresh token → HttpOnly cookie; access token → response body only
            setRefreshCookie(response, auth.getRefreshToken());

            return ResponseEntity.ok(new AccessTokenResponse(
                    auth.getMessage(), auth.getToken(),
                    auth.getUserId(), auth.getEmail(), "USER"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage()));
        } catch (InvalidCredentialsException e) {
            return ResponseEntity.status(401).body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody RegisterRequest request,
            HttpServletResponse response) {
        try {
            AuthService.AuthResponse auth = authService.register(
                    request.getEmail(), request.getPassword(),
                    request.getFirstName(), request.getLastName());

            setRefreshCookie(response, auth.getRefreshToken());

            return ResponseEntity.status(201).body(new AccessTokenResponse(
                    auth.getMessage(), auth.getToken(),
                    auth.getUserId(), auth.getEmail(), "USER"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            HttpServletResponse response) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401).body(new ErrorResponse("No refresh token"));
        }
        try {
            AuthService.AuthResponse auth = authService.refreshToken(refreshToken);
            // Rotate refresh token cookie
            setRefreshCookie(response, auth.getRefreshToken());
            return ResponseEntity.ok(new AccessTokenResponse(
                    auth.getMessage(), auth.getToken(),
                    auth.getUserId(), auth.getEmail(), "USER"));
        } catch (Exception e) {
            clearRefreshCookie(response);
            return ResponseEntity.status(401).body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletResponse response) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            authService.logout(authHeader.substring(7));
        }
        clearRefreshCookie(response);
        return ResponseEntity.ok(new MessageResponse("Logged out successfully"));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(new ErrorResponse("Invalid authorization header"));
        }
        String token = authHeader.substring(7);
        return authService.verifyToken(token)
                ? ResponseEntity.ok(new MessageResponse("Token is valid"))
                : ResponseEntity.status(401).body(new ErrorResponse("Invalid token"));
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(
            @RequestBody GoogleLoginRequest request,
            HttpServletResponse response) {
        try {
            AuthService.AuthResponse auth = authService.googleLogin(request.getIdToken());
            setRefreshCookie(response, auth.getRefreshToken());
            return ResponseEntity.ok(new AccessTokenResponse(
                    auth.getMessage(), auth.getToken(),
                    auth.getUserId(), auth.getEmail(), "USER"));
        } catch (InvalidCredentialsException e) {
            return ResponseEntity.status(401).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Google login failed"));
        }
    }

    @PostMapping("/facebook")
    public ResponseEntity<?> facebookLogin() {
        String token = authService.facebookLogin();
        return ResponseEntity.ok(new SimpleAuthResponse("Facebook login successful", token));
    }

    // ── DTOs ─────────────────────────────────────────────────────────────────

    /** Returned in the response body — contains access token but NOT refresh token. */
    public static class AccessTokenResponse {
        private String message;
        private String token;
        private Long   userId;
        private String email;
        private String role;

        public AccessTokenResponse(String message, String token, Long userId, String email, String role) {
            this.message = message; this.token = token;
            this.userId = userId;   this.email = email; this.role = role;
        }

        public String getMessage()  { return message; }
        public String getToken()    { return token; }
        public Long   getUserId()   { return userId; }
        public String getEmail()    { return email; }
        public String getRole()     { return role; }
    }

    public static class ErrorResponse {
        private String error;
        public ErrorResponse(String error) { this.error = error; }
        public String getError() { return error; }
    }

    public static class MessageResponse {
        private String message;
        public MessageResponse(String message) { this.message = message; }
        public String getMessage() { return message; }
    }

    public static class LoginRequest {
        private String email, password;
        public String getEmail()    { return email; }
        public void setEmail(String email)       { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RegisterRequest {
        private String email, password, firstName, lastName;
        public String getEmail()     { return email; }
        public void setEmail(String v)     { this.email = v; }
        public String getPassword()  { return password; }
        public void setPassword(String v)  { this.password = v; }
        public String getFirstName() { return firstName; }
        public void setFirstName(String v) { this.firstName = v; }
        public String getLastName()  { return lastName; }
        public void setLastName(String v)  { this.lastName = v; }
    }

    public static class GoogleLoginRequest {
        private String idToken;
        public String getIdToken() { return idToken; }
        public void setIdToken(String idToken) { this.idToken = idToken; }
    }

    public static class SimpleAuthResponse {
        private String message, token;
        public SimpleAuthResponse(String message, String token) {
            this.message = message; this.token = token;
        }
        public String getMessage() { return message; }
        public String getToken()   { return token; }
    }
}