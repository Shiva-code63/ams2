package com.ams.repository;

import com.ams.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
  Optional<Student> findByCollegeEmailIgnoreCase(String email);
  Optional<Student> findByEnrollmentNumber(String enrollmentNumber);

  Page<Student> findByNameContainingIgnoreCaseOrEnrollmentNumberContainingIgnoreCaseOrCollegeEmailContainingIgnoreCase(
    String name, String enrollmentNumber, String collegeEmail, Pageable pageable);
}
