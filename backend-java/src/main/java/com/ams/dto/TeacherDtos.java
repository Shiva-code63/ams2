package com.ams.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public final class TeacherDtos {
  private TeacherDtos() {}

  public record CreateTeacherRequest(@NotBlank String name, @NotBlank String employeeId, @Email @NotBlank String email) {}

  public record TeacherProfileResponse(Long id, String name, String employeeId, String email, String phoneNumber) {}

  public record UpdateTeacherProfileRequest(String name, String phoneNumber) {}

  public record TeacherDashboardResponse(long subjectsTaught, long totalStudents, long sessionsCreated) {}
}

