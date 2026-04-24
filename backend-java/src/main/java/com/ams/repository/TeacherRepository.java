package com.ams.repository;

import com.ams.entity.Teacher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
  Optional<Teacher> findByEmailIgnoreCase(String email);

  Page<Teacher> findByNameContainingIgnoreCaseOrEmployeeIdContainingIgnoreCaseOrEmailContainingIgnoreCase(
    String name, String employeeId, String email, Pageable pageable);
}

