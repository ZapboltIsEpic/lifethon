package com.example.lifethon.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Difficulty difficulty;

    @Enumerated(EnumType.STRING)
    @Column(name = "task_type", nullable = false, length = 10)
    private TaskType taskType;

    @Column(name = "coin_reward", nullable = false)
    private Integer coinReward = 0;

    @Column(name = "gacha_pull_reward", nullable = false)
    private Integer gachaPullReward = 0;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    /**
     * For CUSTOM tasks: free-text schedule description (e.g. "Every Monday morning")
     * For DAILY/WEEKLY: managed automatically by reset logic
     */
    @Column(name = "repeat_schedule", length = 200)
    private String repeatSchedule;

    /** null = created by admin/system; set = user-created task */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Enums ──────────────────────────────────────────────────────────────────

    public enum Category {
        FITNESS, STUDY, HEALTH, SOCIAL, WORK, OTHER
    }

    public enum Difficulty {
        EASY, MEDIUM, HARD
    }

    public enum TaskType {
        DAILY, WEEKLY, CUSTOM
    }
}