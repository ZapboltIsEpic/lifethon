package com.example.lifethon.controller;

import com.example.lifethon.service.AuthService;
import com.example.lifethon.service.InvalidCredentialsException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Allow frontend to connect
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthService.AuthResponse response = authService.authenticate(
                request.getEmail(), 
                request.getPassword()
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage()));
        } catch (com.example.lifethon.service.InvalidCredentialsException e) {
            return ResponseEntity.status(401).body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            AuthService.AuthResponse response = authService.register(
                request.getEmail(),
                request.getPassword(),
                request.getFirstName(),
                request.getLastName()
            );
            return ResponseEntity.status(201).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyToken(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from "Bearer <token>"
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(new ErrorResponse("Invalid authorization header"));
            }
            
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            
            if (authService.verifyToken(token)) {
                return ResponseEntity.ok(new MessageResponse("Token is valid"));
            }
            
            return ResponseEntity.status(401).body(new ErrorResponse("Invalid token"));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(new ErrorResponse("Token verification failed"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract refresh token from "Bearer <token>"
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(new ErrorResponse("Invalid authorization header"));
            }
            
            String refreshToken = authHeader.substring(7);
            AuthService.AuthResponse response = authService.refreshToken(refreshToken);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(new ErrorResponse("Invalid authorization header"));
            }
            
            String token = authHeader.substring(7);
            authService.logout(token);
            
            return ResponseEntity.ok(new MessageResponse("Logged out successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Logout failed"));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequest request) {
        try {
            AuthService.AuthResponse response = authService.googleLogin(request.getIdToken());
            return ResponseEntity.ok(response);
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

    // DTOs
    public static class ErrorResponse {
        private String error;
        public ErrorResponse(String error) {
            this.error = error;
        }
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }

    public static class MessageResponse {
        private String message;
        
        public MessageResponse(String message) {
            this.message = message;
        }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class LoginRequest {
        private String email;
        private String password;
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RegisterRequest {
        private String username;
        private String email;
        private String password;
        private String firstName;
        private String lastName;
        
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
    }

    public static class SimpleAuthResponse {
        private String message;
        private String token;
        
        public SimpleAuthResponse(String message, String token) {
            this.message = message;
            this.token = token;
        }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
    }

    public static class GoogleLoginRequest {
        private String idToken;
        
        public String getIdToken() { return idToken; }
        public void setIdToken(String idToken) { this.idToken = idToken; }
    }
}