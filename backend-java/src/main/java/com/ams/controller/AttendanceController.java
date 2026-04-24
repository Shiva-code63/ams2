package com.ams.controller;

import com.ams.api.ApiResponse;
import com.ams.dto.AttendanceDtos;
import com.ams.entity.AttendanceRecord;
import com.ams.repository.AttendanceRepository;
import com.ams.repository.StudentRepository;
import com.ams.security.AppRole;
import com.ams.security.SecurityUtils;
import com.ams.service.AttendanceService;
import com.ams.service.StudentService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/attendance")
public class AttendanceController {
  private final AttendanceService attendanceService;
  private final StudentService studentService;
  private final AttendanceRepository attendanceRepository;
  private final StudentRepository studentRepository;

  public AttendanceController(AttendanceService attendanceService,
                              StudentService studentService,
                              AttendanceRepository attendanceRepository,
                              StudentRepository studentRepository) {
    this.attendanceService = attendanceService;
    this.studentService = studentService;
    this.attendanceRepository = attendanceRepository;
    this.studentRepository = studentRepository;
  }

  @PostMapping("/mark-manual")
  @PreAuthorize("hasRole('TEACHER')")
  public ApiResponse<AttendanceDtos.MarkAttendanceResponse> markManual(@RequestParam Long studentId,
                                                                      @RequestParam Long subjectId,
                                                                      @RequestParam String status,
                                                                      @RequestParam String date) {
    LocalDate d = LocalDate.parse(date);
    return ApiResponse.ok(attendanceService.markManual(studentId, subjectId, status, d));
  }

  @PostMapping("/mark-qr")
  @PreAuthorize("hasRole('STUDENT')")
  public ApiResponse<AttendanceDtos.MarkAttendanceResponse> markQr(@RequestParam Long studentId,
                                                                  @RequestParam String qrToken) {
    return ApiResponse.ok(attendanceService.markByQr(studentId, qrToken));
  }

  @GetMapping("/student/{studentId}")
  public ApiResponse<Page<AttendanceDtos.AttendanceRow>> listStudent(@PathVariable Long studentId,
                                                                    @RequestParam(defaultValue = "0") int page,
                                                                    @RequestParam(defaultValue = "50") int size) {
    return ApiResponse.ok(studentService.listAttendance(studentId, PageRequest.of(page, size)));
  }

  @GetMapping("/search")
  @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
  public ApiResponse<Page<AttendanceDtos.AttendanceRow>> search(@RequestParam(defaultValue = "0") int page,
                                                               @RequestParam(defaultValue = "50") int size,
                                                               @RequestParam(required = false) Long studentId,
                                                               @RequestParam(required = false) String studentEnrollmentNumber,
                                                               @RequestParam(required = false) Long teacherId,
                                                               @RequestParam(required = false) Long subjectId,
                                                               @RequestParam(required = false) String date) {
    LocalDate d = (date == null || date.isBlank()) ? null : LocalDate.parse(date);
    Long resolvedStudentId = studentId;
    if (resolvedStudentId == null && studentEnrollmentNumber != null && !studentEnrollmentNumber.isBlank()) {
      String enr = studentEnrollmentNumber.trim();
      resolvedStudentId = studentRepository.findByEnrollmentNumber(enr).map(s -> s.getId()).orElse(-1L);
    }
    return ApiResponse.ok(attendanceService.search(resolvedStudentId, teacherId, subjectId, d, PageRequest.of(page, size)));
  }

  @GetMapping(value = "/export", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
  public ResponseEntity<byte[]> exportTeacher(@RequestParam(required = false) Long subjectId) {
    var user = SecurityUtils.currentUser();
    List<AttendanceRecord> rows;
    if (user.role() == AppRole.TEACHER) {
      rows = attendanceRepository.findAllForTeacher(user.userId());
    } else {
      rows = attendanceRepository.findAll();
    }
    if (subjectId != null) {
      rows = rows.stream().filter(a -> a.getSubject().getId().equals(subjectId)).toList();
    }

    byte[] bytes = buildAttendanceWorkbook(rows);
    return ResponseEntity.ok()
      .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=attendance.xlsx")
      .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
      .body(bytes);
  }

  @GetMapping(value = "/export/present", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
  public ResponseEntity<byte[]> exportPresent(@RequestParam Long subjectId, @RequestParam String date) {
    LocalDate d = LocalDate.parse(date);
    var user = SecurityUtils.currentUser();
    List<AttendanceRecord> rows;
    if (user.role() == AppRole.TEACHER) {
      rows = attendanceRepository.findAllForTeacher(user.userId());
    } else {
      rows = attendanceRepository.findAll();
    }
    rows = rows.stream()
      .filter(a -> a.getSubject().getId().equals(subjectId))
      .filter(a -> d.equals(a.getAttendanceDate()))
      .filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus()))
      .toList();

    byte[] bytes = buildPresentStudentsWorkbook(rows);
    return ResponseEntity.ok()
      .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=present_students.xlsx")
      .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
      .body(bytes);
  }

