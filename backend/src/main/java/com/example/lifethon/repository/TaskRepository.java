package com.example.lifethon.repository;

import com.example.lifethon.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    /** All active system (admin) tasks of a given type */
    List<Task> findByTaskTypeAndCreatedByIsNullAndIsActiveTrue(Task.TaskType taskType);

    /** All active tasks created by a specific user */
    List<Task> findByCreatedByIdAndIsActiveTrue(Long userId);

    /** All active tasks (system + user-created) */
    List<Task> findByIsActiveTrue();
}