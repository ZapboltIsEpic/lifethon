package com.example.lifethon.controller;

import com.example.lifethon.service.TaskService;
import com.example.lifethon.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final JwtUtil jwtUtil;

    // ── GET /api/tasks ─────────────────────────────────────────────────────────
    // Returns all system tasks + user's own custom tasks, each with completion status
    @GetMapping
    public ResponseEntity<List<TaskService.TaskDTO>> getTasks(
            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(taskService.getTasksForUser(userId));
    }

    // ── POST /api/tasks ────────────────────────────────────────────────────────
    // Create a custom task (user-created)
    @PostMapping
    public ResponseEntity<?> createTask(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody TaskService.CreateTaskRequest request) {
        try {
            Long userId = extractUserId(authHeader);
            TaskService.TaskDTO created = taskService.createTask(userId, request);
            return ResponseEntity.status(201).body(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    // ── POST /api/tasks/{id}/complete ──────────────────────────────────────────
    // Mark a task as completed and grant rewards
    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeTask(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        try {
            Long userId = extractUserId(authHeader);
            TaskService.CompleteTaskResult result = taskService.completeTask(userId, id);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    // ── DELETE /api/tasks/{id} ─────────────────────────────────────────────────
    // Soft-delete a user's own custom task
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        try {
            Long userId = extractUserId(authHeader);
            taskService.deleteTask(userId, id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private Long extractUserId(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        return jwtUtil.extractUserId(token);
    }

    public static class ErrorResponse {
        private String error;
        public ErrorResponse(String error) { this.error = error; }
        public String getError() { return error; }
    }
}