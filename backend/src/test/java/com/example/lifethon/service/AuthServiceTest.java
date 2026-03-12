package com.example.lifethon.service;

import com.example.lifethon.entity.User;
import com.example.lifethon.repository.UserRepository;
import com.example.lifethon.util.JwtUtil;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService")
class AuthServiceTest {

    @Mock UserRepository  userRepository;
    @Mock JwtUtil         jwtUtil;
    @Mock PasswordEncoder passwordEncoder;
    @Mock OAuthService    oAuthService;

    @InjectMocks AuthService authService;

    // ── Shared fixtures ───────────────────────────────────────────────────────

    private User localUser() {
        User u = new User();
        u.setId(1L);
        u.setEmail("local@example.com");
        u.setPassword("$2a$hashed");
        u.setIsActive(true);
        u.setRole(User.Role.USER);
        u.setAuthProvider(User.AuthProvider.LOCAL);
        return u;
    }

    private User googleUser() {
        User u = new User();
        u.setId(2L);
        u.setEmail("google@example.com");
        u.setPassword("random-uuid-hash");
        u.setIsActive(true);
        u.setRole(User.Role.USER);
        u.setAuthProvider(User.AuthProvider.GOOGLE);
        return u;
    }

    @BeforeEach
    void stubJwt() {
        lenient().when(jwtUtil.generateToken(anyString(), anyLong(), any(User.Role.class))).thenReturn("access-token");
        lenient().when(jwtUtil.generateRefreshToken(anyString())).thenReturn("refresh-token");
    }

    // ── authenticate ──────────────────────────────────────────────────────────

    @Nested @DisplayName("authenticate()")
    class Authenticate {

