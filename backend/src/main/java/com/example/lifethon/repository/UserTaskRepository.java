package com.example.lifethon.repository;

import com.example.lifethon.entity.UserTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserTaskRepository extends JpaRepository<UserTask, Long> {

    List<UserTask> findByUserId(Long userId);

    Optional<UserTask> findByUserIdAndTaskId(Long userId, Long taskId);

    /** Used to check if a DAILY task was already completed today */
    @Query("SELECT ut FROM UserTask ut WHERE ut.user.id = :userId AND ut.task.id = :taskId " +
           "AND ut.status = 'COMPLETED' AND ut.completedAt >= :since")
    Optional<UserTask> findCompletedSince(
        @Param("userId") Long userId,
        @Param("taskId") Long taskId,
        @Param("since") LocalDateTime since
    );

    @Query("SELECT ut FROM UserTask ut WHERE ut.user.id = :userId AND ut.completedAt >= :since AND ut.status = 'COMPLETED'")
    List<UserTask> findCompletedByUserSince(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    /** All user tasks filtered by status */
    List<UserTask> findByUserIdAndStatus(Long userId, UserTask.Status status);
}