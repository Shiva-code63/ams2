package com.ams.service;

import com.ams.entity.AttendanceRecord;
import com.ams.entity.Student;
import com.ams.entity.Subject;
import com.ams.repository.AttendanceRepository;
import com.ams.repository.StudentRepository;
import com.ams.repository.SubjectRepository;
import com.ams.security.AppRole;
import com.ams.security.SecurityUtils;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class ExcelReportService {
  private final AttendanceRepository attendanceRepository;
  private final StudentRepository studentRepository;
  private final SubjectRepository subjectRepository;

  public ExcelReportService(AttendanceRepository attendanceRepository,
                            StudentRepository studentRepository,
                            SubjectRepository subjectRepository) {
    this.attendanceRepository = attendanceRepository;
    this.studentRepository = studentRepository;
    this.subjectRepository = subjectRepository;
  }

  @Transactional(readOnly = true)
  public byte[] buildStudentWiseReport(Long studentId, LocalDate startDate, LocalDate endDate) {
    var user = SecurityUtils.currentUser();
    Student student = studentRepository.findById(studentId).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Student not found"));

    List<AttendanceRecord> rows = (user.role() == AppRole.TEACHER)
      ? attendanceRepository.findStudentReportRowsForTeacher(studentId, user.userId(), startDate, endDate)
      : attendanceRepository.findStudentReportRows(studentId, startDate, endDate);

    if (user.role() == AppRole.TEACHER && rows.isEmpty()) {
      boolean linked = subjectRepository.existsTeacherStudentLink(user.userId(), studentId);
      if (!linked) throw new ResponseStatusException(FORBIDDEN, "No access to this student's report");
    }

    long total = rows.size();
    long present = rows.stream().filter(r -> "PRESENT".equalsIgnoreCase(r.getStatus())).count();
    double percentage = total == 0 ? 0.0 : (present * 100.0) / total;

    try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
      Sheet sheet = workbook.createSheet("Student Report");

      CellStyle header = headerStyle(workbook);
      CellStyle presentStyle = presentStyle(workbook);
      CellStyle absentStyle = absentStyle(workbook);

      int r = 0;
      r = writeMetaRow(sheet, r, "Student Name", student.getName());
      r = writeMetaRow(sheet, r, "Enrollment Number", student.getEnrollmentNumber());
      r = writeMetaRow(sheet, r, "Email", student.getCollegeEmail());
      r = writeMetaRow(sheet, r, "Date Range", (startDate == null ? "-" : startDate) + " to " + (endDate == null ? "-" : endDate));
      r = writeMetaRow(sheet, r, "Attendance Percentage", String.format("%.2f%%", percentage));
      r++; // blank

      String[] headers = { "Date", "Subject", "Subject Code", "Status", "Attendance %" };
      Row headerRow = sheet.createRow(r++);
      for (int i = 0; i < headers.length; i++) {
        Cell cell = headerRow.createCell(i, CellType.STRING);
        cell.setCellValue(headers[i]);
        cell.setCellStyle(header);
      }

      if (rows.isEmpty()) {
        Row row = sheet.createRow(r);
        Cell cell = row.createCell(0, CellType.STRING);
        cell.setCellValue("No records found for the selected filters.");
      } else {
        for (AttendanceRecord a : rows) {
          String status = a.getStatus() == null ? "" : a.getStatus().trim().toUpperCase();
          CellStyle rowStyle = "PRESENT".equals(status) ? presentStyle : ("ABSENT".equals(status) ? absentStyle : null);

          Row row = sheet.createRow(r++);
          int c = 0;
          c = writeCell(row, c, a.getAttendanceDate() == null ? "" : a.getAttendanceDate().toString(), rowStyle);
          c = writeCell(row, c, a.getSubject() == null ? "" : a.getSubject().getSubjectName(), rowStyle);
          c = writeCell(row, c, a.getSubject() == null ? "" : a.getSubject().getSubjectCode(), rowStyle);
          c = writeCell(row, c, a.getStatus(), rowStyle);
          writeCell(row, c, String.format("%.2f%%", percentage), rowStyle);
        }
      }

      autosize(sheet, 8);
      workbook.write(out);
      return out.toByteArray();
    } catch (Exception ex) {
      throw new IllegalStateException("Failed to generate Excel report", ex);
    }
  }

  @Transactional(readOnly = true)
  public byte[] buildSubjectWiseReport(Long subjectId, LocalDate date) {
    if (date == null) throw new ResponseStatusException(BAD_REQUEST, "Date is required");
    var user = SecurityUtils.currentUser();
    Subject subject = subjectRepository.findById(subjectId).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Subject not found"));
    if (user.role() == AppRole.TEACHER && !subject.getTeacher().getId().equals(user.userId())) {
      throw new ResponseStatusException(FORBIDDEN, "Cannot download report for another teacher's subject");
    }

    List<AttendanceRecord> marks = attendanceRepository.findBySubjectIdAndAttendanceDate(subjectId, date);
    Map<Long, AttendanceRecord> byStudentId = new HashMap<>();
    for (AttendanceRecord a : marks) {
      if (a.getStudent() != null) byStudentId.put(a.getStudent().getId(), a);
    }

    try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
      Sheet sheet = workbook.createSheet("Subject Report");

      CellStyle header = headerStyle(workbook);
      CellStyle presentStyle = presentStyle(workbook);
      CellStyle absentStyle = absentStyle(workbook);

      int r = 0;
      r = writeMetaRow(sheet, r, "Subject", subject.getSubjectName());
      r = writeMetaRow(sheet, r, "Subject Code", subject.getSubjectCode());
      r = writeMetaRow(sheet, r, "Date", date.toString());
      r++; // blank

      String[] headers = { "Student Name", "Enrollment Number", "Email", "Status" };
      Row headerRow = sheet.createRow(r++);
      for (int i = 0; i < headers.length; i++) {
        Cell cell = headerRow.createCell(i, CellType.STRING);
        cell.setCellValue(headers[i]);
        cell.setCellStyle(header);
      }

      if (subject.getStudents() == null || subject.getStudents().isEmpty()) {
        Row row = sheet.createRow(r);
        row.createCell(0, CellType.STRING).setCellValue("No students enrolled in this subject.");
      } else {
        for (Student s : subject.getStudents()) {
          AttendanceRecord record = byStudentId.get(s.getId());
          String status = record == null ? "ABSENT" : (record.getStatus() == null ? "ABSENT" : record.getStatus().trim().toUpperCase());
          CellStyle rowStyle = "PRESENT".equals(status) ? presentStyle : absentStyle;

          Row row = sheet.createRow(r++);
          int c = 0;
          c = writeCell(row, c, s.getName(), rowStyle);
          c = writeCell(row, c, s.getEnrollmentNumber(), rowStyle);
          c = writeCell(row, c, s.getCollegeEmail(), rowStyle);
          writeCell(row, c, status, rowStyle);
        }
      }

      autosize(sheet, 8);
      workbook.write(out);
      return out.toByteArray();
    } catch (Exception ex) {
      throw new IllegalStateException("Failed to generate Excel report", ex);
    }
  }

  private static int writeMetaRow(Sheet sheet, int rowIndex, String key, String value) {
    Row row = sheet.createRow(rowIndex);
    row.createCell(0, CellType.STRING).setCellValue(key);
    row.createCell(1, CellType.STRING).setCellValue(value == null ? "" : value);
    return rowIndex + 1;
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
