package com.ams.controller;

import com.ams.api.ApiResponse;
import com.ams.dto.AdminDtos;
import com.ams.dto.StudentDtos;
import com.ams.dto.TeacherDtos;
import com.ams.repository.AttendanceRepository;
import com.ams.entity.Student;
import com.ams.entity.Teacher;
import com.ams.repository.StudentRepository;
import com.ams.repository.TeacherRepository;
import com.ams.service.AdminService;
import com.ams.service.DashboardService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
  private final DashboardService dashboardService;
  private final AdminService adminService;
  private final StudentRepository studentRepository;
  private final TeacherRepository teacherRepository;
  private final AttendanceRepository attendanceRepository;

  public AdminController(DashboardService dashboardService,
                         AdminService adminService,
                         StudentRepository studentRepository,
                         TeacherRepository teacherRepository,
                         AttendanceRepository attendanceRepository) {
    this.dashboardService = dashboardService;
    this.adminService = adminService;
    this.studentRepository = studentRepository;
    this.teacherRepository = teacherRepository;
    this.attendanceRepository = attendanceRepository;
  }

  @GetMapping("/dashboard-stats")
  public ApiResponse<AdminDtos.DashboardStats> stats() {
    return ApiResponse.ok(dashboardService.adminStats());
  }

  @GetMapping("/profile/{adminId}")
  public ApiResponse<AdminDtos.AdminProfileResponse> profile(@PathVariable Long adminId) {
    return ApiResponse.ok(adminService.getProfile(adminId));
  }

  @PutMapping("/profile/{adminId}")
  public ApiResponse<Void> updateProfile(@PathVariable Long adminId, @Valid @RequestBody AdminDtos.UpdateAdminProfileRequest req) {
    adminService.updateProfile(adminId, req);
    return ApiResponse.ok("Updated", null);
  }

  @PostMapping("/change-password/{adminId}")
  public ApiResponse<Void> changePassword(@PathVariable Long adminId,
                                         @RequestParam String currentPassword,
                                         @RequestParam String newPassword) {
    adminService.changePassword(adminId, currentPassword, newPassword);
    return ApiResponse.ok("Password changed", null);
  }

  @GetMapping("/students")
  public ApiResponse<Page<StudentDtos.StudentSummary>> listStudents(@RequestParam(defaultValue = "0") int page,
                                                                   @RequestParam(defaultValue = "50") int size) {
    Page<StudentDtos.StudentSummary> res = studentRepository.findAll(PageRequest.of(page, size)).map(this::toStudentSummary);
    return ApiResponse.ok(res);
  }

  @GetMapping("/students/search")
  public ApiResponse<Page<StudentDtos.StudentSummary>> searchStudents(@RequestParam(defaultValue = "0") int page,
                                                                     @RequestParam(defaultValue = "50") int size,
                                                                     @RequestParam String search) {
    String q = search == null ? "" : search.trim();
    Page<StudentDtos.StudentSummary> res = studentRepository
      .findByNameContainingIgnoreCaseOrEnrollmentNumberContainingIgnoreCaseOrCollegeEmailContainingIgnoreCase(q, q, q, PageRequest.of(page, size))
      .map(this::toStudentSummary);
    return ApiResponse.ok(res);
  }

  @GetMapping("/teachers")
  public ApiResponse<Page<TeacherDtos.TeacherProfileResponse>> listTeachers(@RequestParam(defaultValue = "0") int page,
                                                                           @RequestParam(defaultValue = "50") int size) {
    Page<TeacherDtos.TeacherProfileResponse> res = teacherRepository.findAll(PageRequest.of(page, size)).map(this::toTeacherResponse);
    return ApiResponse.ok(res);
  }

  @GetMapping("/teachers/search")
  public ApiResponse<Page<TeacherDtos.TeacherProfileResponse>> searchTeachers(@RequestParam(defaultValue = "0") int page,
                                                                             @RequestParam(defaultValue = "50") int size,
                                                                             @RequestParam String search) {
    String q = search == null ? "" : search.trim();
    Page<TeacherDtos.TeacherProfileResponse> res = teacherRepository
      .findByNameContainingIgnoreCaseOrEmployeeIdContainingIgnoreCaseOrEmailContainingIgnoreCase(q, q, q, PageRequest.of(page, size))
      .map(this::toTeacherResponse);
    return ApiResponse.ok(res);
  }

  private StudentDtos.StudentSummary toStudentSummary(Student s) {
    var all = attendanceRepository.findByStudentIdOrderByAttendanceDateDesc(s.getId(), PageRequest.of(0, 5000));
    double pct = 0.0;
    if (all.getTotalElements() > 0) {
      long present = all.stream().filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus())).count();
      pct = (present * 100.0) / all.getTotalElements();
    }
    return new StudentDtos.StudentSummary(s.getId(), s.getName(), s.getEnrollmentNumber(), s.getCollegeEmail(), pct);
  }

  private TeacherDtos.TeacherProfileResponse toTeacherResponse(Teacher t) {
    return new TeacherDtos.TeacherProfileResponse(t.getId(), t.getName(), t.getEmployeeId(), t.getEmail(), t.getPhoneNumber());
  }
}
