package com.ams.dto;

import jakarta.validation.constraints.NotBlank;

public final class SubjectDtos {
  private SubjectDtos() {}

  public record CreateSubjectRequest(@NotBlank String subjectName, @NotBlank String subjectCode, @NotBlank String courseName) {}

  public record SubjectResponse(
    Long id,
    String subjectName,
    String subjectCode,
    String courseName,
    Long teacherId,
    String teacherName,
    long totalStudents
  ) {}
}

