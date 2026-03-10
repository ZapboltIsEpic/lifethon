package com.example.lifethon.service;

import com.example.lifethon.entity.User;
import com.example.lifethon.entity.User.AuthProvider;
import com.example.lifethon.repository.UserRepository;
import com.example.lifethon.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired private UserRepository  userRepository;
    @Autowired private JwtUtil         jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private OAuthService    oAuthService;

    // ── Local login ───────────────────────────────────────────────────────────

    public AuthResponse authenticate(String email, String password) {
        if (email    == null || email.trim().isEmpty())    throw new IllegalArgumentException("Email is required");
        if (password == null || password.trim().isEmpty()) throw new IllegalArgumentException("Password is required");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (user.getIsActive() == null || !user.getIsActive())
            throw new InvalidCredentialsException("Account is inactive");

        // Google-only accounts have no usable local password
        if (user.getAuthProvider() != AuthProvider.LOCAL)
            throw new InvalidCredentialsException(
                "This account uses " + user.getAuthProvider() + " login. Please sign in with that provider.");

        if (!passwordEncoder.matches(password, user.getPassword()))
            throw new InvalidCredentialsException("Invalid email or password");

        return buildResponse("Login successful", user);
    }

    // ── Registration ──────────────────────────────────────────────────────────

    public AuthResponse register(String email, String password,
                                 String firstName, String lastName) {
        if (email    == null || email.trim().isEmpty())    throw new IllegalArgumentException("Email is required");
        if (password == null || password.trim().isEmpty()) throw new IllegalArgumentException("Password is required");
        if (password.length() < 6)
            throw new IllegalArgumentException("Password must be at least 6 characters long");
        if (userRepository.existsByEmail(email))
            throw new IllegalArgumentException("Email already exists");

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setIsActive(true);
        user.setAuthProvider(AuthProvider.LOCAL);   // ← explicit

        User saved = userRepository.save(user);
        return buildResponse("Registration successful", saved);
    }

    // ── Google OAuth ──────────────────────────────────────────────────────────

    public AuthResponse googleLogin(String idToken) {
        OAuthService.GoogleUserInfo google = oAuthService.verifyGoogleToken(idToken);

        Optional<User> existing = userRepository.findByEmail(google.getEmail());

        if (existing.isPresent()) {
            User user = existing.get();
            if (user.getIsActive() == null || !user.getIsActive())
                throw new InvalidCredentialsException("Account is inactive");
            return buildResponse("Google login successful", user);
        }

        // Create new account
        User user = new User();
        user.setEmail(google.getEmail());
        user.setFirstName(google.getFirstName());
        user.setLastName(google.getLastName());
        user.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
        user.setIsActive(true);
        user.setAuthProvider(AuthProvider.GOOGLE);  // ← marks this as OAuth account

        User saved = userRepository.save(user);
        return buildResponse("Google account created and logged in", saved);
    }

    // ── Token operations ──────────────────────────────────────────────────────

    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtUtil.validateToken(refreshToken))
            throw new InvalidCredentialsException("Invalid refresh token");

        String email = jwtUtil.extractEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("User not found"));

        return buildResponse("Token refreshed successfully", user);
    }

    public boolean verifyToken(String token) { return jwtUtil.validateToken(token); }

    public void logout(String token) { /* token blacklist can be added here */ }

    public String facebookLogin() { return "facebook-dummy-token"; }

    // ── Credential changes ────────────────────────────────────────────────────

    /**
     * Change password for LOCAL accounts only.
     * Google users cannot set a local password through this endpoint.
     */
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getAuthProvider() != AuthProvider.LOCAL)
            throw new IllegalArgumentException(
                "Password change is not available for " + user.getAuthProvider() + " accounts.");

        if (!passwordEncoder.matches(currentPassword, user.getPassword()))
            throw new InvalidCredentialsException("Current password is incorrect");

        if (newPassword == null || newPassword.length() < 6)
            throw new IllegalArgumentException("New password must be at least 6 characters");

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    /**
     * Change email — requires current password for LOCAL users;
     * Google users can still change email but must confirm via re-authentication
     * (for simplicity we skip password check for GOOGLE users here).
     */
    public void changeEmail(Long userId, String newEmail, String currentPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (userRepository.existsByEmail(newEmail))
            throw new IllegalArgumentException("Email is already in use");

        // LOCAL accounts must verify current password
        if (user.getAuthProvider() == AuthProvider.LOCAL) {
            if (!passwordEncoder.matches(currentPassword, user.getPassword()))
                throw new InvalidCredentialsException("Current password is incorrect");
        }

        user.setEmail(newEmail);
        userRepository.save(user);
    }

    // ── Private helper ────────────────────────────────────────────────────────

    private AuthResponse buildResponse(String message, User user) {
        String token        = jwtUtil.generateToken(user.getEmail(), user.getId());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());
        return new AuthResponse(
            message, token, refreshToken,
            user.getId(), user.getEmail(),
            user.getAuthProvider().name()   // e.g. "LOCAL" or "GOOGLE"
        );
    }

    // ── Response DTO ──────────────────────────────────────────────────────────

    public static class AuthResponse {
        private String message, token, refreshToken, email, authProvider;
        private Long   userId;

        public AuthResponse(String message, String token, String refreshToken,
                            Long userId, String email, String authProvider) {
            this.message      = message;
            this.token        = token;
            this.refreshToken = refreshToken;
            this.userId       = userId;
            this.email        = email;
            this.authProvider = authProvider;
        }

        public String getMessage()      { return message; }
        public String getToken()        { return token; }
        public String getRefreshToken() { return refreshToken; }
        public Long   getUserId()       { return userId; }
        public String getEmail()        { return email; }
        public String getAuthProvider() { return authProvider; }
    }
}