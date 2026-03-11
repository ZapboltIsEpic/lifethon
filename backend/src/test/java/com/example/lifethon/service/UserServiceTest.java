package com.example.lifethon.service;

import com.example.lifethon.entity.User;
import com.example.lifethon.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService")
class UserServiceTest {

    @Mock UserRepository userRepository;
    @InjectMocks UserService userService;

    private User buildUser(Long id, String email) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        u.setPassword("$2a$hashed");
        u.setFirstName("Alice");
        u.setLastName("Smith");
        u.setIsActive(true);
        u.setRole(User.Role.USER);
        u.setAuthProvider(User.AuthProvider.LOCAL);
        return u;
    }

    // ── createUser ────────────────────────────────────────────────────────────

    @Nested @DisplayName("createUser()")
    class CreateUser {

        @Test @DisplayName("saves and returns new user")
        void success() {
            User input = buildUser(null, "new@example.com");
            User saved = buildUser(1L, "new@example.com");

            when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
            when(userRepository.save(input)).thenReturn(saved);

            User result = userService.createUser(input);

            assertThat(result.getId()).isEqualTo(1L);
            verify(userRepository).save(input);
        }

        @Test @DisplayName("throws when email already registered")
        void duplicateEmail() {
            User input = buildUser(null, "taken@example.com");
            when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

            assertThatThrownBy(() -> userService.createUser(input))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("already exists");

            verify(userRepository, never()).save(any());
        }
    }

    // ── getUserById ───────────────────────────────────────────────────────────

    @Nested @DisplayName("getUserById()")
    class GetUserById {

        @Test @DisplayName("returns user when found")
        void found() {
            User user = buildUser(1L, "a@b.com");
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));

            Optional<User> result = userService.getUserById(1L);

            assertThat(result).isPresent().contains(user);
        }

        @Test @DisplayName("returns empty when not found")
        void notFound() {
            when(userRepository.findById(99L)).thenReturn(Optional.empty());

            assertThat(userService.getUserById(99L)).isEmpty();
        }
    }

    // ── getAllUsers ───────────────────────────────────────────────────────────

    @Nested @DisplayName("getAllUsers()")
    class GetAllUsers {

        @Test @DisplayName("returns all users")
        void returnsList() {
            List<User> users = List.of(
                buildUser(1L, "a@b.com"),
                buildUser(2L, "c@d.com")
            );
            when(userRepository.findAll()).thenReturn(users);

            assertThat(userService.getAllUsers()).hasSize(2);
        }

        @Test @DisplayName("returns empty list when no users")
        void emptyList() {
            when(userRepository.findAll()).thenReturn(List.of());
            assertThat(userService.getAllUsers()).isEmpty();
        }
    }

    // ── updateUser ────────────────────────────────────────────────────────────

    @Nested @DisplayName("updateUser()")
    class UpdateUser {

        @Test @DisplayName("updates and returns user")
        void success() {
            User existing = buildUser(1L, "old@example.com");
            User updates  = buildUser(null, "new@example.com");
            updates.setFirstName("Bob");
            updates.setLastName("Jones");

            when(userRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            User result = userService.updateUser(1L, updates);

            assertThat(result.getEmail()).isEqualTo("new@example.com");
            assertThat(result.getFirstName()).isEqualTo("Bob");
        }

        @Test @DisplayName("throws when user not found")
        void notFound() {
            when(userRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.updateUser(99L, new User()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
        }
    }

    // ── deleteUser ────────────────────────────────────────────────────────────

    @Nested @DisplayName("deleteUser()")
    class DeleteUser {

        @Test @DisplayName("deletes existing user")
        void success() {
            when(userRepository.existsById(1L)).thenReturn(true);

            userService.deleteUser(1L);

            verify(userRepository).deleteById(1L);
        }

        @Test @DisplayName("throws when user not found")
        void notFound() {
            when(userRepository.existsById(99L)).thenReturn(false);

            assertThatThrownBy(() -> userService.deleteUser(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");

            verify(userRepository, never()).deleteById(any());
        }
    }
}