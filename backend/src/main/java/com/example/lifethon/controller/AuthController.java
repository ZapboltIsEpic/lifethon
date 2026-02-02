package com.example.lifethon.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private com.example.lifethon.service.AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            String token = authService.authenticate(request.getEmail(), request.getPassword());
            return ResponseEntity.ok(new AuthResponse("Login successful", token));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage()));
        } catch (com.example.lifethon.service.InvalidCredentialsException e) {
            return ResponseEntity.status(401).body(new ErrorResponse("Invalid email or password"));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin() {
        String token = authService.googleLogin();
        return ResponseEntity.ok(new AuthResponse("Google login successful", token));
    }

    @PostMapping("/facebook")
    public ResponseEntity<?> facebookLogin() {
        String token = authService.facebookLogin();
        return ResponseEntity.ok(new AuthResponse("Facebook login successful", token));
    }

    // DTOs
    public static class ErrorResponse {
        private String error;
        public ErrorResponse(String error) {
            this.error = error;
        }
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }

    public static class LoginRequest {
        private String email;
        private String password;
        // getters and setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class AuthResponse {
        private String message;
        private String token;
        public AuthResponse(String message, String token) {
            this.message = message;
            this.token = token;
        }
        // getters and setters
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
    }
}