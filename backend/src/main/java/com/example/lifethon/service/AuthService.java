package com.example.lifethon.service;

import com.example.lifethon.entity.User;
import com.example.lifethon.repository.UserRepository;
import com.example.lifethon.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public AuthResponse authenticate(String email, String password) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }

        // Look up user in database by email
        Optional<User> userOptional = userRepository.findByEmail(email);
        
        if (userOptional.isEmpty()) {
            throw new InvalidCredentialsException("Invalid email or password");
        }
        
        User user = userOptional.get();
        
        // Check if user is active
        if (user.getIsActive() == null || !user.getIsActive()) {
            throw new InvalidCredentialsException("Account is inactive");
        }
        
        // ✅ FIXED: Use BCrypt to verify password
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        // Generate JWT token using JwtUtil
        String token = jwtUtil.generateToken(user.getEmail(), user.getId());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return new AuthResponse(
            "Login successful",
            token,
            refreshToken,
            user.getId(),
            user.getEmail()
        );
    }

    public AuthResponse register(String email, String password, String firstName, String lastName) {
        // Validate input
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }
        
        // Validate password strength (optional but recommended)
        if (password.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Create new user
        User newUser = new User();
        newUser.setEmail(email);
        
        // ✅ FIXED: Hash password with BCrypt before saving
        String hashedPassword = passwordEncoder.encode(password);
        newUser.setPassword(hashedPassword);
        
        newUser.setFirstName(firstName);
        newUser.setLastName(lastName);
        newUser.setIsActive(true);

        // Save to database
        User savedUser = userRepository.save(newUser);

        // Generate JWT token using JwtUtil
        String token = jwtUtil.generateToken(savedUser.getEmail(), savedUser.getId());
        String refreshToken = jwtUtil.generateRefreshToken(savedUser.getEmail());

        return new AuthResponse(
            "Registration successful",
            token,
            refreshToken,
            savedUser.getId(),
            savedUser.getEmail()
        );
    }

    public AuthResponse refreshToken(String refreshToken) {
        try {
            // Validate the refresh token
            if (jwtUtil.validateToken(refreshToken)) {
                String email = jwtUtil.extractEmail(refreshToken);
                Optional<User> userOptional = userRepository.findByEmail(email);
                
                if (userOptional.isPresent()) {
                    User user = userOptional.get();
                    
                    // Generate new tokens
                    String newToken = jwtUtil.generateToken(user.getEmail(), user.getId());
                    String newRefreshToken = jwtUtil.generateRefreshToken(user.getEmail());
                    
                    return new AuthResponse(
                        "Token refreshed successfully",
                        newToken,
                        newRefreshToken,
                        user.getId(),
                        user.getEmail()
                    );
                }
            }
            throw new InvalidCredentialsException("Invalid refresh token");
        } catch (Exception e) {
            throw new InvalidCredentialsException("Invalid refresh token");
        }
    }

    public boolean verifyToken(String token) {
        return jwtUtil.validateToken(token);
    }

    public void logout(String token) {
        // TODO: Implement token blacklist if needed
        // For now, client-side removal of token is sufficient
        // In a production system, you might want to:
        // 1. Store invalidated tokens in Redis with expiration
        // 2. Check blacklist before validating tokens
    }

    public String googleLogin() {
        // TODO: Implement Google OAuth flow
        return "google-dummy-token";
    }

    public String facebookLogin() {
        // TODO: Implement Facebook OAuth flow
        return "facebook-dummy-token";
    }

    // Inner class for AuthResponse
    public static class AuthResponse {
        private String message;
        private String token;
        private String refreshToken;
        private Long userId;
        private String email;

        public AuthResponse(String message, String token, String refreshToken, Long userId, String email) {
            this.message = message;
            this.token = token;
            this.refreshToken = refreshToken;
            this.userId = userId;
            this.email = email;
        }

        // Getters and Setters
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        
        public String getRefreshToken() { return refreshToken; }
        public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
        
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }
}