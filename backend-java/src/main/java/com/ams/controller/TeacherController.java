package com.ams.controller;

import com.ams.api.ApiResponse;
import com.ams.dto.TeacherDtos;
import com.ams.entity.Teacher;
import com.ams.repository.TeacherRepository;
import com.ams.security.AppRole;
import com.ams.security.SecurityUtils;
import com.ams.service.QrService;
import com.ams.service.TeacherService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
public class TeacherController {
  private final TeacherRepository teacherRepository;
  private final PasswordEncoder passwordEncoder;
  private final TeacherService teacherService;
  private final QrService qrService;

  public TeacherController(TeacherRepository teacherRepository,
                           PasswordEncoder passwordEncoder,
                           TeacherService teacherService,
                           QrService qrService) {
    this.teacherRepository = teacherRepository;
    this.passwordEncoder = passwordEncoder;
    this.teacherService = teacherService;
    this.qrService = qrService;
  }

  @PostMapping("/teachers")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<TeacherDtos.TeacherProfileResponse> create(@Valid @RequestBody TeacherDtos.CreateTeacherRequest req) {
    Teacher t = new Teacher();
    t.setName(req.name().trim());
    t.setEmployeeId(req.employeeId().trim());
    t.setEmail(req.email().trim());

    String hash = passwordEncoder.encode(t.getEmployeeId());
    t.setPasswordHash(hash);
    t.setPassword(hash);
    t.setRole("TEACHER");
    teacherRepository.save(t);
    return ApiResponse.ok("Teacher created. Default password = employee ID.", teacherService.getTeacher(t.getId()));
  }

  @GetMapping("/teachers/{teacherId}")
  public ApiResponse<TeacherDtos.TeacherProfileResponse> get(@PathVariable Long teacherId) {
    var user = SecurityUtils.currentUser();
    if (user.role() == AppRole.TEACHER && !user.userId().equals(teacherId)) teacherId = user.userId();
    return ApiResponse.ok(teacherService.getTeacher(teacherId));
  }

  @PutMapping("/teachers/{teacherId}")
  public ApiResponse<Void> update(@PathVariable Long teacherId, @RequestBody TeacherDtos.UpdateTeacherProfileRequest req) {
    var user = SecurityUtils.currentUser();
    if (user.role() == AppRole.TEACHER && !user.userId().equals(teacherId)) teacherId = user.userId();
    teacherService.updateTeacher(teacherId, req);
    return ApiResponse.ok("Updated", null);
  }

  @PostMapping("/teachers/change-password/{teacherId}")
  public ApiResponse<Void> changePassword(@PathVariable Long teacherId,
                                         @RequestParam String currentPassword,
                                         @RequestParam String newPassword) {
    var user = SecurityUtils.currentUser();
    if (user.role() == AppRole.TEACHER && !user.userId().equals(teacherId)) teacherId = user.userId();
    teacherService.changePassword(teacherId, currentPassword, newPassword);
    return ApiResponse.ok("Password changed", null);
  }

  @GetMapping("/dashboard/teacher/{teacherId}")
  public ApiResponse<TeacherDtos.TeacherDashboardResponse> dashboard(@PathVariable Long teacherId) {
    var user = SecurityUtils.currentUser();
    if (user.role() == AppRole.TEACHER && !user.userId().equals(teacherId)) teacherId = user.userId();
    return ApiResponse.ok(teacherService.dashboard(teacherId, qrService.sessionsCreated(teacherId)));
  }

  @DeleteMapping("/teachers/{teacherId}")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> delete(@PathVariable Long teacherId) {
    teacherService.deleteTeacher(teacherId);
    return ApiResponse.ok("Teacher deleted", null);
  }
}