  @GetMapping(value = "/export/student", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
  public ResponseEntity<byte[]> exportStudent(@RequestParam Long subjectId, @RequestParam Long studentId) {
    var user = SecurityUtils.currentUser();
    List<AttendanceRecord> rows;
    if (user.role() == AppRole.TEACHER) {
      rows = attendanceRepository.findAllForTeacher(user.userId());
    } else {
      rows = attendanceRepository.findAll();
    }
    rows = rows.stream()
      .filter(a -> a.getSubject().getId().equals(subjectId))
      .filter(a -> a.getStudent().getId().equals(studentId))
      .toList();

    byte[] bytes = buildStudentReportWorkbook(rows);
    return ResponseEntity.ok()
      .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=student_report.xlsx")
      .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
      .body(bytes);
  }

  private static byte[] buildAttendanceWorkbook(List<AttendanceRecord> rows) {
    try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
      Sheet sheet = workbook.createSheet("Attendance");
      CellStyle headerStyle = headerStyle(workbook);
      CellStyle presentStyle = presentStyle(workbook);
      CellStyle absentStyle = absentStyle(workbook);

      String[] headers = {
        "ID",
        "Student Name",
        "Enrollment Number",
        "Student Email",
        "Subject Name",
        "Subject Code",
        "Date",
        "Status",
        "Marked By"
      };
      Row headerRow = sheet.createRow(0);
      for (int i = 0; i < headers.length; i++) {
        Cell cell = headerRow.createCell(i, CellType.STRING);
        cell.setCellValue(headers[i]);
        cell.setCellStyle(headerStyle);
      }

      int r = 1;
      for (AttendanceRecord a : rows) {
        String status = a.getStatus() == null ? "" : a.getStatus().trim().toUpperCase();
        CellStyle rowStyle = null;
        if ("PRESENT".equals(status)) rowStyle = presentStyle;
        else if ("ABSENT".equals(status)) rowStyle = absentStyle;

        Row row = sheet.createRow(r++);
        int c = 0;
        c = writeCell(row, c, a.getId(), rowStyle);
        c = writeCell(row, c, a.getStudent() == null ? "" : a.getStudent().getName(), rowStyle);
        c = writeCell(row, c, a.getStudent() == null ? "" : a.getStudent().getEnrollmentNumber(), rowStyle);
        c = writeCell(row, c, a.getStudent() == null ? "" : a.getStudent().getCollegeEmail(), rowStyle);
        c = writeCell(row, c, a.getSubject() == null ? "" : a.getSubject().getSubjectName(), rowStyle);
        c = writeCell(row, c, a.getSubject() == null ? "" : a.getSubject().getSubjectCode(), rowStyle);
        c = writeCell(row, c, a.getAttendanceDate() == null ? "" : a.getAttendanceDate().toString(), rowStyle);
        c = writeCell(row, c, a.getStatus(), rowStyle);
        writeCell(row, c, a.getMarkedBy(), rowStyle);
      }

      autosize(sheet, headers.length);
      workbook.write(out);
      return out.toByteArray();
    } catch (Exception ex) {
      throw new IllegalStateException("Failed to generate Excel export", ex);
    }
  }

