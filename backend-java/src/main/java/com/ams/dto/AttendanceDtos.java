package com.ams.dto;

import java.time.LocalDate;

public final class AttendanceDtos {
  private AttendanceDtos() {}

  public record AttendanceRow(
    Long id,
    Long studentId,
    String studentName,
    String studentEnrollmentNumber,
    Long subjectId,
    String subjectName,
    String subjectCode,
    LocalDate attendanceDate,
    String status,
    String markedBy
  ) {}

  public record MarkAttendanceResponse(
    Long id,
    String status,
    String subjectName,
    String subjectCode,
    LocalDate attendanceDate
  ) {}
}
