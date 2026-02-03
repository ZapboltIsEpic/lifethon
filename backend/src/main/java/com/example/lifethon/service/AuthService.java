package com.example.lifethon.service;

import com.example.lifethon.entity.User;
import com.example.lifethon.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

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
        
        // TODO: Replace with proper password hashing verification (BCrypt)
        // For now, using plain text comparison (NOT SECURE - fix this!)
        if (!password.equals(user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        // Generate token and return user info
        String token = generateToken(user);
        return new AuthResponse(
            "Login successful",
            token,
            user.getId(),
            user.getEmail()
        );
    }

    public AuthResponse register(String username, String email, String password, String firstName, String lastName) {
        // Validate input
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Create new user
        User newUser = new User();
        newUser.setEmail(email);
        // TODO: Hash password with BCrypt before saving
        newUser.setPassword(password); // NOT SECURE - needs hashing!
        newUser.setFirstName(firstName);
        newUser.setLastName(lastName);
        newUser.setIsActive(true);

        // Save to database
        User savedUser = userRepository.save(newUser);

        // Generate token and return response
        String token = generateToken(savedUser);
        return new AuthResponse(
            "Registration successful",
            token,
            savedUser.getId(),
            savedUser.getEmail()
        );
    }

    private String generateToken(User user) {
        // TODO: Implement JWT token generation with proper library
        // This is a placeholder - DO NOT USE IN PRODUCTION
        return "Bearer_" + user.getEmail() + "_" + System.currentTimeMillis();
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
        private Long userId;
        private String email;

        public AuthResponse(String message, String token, Long userId, String email) {
            this.message = message;
            this.token = token;
            this.userId = userId;
            this.email = email;
        }

        // Getters and Setters
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }
}