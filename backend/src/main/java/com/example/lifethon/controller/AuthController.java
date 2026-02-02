package com.example.lifethon.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // Authenticate user with email and password
        // If successful, return user info or token
        // If failed, return error response
        // Example:
        if ("user@example.com".equals(request.getEmail()) && "password".equals(request.getPassword())) {
            return ResponseEntity.ok(new AuthResponse("Login successful", "dummy-token"));
        } else {
            return ResponseEntity.status(401).body("Invalid credentials");
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin() {
        // Handle Google OAuth login flow here
        // For demo, just return success
        return ResponseEntity.ok(new AuthResponse("Google login successful", "google-dummy-token"));
    }

    @PostMapping("/facebook")
    public ResponseEntity<?> facebookLogin() {
        // Handle Facebook OAuth login flow here
        // For demo, just return success
        return ResponseEntity.ok(new AuthResponse("Facebook login successful", "facebook-dummy-token"));
    }

    // DTOs
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