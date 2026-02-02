package com.example.lifethon.service;

import org.springframework.stereotype.Service;

@Service
public class AuthService {

    public String authenticate(String email, String password) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }

        // TODO: Replace with actual database look-up & password hashing
        if ("user@example.com".equals(email) && "password".equals(password)) {
            return generateToken(email);
        }

        throw new InvalidCredentialsException("Invalid email or password");
    }

    private String generateToken(String email) {
        // TODO: Implement JWT token generation
        return "Bearer_" + email + "_" + System.currentTimeMillis();
    }

    public String googleLogin() {
        // TODO: Implement Google OAuth flow
        return "google-dummy-token";
    }

    public String facebookLogin() {
        // TODO: Implement Facebook OAuth flow
        return "facebook-dummy-token";
    }
}