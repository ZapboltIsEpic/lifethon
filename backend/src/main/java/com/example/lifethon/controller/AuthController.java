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

    // ── Cookie helpers ────────────────────────────────────────────────────────

    private void setRefreshCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(false)               // true in production
                .path("/api/auth/refresh")
                .maxAge(Duration.ofDays(7))
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true).secure(false)
                .path("/api/auth/refresh")
                .maxAge(Duration.ZERO).sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private AccessTokenResponse toResponse(AuthService.AuthResponse auth, String role) {
        return new AccessTokenResponse(
            auth.getMessage(), auth.getToken(),
            auth.getUserId(), auth.getEmail(),
            role, auth.getAuthProvider()          // ← authProvider forwarded
        );
    }

    // ── Endpoints ─────────────────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest req, HttpServletResponse response) {
        try {
            AuthService.AuthResponse auth = authService.authenticate(req.getEmail(), req.getPassword());
            setRefreshCookie(response, auth.getRefreshToken());
            return ResponseEntity.ok(toResponse(auth, "USER"));
        } catch (IllegalArgumentException e)      { return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage())); }
          catch (InvalidCredentialsException e)   { return ResponseEntity.status(401).body(new ErrorResponse(e.getMessage())); }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody RegisterRequest req, HttpServletResponse response) {
        try {
            AuthService.AuthResponse auth = authService.register(
                req.getEmail(), req.getPassword(), req.getFirstName(), req.getLastName());
            setRefreshCookie(response, auth.getRefreshToken());
            return ResponseEntity.status(201).body(toResponse(auth, "USER"));
        } catch (IllegalArgumentException e) { return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage())); }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            HttpServletResponse response) {
        if (refreshToken == null || refreshToken.isBlank())
            return ResponseEntity.status(401).body(new ErrorResponse("No refresh token"));
        try {
            AuthService.AuthResponse auth = authService.refreshToken(refreshToken);
            setRefreshCookie(response, auth.getRefreshToken());
            return ResponseEntity.ok(toResponse(auth, "USER"));
        } catch (Exception e) {
            clearRefreshCookie(response);
            return ResponseEntity.status(401).body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletResponse response) {
        if (authHeader != null && authHeader.startsWith("Bearer "))
            authService.logout(authHeader.substring(7));
        clearRefreshCookie(response);
        return ResponseEntity.ok(new MessageResponse("Logged out successfully"));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            return ResponseEntity.status(401).body(new ErrorResponse("Invalid authorization header"));
        return authService.verifyToken(authHeader.substring(7))
                ? ResponseEntity.ok(new MessageResponse("Token is valid"))
                : ResponseEntity.status(401).body(new ErrorResponse("Invalid token"));
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(
            @RequestBody GoogleLoginRequest req, HttpServletResponse response) {
        try {
            AuthService.AuthResponse auth = authService.googleLogin(req.getIdToken());
            setRefreshCookie(response, auth.getRefreshToken());
            return ResponseEntity.ok(toResponse(auth, "USER"));
        } catch (InvalidCredentialsException e) { return ResponseEntity.status(401).body(new ErrorResponse(e.getMessage())); }
          catch (Exception e)                   { return ResponseEntity.status(500).body(new ErrorResponse("Google login failed")); }
    }

    @PostMapping("/facebook")
    public ResponseEntity<?> facebookLogin() {
        return ResponseEntity.ok(new MessageResponse("Facebook login not yet implemented"));
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public static class AccessTokenResponse {
        private String message, token, email, role, authProvider;
        private Long   userId;

        public AccessTokenResponse(String message, String token,
                                   Long userId, String email,
                                   String role, String authProvider) {
            this.message      = message;  this.token    = token;
            this.userId       = userId;   this.email    = email;
            this.role         = role;     this.authProvider = authProvider;
        }

        public String getMessage()      { return message; }
        public String getToken()        { return token; }
        public Long   getUserId()       { return userId; }
        public String getEmail()        { return email; }
        public String getRole()         { return role; }
        public String getAuthProvider() { return authProvider; }
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

    public static class LoginRequest {
        private String email, password;
        public String getEmail()    { return email; }
        public void setEmail(String v)    { this.email = v; }
        public String getPassword() { return password; }
        public void setPassword(String v) { this.password = v; }
    }

    public static class RegisterRequest {
        private String email, password, firstName, lastName;
        public String getEmail()     { return email; }      public void setEmail(String v)     { email = v; }
        public String getPassword()  { return password; }   public void setPassword(String v)  { password = v; }
        public String getFirstName() { return firstName; }  public void setFirstName(String v) { firstName = v; }
        public String getLastName()  { return lastName; }   public void setLastName(String v)  { lastName = v; }
    }

    public static class GoogleLoginRequest {
        private String idToken;
        public String getIdToken() { return idToken; }
        public void setIdToken(String v) { idToken = v; }
    }
}