        @Test @DisplayName("returns token for valid credentials")
        void success() {
            User user = localUser();
            when(userRepository.findByEmail("local@example.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("password123", "$2a$hashed")).thenReturn(true);

            AuthService.AuthResponse res = authService.authenticate("local@example.com", "password123");

            assertThat(res.getToken()).isEqualTo("access-token");
            assertThat(res.getEmail()).isEqualTo("local@example.com");
            assertThat(res.getAuthProvider()).isEqualTo("LOCAL");
        }

        @Test @DisplayName("throws if email is blank")
        void blankEmail() {
            assertThatThrownBy(() -> authService.authenticate("", "password"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Email is required");
        }

        @Test @DisplayName("throws if password is blank")
        void blankPassword() {
            assertThatThrownBy(() -> authService.authenticate("a@b.com", ""))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Password is required");
        }

        @Test @DisplayName("throws if user not found")
        void userNotFound() {
            when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
            assertThatThrownBy(() -> authService.authenticate("nobody@example.com", "pass"))
                .isInstanceOf(InvalidCredentialsException.class);
        }

        @Test @DisplayName("throws if account is inactive")
        void inactiveAccount() {
            User user = localUser();
            user.setIsActive(false);
            when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> authService.authenticate("local@example.com", "pass"))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessageContaining("inactive");
        }

        @Test @DisplayName("throws for Google account attempting local login")
        void googleAccountBlockedFromLocalLogin() {
            when(userRepository.findByEmail("google@example.com")).thenReturn(Optional.of(googleUser()));

            assertThatThrownBy(() -> authService.authenticate("google@example.com", "pass"))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessageContaining("GOOGLE");
        }

        @Test @DisplayName("throws if password is wrong")
        void wrongPassword() {
            when(userRepository.findByEmail("local@example.com")).thenReturn(Optional.of(localUser()));
            when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

            assertThatThrownBy(() -> authService.authenticate("local@example.com", "wrong"))
                .isInstanceOf(InvalidCredentialsException.class);
        }
    }

    // ── register ──────────────────────────────────────────────────────────────

    @Nested @DisplayName("register()")
    class Register {

        @Test @DisplayName("creates user and returns token")
        void success() {
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("$2a$hashed-new");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                u.setId(99L);
                return u;
            });

            AuthService.AuthResponse res = authService.register(
                "new@example.com", "password123", "Alice", "Smith");

            assertThat(res.getEmail()).isEqualTo("new@example.com");
            assertThat(res.getAuthProvider()).isEqualTo("LOCAL");
            verify(userRepository).save(argThat(u ->
                u.getAuthProvider() == User.AuthProvider.LOCAL &&
                u.getEmail().equals("new@example.com")));
        }

        @Test @DisplayName("throws if email already exists")
        void emailAlreadyExists() {
            when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

            assertThatThrownBy(() ->
                authService.register("taken@example.com", "pass123", "A", "B"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already exists");
        }

        @Test @DisplayName("throws if password shorter than 6 characters")
        void passwordTooShort() {
            assertThatThrownBy(() ->
                authService.register("a@b.com", "abc", "A", "B"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("6 characters");
        }

        @Test @DisplayName("throws if email is null")
        void nullEmail() {
            assertThatThrownBy(() -> authService.register(null, "pass123", "A", "B"))
                .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // ── googleLogin ───────────────────────────────────────────────────────────

    @Nested @DisplayName("googleLogin()")
    class GoogleLogin {

        private OAuthService.GoogleUserInfo googleInfo() {
            return new OAuthService.GoogleUserInfo(
                "google@example.com", "Google", "User", "https://pic.url");
        }

        @Test @DisplayName("logs in existing Google user")
        void existingUser() {
            when(oAuthService.verifyGoogleToken("id-token")).thenReturn(googleInfo());
            when(userRepository.findByEmail("google@example.com"))
                .thenReturn(Optional.of(googleUser()));

            AuthService.AuthResponse res = authService.googleLogin("id-token");

            assertThat(res.getEmail()).isEqualTo("google@example.com");
            assertThat(res.getAuthProvider()).isEqualTo("GOOGLE");
            verify(userRepository, never()).save(any());
        }

        @Test @DisplayName("creates new user on first Google login")
        void newUser() {
            when(oAuthService.verifyGoogleToken("id-token")).thenReturn(googleInfo());
            when(userRepository.findByEmail("google@example.com")).thenReturn(Optional.empty());
            when(passwordEncoder.encode(anyString())).thenReturn("hashed-random");
            when(userRepository.save(any())).thenAnswer(inv -> {
                User u = inv.getArgument(0); u.setId(10L); return u;
            });

            AuthService.AuthResponse res = authService.googleLogin("id-token");

            assertThat(res.getAuthProvider()).isEqualTo("GOOGLE");
            verify(userRepository).save(argThat(u ->
                u.getAuthProvider() == User.AuthProvider.GOOGLE));
        }

        @Test @DisplayName("throws if existing Google user is inactive")
        void inactiveGoogleUser() {
            User inactive = googleUser();
            inactive.setIsActive(false);
            when(oAuthService.verifyGoogleToken("id-token")).thenReturn(googleInfo());
            when(userRepository.findByEmail("google@example.com"))
                .thenReturn(Optional.of(inactive));

            assertThatThrownBy(() -> authService.googleLogin("id-token"))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessageContaining("inactive");
        }
    }

    // ── changePassword ────────────────────────────────────────────────────────

    @Nested @DisplayName("changePassword()")
    class ChangePassword {

        @Test @DisplayName("updates password for LOCAL user")
        void success() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(localUser()));
            when(passwordEncoder.matches("oldpass", "$2a$hashed")).thenReturn(true);
            when(passwordEncoder.encode("newpass1")).thenReturn("$2a$new-hashed");

            authService.changePassword(1L, "oldpass", "newpass1");

            verify(userRepository).save(argThat(u ->
                u.getPassword().equals("$2a$new-hashed")));
        }

        @Test @DisplayName("throws for GOOGLE account")
        void blockedForGoogleUser() {
            when(userRepository.findById(2L)).thenReturn(Optional.of(googleUser()));

            assertThatThrownBy(() -> authService.changePassword(2L, "any", "newpass1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("GOOGLE");
        }

        @Test @DisplayName("throws if current password is wrong")
        void wrongCurrentPassword() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(localUser()));
            when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

            assertThatThrownBy(() -> authService.changePassword(1L, "wrong", "newpass1"))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessageContaining("incorrect");
        }

        @Test @DisplayName("throws if new password is too short")
        void newPasswordTooShort() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(localUser()));
            when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

            assertThatThrownBy(() -> authService.changePassword(1L, "oldpass", "abc"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("6 characters");
        }

        @Test @DisplayName("throws if user not found")
        void userNotFound() {
            when(userRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.changePassword(99L, "old", "newpass1"))
                .isInstanceOf(RuntimeException.class);
        }
    }

    // ── changeEmail ───────────────────────────────────────────────────────────

    @Nested @DisplayName("changeEmail()")
    class ChangeEmail {

        @Test @DisplayName("updates email for LOCAL user with correct password")
        void successLocal() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(localUser()));
            when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
            when(passwordEncoder.matches("password123", "$2a$hashed")).thenReturn(true);

            authService.changeEmail(1L, "new@example.com", "password123");

            verify(userRepository).save(argThat(u ->
                u.getEmail().equals("new@example.com")));
        }

        @Test @DisplayName("updates email for GOOGLE user without password check")
        void successGoogle() {
            when(userRepository.findById(2L)).thenReturn(Optional.of(googleUser()));
            when(userRepository.existsByEmail("newemail@example.com")).thenReturn(false);

            authService.changeEmail(2L, "newemail@example.com", null);

            verify(passwordEncoder, never()).matches(any(), any());
            verify(userRepository).save(argThat(u ->
                u.getEmail().equals("newemail@example.com")));
        }

        @Test @DisplayName("throws if new email is already taken")
        void emailTaken() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(localUser()));
            when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

            assertThatThrownBy(() -> authService.changeEmail(1L, "taken@example.com", "pass"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already in use");
        }

        @Test @DisplayName("throws if LOCAL user provides wrong password")
        void wrongPasswordLocal() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(localUser()));
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

            assertThatThrownBy(() -> authService.changeEmail(1L, "new@example.com", "wrong"))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessageContaining("incorrect");
        }
    }

    // ── refreshToken ──────────────────────────────────────────────────────────

    @Nested @DisplayName("refreshToken()")
    class RefreshToken {

        @Test @DisplayName("issues new tokens for valid refresh token")
        void success() {
            when(jwtUtil.validateToken("valid-refresh")).thenReturn(true);
            when(jwtUtil.extractEmail("valid-refresh")).thenReturn("local@example.com");
            when(userRepository.findByEmail("local@example.com"))
                .thenReturn(Optional.of(localUser()));

            AuthService.AuthResponse res = authService.refreshToken("valid-refresh");

            assertThat(res.getToken()).isEqualTo("access-token");
        }

        @Test @DisplayName("throws for invalid refresh token")
        void invalidToken() {
            when(jwtUtil.validateToken("bad-token")).thenReturn(false);

            assertThatThrownBy(() -> authService.refreshToken("bad-token"))
                .isInstanceOf(InvalidCredentialsException.class);
        }
    }
}