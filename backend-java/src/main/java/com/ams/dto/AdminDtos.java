package com.ams.dto;

import jakarta.validation.constraints.NotBlank;

public final class AdminDtos {
  private AdminDtos() {}

  public record AdminProfileResponse(Long id, String name, String email, String phoneNumber) {}

  public record UpdateAdminProfileRequest(@NotBlank String name, String phoneNumber) {}

  public record DashboardStats(
    long totalStudents,
    long totalTeachers,
    long totalSubjects,
    long totalAttendanceRecords,
    double averageAttendance,
    long presentRecords,
    long absentRecords,
    Object weeklyTrend,
    Object monthlyAttendance
  ) {}
}

