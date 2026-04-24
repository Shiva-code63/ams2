package com.ams.controller;

import com.ams.api.ApiResponse;
import com.ams.dto.StudentDtos;
import com.ams.entity.Student;
import com.ams.repository.StudentRepository;
import com.ams.security.AppRole;
import com.ams.security.SecurityUtils;
import com.ams.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
public class StudentController {
  private final StudentService studentService;
  private final StudentRepository studentRepository;

  public StudentController(StudentService studentService, StudentRepository studentRepository) {
    this.studentService = studentService;
    this.studentRepository = studentRepository;
  }

  @PostMapping("/students")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<StudentDtos.StudentProfileResponse> create(@Valid @RequestBody StudentDtos.CreateStudentRequest req) {
    Student s = studentService.createStudent(req);
    return ApiResponse.ok("Student created. Default password = enrollment number.", studentService.getProfile(s.getId()));
  }

  @GetMapping("/students/{studentId}")
  public ApiResponse<StudentDtos.StudentProfileResponse> get(@PathVariable Long studentId) {
    var user = SecurityUtils.currentUser();
    if (user.role() == AppRole.STUDENT && !user.userId().equals(studentId)) {
      return ApiResponse.ok(studentService.getProfile(user.userId()));
    }
    return ApiResponse.ok(studentService.getProfile(studentId));
  }

  @PutMapping("/students/{studentId}")
  public ApiResponse<Void> update(@PathVariable Long studentId, @RequestBody StudentDtos.UpdateStudentProfileRequest req) {
    var user = SecurityUtils.currentUser();
    if (user.role() == AppRole.STUDENT && !user.userId().equals(studentId)) {
      studentId = user.userId();
    }
    studentService.updateProfile(studentId, req);
    return ApiResponse.ok("Updated", null);
  }

  @GetMapping("/dashboard/student/{studentId}")
  public ApiResponse<StudentDtos.StudentDashboardResponse> dashboard(@PathVariable Long studentId) {
    var user = SecurityUtils.currentUser();
    if (user.role() == AppRole.STUDENT && !user.userId().equals(studentId)) studentId = user.userId();
    return ApiResponse.ok(studentService.dashboard(studentId));
  }

  @DeleteMapping("/students/{studentId}")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> delete(@PathVariable Long studentId) {
    studentService.deleteStudent(studentId);
    return ApiResponse.ok("Student deleted", null);
  }
}