  private static byte[] buildPresentStudentsWorkbook(List<AttendanceRecord> rows) {
    try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
      Sheet sheet = workbook.createSheet("Present");
      CellStyle headerStyle = headerStyle(workbook);
      CellStyle presentStyle = presentStyle(workbook);

      String[] headers = { "Student Name", "Enrollment Number", "Student Email" };
      Row headerRow = sheet.createRow(0);
      for (int i = 0; i < headers.length; i++) {
        Cell cell = headerRow.createCell(i, CellType.STRING);
        cell.setCellValue(headers[i]);
        cell.setCellStyle(headerStyle);
      }

      int r = 1;
      for (AttendanceRecord a : rows) {
        Row row = sheet.createRow(r++);
        int c = 0;
        c = writeCell(row, c, a.getStudent() == null ? "" : a.getStudent().getName(), presentStyle);
        c = writeCell(row, c, a.getStudent() == null ? "" : a.getStudent().getEnrollmentNumber(), presentStyle);
        writeCell(row, c, a.getStudent() == null ? "" : a.getStudent().getCollegeEmail(), presentStyle);
      }

      autosize(sheet, headers.length);
      workbook.write(out);
      return out.toByteArray();
    } catch (Exception ex) {
      throw new IllegalStateException("Failed to generate Excel export", ex);
    }
  }

  private static byte[] buildStudentReportWorkbook(List<AttendanceRecord> rows) {
    try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
      Sheet sheet = workbook.createSheet("Student Report");
      CellStyle headerStyle = headerStyle(workbook);
      CellStyle presentStyle = presentStyle(workbook);
      CellStyle absentStyle = absentStyle(workbook);

      String[] headers = { "Date", "Subject Name", "Subject Code", "Status", "Marked By" };
      Row headerRow = sheet.createRow(0);
      for (int i = 0; i < headers.length; i++) {
        Cell cell = headerRow.createCell(i, CellType.STRING);
        cell.setCellValue(headers[i]);
        cell.setCellStyle(headerStyle);
      }

      int r = 1;
      for (AttendanceRecord a : rows) {
        String status = a.getStatus() == null ? "" : a.getStatus().trim().toUpperCase();
        CellStyle rowStyle = null;
        if ("PRESENT".equals(status)) rowStyle = presentStyle;
        else if ("ABSENT".equals(status)) rowStyle = absentStyle;

        Row row = sheet.createRow(r++);
        int c = 0;
        c = writeCell(row, c, a.getAttendanceDate() == null ? "" : a.getAttendanceDate().toString(), rowStyle);
        c = writeCell(row, c, a.getSubject() == null ? "" : a.getSubject().getSubjectName(), rowStyle);
        c = writeCell(row, c, a.getSubject() == null ? "" : a.getSubject().getSubjectCode(), rowStyle);
        c = writeCell(row, c, a.getStatus(), rowStyle);
        writeCell(row, c, a.getMarkedBy(), rowStyle);
      }

      autosize(sheet, headers.length);
      workbook.write(out);
      return out.toByteArray();
    } catch (Exception ex) {
      throw new IllegalStateException("Failed to generate Excel export", ex);
    }
  }

  private static CellStyle headerStyle(Workbook workbook) {
    Font font = workbook.createFont();
    font.setBold(true);
    font.setColor(IndexedColors.WHITE.getIndex());

    CellStyle style = workbook.createCellStyle();
    style.setFont(font);
    style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
    style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
    style.setBorderBottom(BorderStyle.THIN);
    style.setBorderTop(BorderStyle.THIN);
    style.setBorderLeft(BorderStyle.THIN);
    style.setBorderRight(BorderStyle.THIN);
    return style;
  }

  private static CellStyle presentStyle(Workbook workbook) {
    CellStyle style = workbook.createCellStyle();
    style.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
    style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
    style.setBorderBottom(BorderStyle.THIN);
    style.setBorderTop(BorderStyle.THIN);
    style.setBorderLeft(BorderStyle.THIN);
    style.setBorderRight(BorderStyle.THIN);
    return style;
  }

  private static CellStyle absentStyle(Workbook workbook) {
    CellStyle style = workbook.createCellStyle();
    style.setFillForegroundColor(IndexedColors.ROSE.getIndex());
    style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
    style.setBorderBottom(BorderStyle.THIN);
    style.setBorderTop(BorderStyle.THIN);
    style.setBorderLeft(BorderStyle.THIN);
    style.setBorderRight(BorderStyle.THIN);
    return style;
  }

  private static int writeCell(Row row, int col, Object value, CellStyle style) {
    Cell cell = row.createCell(col, CellType.STRING);
    cell.setCellValue(value == null ? "" : String.valueOf(value));
    if (style != null) cell.setCellStyle(style);
    return col + 1;
  }

  private static void autosize(Sheet sheet, int cols) {
    for (int i = 0; i < cols; i++) {
      sheet.autoSizeColumn(i);
      int width = sheet.getColumnWidth(i);
      sheet.setColumnWidth(i, Math.min(width + 1024, 60 * 256));
    }
  }
}
