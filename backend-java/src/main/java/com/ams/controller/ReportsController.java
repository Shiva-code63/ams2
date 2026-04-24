package com.ams.controller;

import com.ams.service.ExcelReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/reports")
public class ReportsController {
  private final ExcelReportService excelReportService;

  public ReportsController(ExcelReportService excelReportService) {
    this.excelReportService = excelReportService;
  }

  @GetMapping(value = "/student/{studentId}", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
  public ResponseEntity<byte[]> studentReport(@PathVariable Long studentId,
                                              @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                              @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
    byte[] bytes = excelReportService.buildStudentWiseReport(studentId, startDate, endDate);
    String filename = "student_report_" + studentId + ".xlsx";
    return ResponseEntity.ok()
      .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
      .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
      .body(bytes);
  }

  @GetMapping(value = "/subject/{subjectId}", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
  public ResponseEntity<byte[]> subjectReport(@PathVariable Long subjectId,
                                              @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
    byte[] bytes = excelReportService.buildSubjectWiseReport(subjectId, date);
    String filename = "subject_report_" + subjectId + "_" + date + ".xlsx";
    return ResponseEntity.ok()
      .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
      .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
      .body(bytes);
  }
}

