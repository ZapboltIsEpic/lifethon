package com.example.lifethon.service;

import com.example.lifethon.entity.*;
import com.example.lifethon.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserTaskRepository userTaskRepository;
    private final UserRepository userRepository;
    private final CoinService coinService;

    // ── Fetch ──────────────────────────────────────────────────────────────────

    /**
     * Returns all tasks visible to the user:
     *  - Active system tasks (admin-created)
     *  - Active tasks created by this user
     * Each is enriched with the user's current completion status.
     */
    public List<TaskDTO> getTasksForUser(Long userId) {
        List<Task> systemTasks = taskRepository.findByIsActiveTrue()
            .stream()
            .filter(t -> t.getCreatedBy() == null)
            .collect(Collectors.toList());

        List<Task> userTasks = taskRepository.findByCreatedByIdAndIsActiveTrue(userId);

        systemTasks.addAll(userTasks);

        return systemTasks.stream()
            .map(task -> toDTO(task, userId))
            .collect(Collectors.toList());
    }

    // ── Create ─────────────────────────────────────────────────────────────────

    @Transactional
    public TaskDTO createTask(Long userId, CreateTaskRequest req) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        Task task = new Task();
        task.setTitle(req.getTitle());
        task.setDescription(req.getDescription());
        task.setCategory(Task.Category.valueOf(req.getCategory()));
        task.setDifficulty(Task.Difficulty.valueOf(req.getDifficulty()));
        task.setTaskType(Task.TaskType.CUSTOM); // user-created tasks are always CUSTOM
        task.setDueDate(req.getDueDate());
        task.setRepeatSchedule(req.getRepeatSchedule());
        task.setCreatedBy(user);
        task.setIsActive(true);

        // Reward based on difficulty
        switch (task.getDifficulty()) {
            case EASY   -> { task.setCoinReward(10);  task.setGachaPullReward(0); }
            case MEDIUM -> { task.setCoinReward(25);  task.setGachaPullReward(0); }
            case HARD   -> { task.setCoinReward(50);  task.setGachaPullReward(1); }
        }

        Task saved = taskRepository.save(task);

        // Auto-assign to the creator
        UserTask userTask = new UserTask();
        userTask.setUser(user);
        userTask.setTask(saved);
        userTask.setStatus(UserTask.Status.PENDING);
        userTaskRepository.save(userTask);

        return toDTO(saved, userId);
    }

    // ── Complete ───────────────────────────────────────────────────────────────

    @Transactional
    public CompleteTaskResult completeTask(Long userId, Long taskId) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));

        // Guard: already completed in current period?
        if (task.getTaskType() == Task.TaskType.DAILY) {
            LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
            if (userTaskRepository.findCompletedSince(userId, taskId, startOfDay).isPresent()) {
                throw new RuntimeException("Daily task already completed today");
            }
        } else if (task.getTaskType() == Task.TaskType.WEEKLY) {
            LocalDateTime startOfWeek = LocalDate.now()
                .with(DayOfWeek.MONDAY).atStartOfDay();
            if (userTaskRepository.findCompletedSince(userId, taskId, startOfWeek).isPresent()) {
                throw new RuntimeException("Weekly task already completed this week");
            }
        }

        // Find or create the UserTask record
        UserTask userTask = userTaskRepository.findByUserIdAndTaskId(userId, taskId)
            .orElseGet(() -> {
                User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
                UserTask ut = new UserTask();
                ut.setUser(user);
                ut.setTask(task);
                return ut;
            });

        userTask.setStatus(UserTask.Status.COMPLETED);
        userTask.setCompletedAt(LocalDateTime.now());
        userTaskRepository.save(userTask);

        // Credit coin reward
        coinService.awardTaskCompletion(userId, task.getCoinReward());

        // Credit gacha pull tickets as coins (100 coins = 1 pull)
        if (task.getGachaPullReward() != null && task.getGachaPullReward() > 0) {
            coinService.addCoins(userId, task.getGachaPullReward() * 100, "Gacha pull reward from task");
        }

        return new CompleteTaskResult(
            task.getTitle(),
            task.getCoinReward(),
            task.getGachaPullReward()
        );
    }

    // ── Delete (user's own custom tasks only) ─────────────────────────────────

    @Transactional
    public void deleteTask(Long userId, Long taskId) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));

        if (task.getCreatedBy() == null || !task.getCreatedBy().getId().equals(userId)) {
            throw new RuntimeException("You can only delete your own tasks");
        }

        task.setIsActive(false);
        taskRepository.save(task);
    }

    // ── DTO conversion ─────────────────────────────────────────────────────────

    private TaskDTO toDTO(Task task, Long userId) {
        UserTask.Status status = userTaskRepository
            .findByUserIdAndTaskId(userId, task.getId())
            .map(UserTask::getStatus)
            .orElse(UserTask.Status.PENDING);

        boolean isOwned = task.getCreatedBy() != null &&
            task.getCreatedBy().getId().equals(userId);

        return new TaskDTO(
            task.getId(),
            task.getTitle(),
            task.getDescription(),
            task.getCategory(),
            task.getDifficulty(),
            task.getTaskType(),
            task.getCoinReward(),
            task.getGachaPullReward(),
            task.getDueDate(),
            task.getRepeatSchedule(),
            status,
            isOwned
        );
    }

    // ── DTOs ───────────────────────────────────────────────────────────────────

    public static class TaskDTO {
        private Long id;
        private String title;
        private String description;
        private Task.Category category;
        private Task.Difficulty difficulty;
        private Task.TaskType taskType;
        private Integer coinReward;
        private Integer gachaPullReward;
        private java.time.LocalDateTime dueDate;
        private String repeatSchedule;
        private UserTask.Status status;
        private Boolean isOwned; // true = user created this task

        public TaskDTO(Long id, String title, String description, Task.Category category,
                       Task.Difficulty difficulty, Task.TaskType taskType,
                       Integer coinReward, Integer gachaPullReward,
                       java.time.LocalDateTime dueDate, String repeatSchedule,
                       UserTask.Status status, Boolean isOwned) {
            this.id = id; this.title = title; this.description = description;
            this.category = category; this.difficulty = difficulty;
            this.taskType = taskType; this.coinReward = coinReward;
            this.gachaPullReward = gachaPullReward; this.dueDate = dueDate;
            this.repeatSchedule = repeatSchedule; this.status = status;
            this.isOwned = isOwned;
        }

        public Long getId() { return id; }
        public String getTitle() { return title; }
        public String getDescription() { return description; }
        public Task.Category getCategory() { return category; }
        public Task.Difficulty getDifficulty() { return difficulty; }
        public Task.TaskType getTaskType() { return taskType; }
        public Integer getCoinReward() { return coinReward; }
        public Integer getGachaPullReward() { return gachaPullReward; }
        public java.time.LocalDateTime getDueDate() { return dueDate; }
        public String getRepeatSchedule() { return repeatSchedule; }
        public UserTask.Status getStatus() { return status; }
        public Boolean getIsOwned() { return isOwned; }
    }

    public static class CreateTaskRequest {
        private String title;
        private String description;
        private String category;
        private String difficulty;
        private java.time.LocalDateTime dueDate;
        private String repeatSchedule;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getDifficulty() { return difficulty; }
        public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
        public java.time.LocalDateTime getDueDate() { return dueDate; }
        public void setDueDate(java.time.LocalDateTime dueDate) { this.dueDate = dueDate; }
        public String getRepeatSchedule() { return repeatSchedule; }
        public void setRepeatSchedule(String repeatSchedule) { this.repeatSchedule = repeatSchedule; }
    }

    public static class CompleteTaskResult {
        private String taskTitle;
        private Integer coinsEarned;
        private Integer gachaPullsEarned;

        public CompleteTaskResult(String taskTitle, Integer coinsEarned, Integer gachaPullsEarned) {
            this.taskTitle = taskTitle;
            this.coinsEarned = coinsEarned;
            this.gachaPullsEarned = gachaPullsEarned;
        }

        public String getTaskTitle() { return taskTitle; }
        public Integer getCoinsEarned() { return coinsEarned; }
        public Integer getGachaPullsEarned() { return gachaPullsEarned; }
    }
}