package com.ams.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public final class StudentDtos {
  private StudentDtos() {}

  public record CreateStudentRequest(@NotBlank String name, @NotBlank String enrollmentNumber) {}

  public record StudentSummary(Long id, String name, String enrollmentNumber, String collegeEmail, Double attendancePercentage) {}

  public record StudentProfileResponse(
    Long id,
    String name,
    String enrollmentNumber,
    String collegeEmail,
    String studentPhoneNumber,
    String dob,
    String fatherName,
    String motherName,
    String fatherPhoneNumber,
    String motherPhoneNumber,
    String address
  ) {}

  public record UpdateStudentProfileRequest(
    String studentPhoneNumber,
    String dob,
    String fatherName,
    String motherName,
    String fatherPhoneNumber,
    String motherPhoneNumber,
    String address
  ) {}

  public record StudentDashboardResponse(
    double attendancePercentage,
    long subjectsEnrolled,
    List<AttendanceDtos.AttendanceRow> recentAttendance
  ) {}
}

