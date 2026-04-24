package com.ams.service;

import com.ams.dto.AttendanceDtos;
import com.ams.entity.AttendanceRecord;
import com.ams.entity.QrSession;
import com.ams.entity.Student;
import com.ams.entity.Subject;
import com.ams.repository.AttendanceRepository;
import com.ams.repository.StudentRepository;
import com.ams.repository.SubjectRepository;
import com.ams.security.AppRole;
import com.ams.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class AttendanceService {
  private final AttendanceRepository attendanceRepository;
  private final StudentRepository studentRepository;
  private final SubjectRepository subjectRepository;
  private final QrService qrService;

  public AttendanceService(AttendanceRepository attendanceRepository,
                           StudentRepository studentRepository,
                           SubjectRepository subjectRepository,
                           QrService qrService) {
    this.attendanceRepository = attendanceRepository;
    this.studentRepository = studentRepository;
    this.subjectRepository = subjectRepository;
    this.qrService = qrService;
  }

  public AttendanceDtos.MarkAttendanceResponse markManual(Long studentId, Long subjectId, String status, LocalDate date) {
    var user = SecurityUtils.currentUser();
    if (user.role() != AppRole.TEACHER) throw new ResponseStatusException(FORBIDDEN, "Only TEACHER can mark manual attendance");

    Subject subject = subjectRepository.findById(subjectId).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Subject not found"));
    if (!subject.getTeacher().getId().equals(user.userId())) {
      throw new ResponseStatusException(FORBIDDEN, "Cannot mark for another teacher's subject");
    }
    Student student = studentRepository.findById(studentId).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Student not found"));

    AttendanceRecord record = attendanceRepository.findByStudentIdAndSubjectIdAndAttendanceDate(studentId, subjectId, date)
      .orElseGet(AttendanceRecord::new);
    record.setStudent(student);
    record.setSubject(subject);
    record.setAttendanceDate(date);
    record.setStatus(status == null ? "PRESENT" : status.toUpperCase());
    record.setMarkedBy("MANUAL");
    AttendanceRecord saved = attendanceRepository.save(record);
    return new AttendanceDtos.MarkAttendanceResponse(saved.getId(), saved.getStatus(), subject.getSubjectName(), subject.getSubjectCode(), saved.getAttendanceDate());
  }

  public AttendanceDtos.MarkAttendanceResponse markByQr(Long studentId, String qrToken) {
    var user = SecurityUtils.currentUser();
    if (user.role() != AppRole.STUDENT) {
      throw new ResponseStatusException(FORBIDDEN, "Only STUDENT can mark QR attendance");
    }
    if (!user.userId().equals(studentId)) {
      throw new ResponseStatusException(FORBIDDEN, "Cannot mark attendance for another student");
    }
    Student student = studentRepository.findById(studentId).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Student not found"));
    QrSession session = qrService.requireValid(qrToken);
    Subject subject = session.getSubject();
    LocalDate date = LocalDate.now();

    AttendanceRecord record = attendanceRepository.findByStudentIdAndSubjectIdAndAttendanceDate(studentId, subject.getId(), date)
      .orElseGet(AttendanceRecord::new);
    record.setStudent(student);
    record.setSubject(subject);
    record.setAttendanceDate(date);
    record.setStatus("PRESENT");
    record.setMarkedBy("QR");
    AttendanceRecord saved = attendanceRepository.save(record);
    return new AttendanceDtos.MarkAttendanceResponse(saved.getId(), saved.getStatus(), subject.getSubjectName(), subject.getSubjectCode(), saved.getAttendanceDate());
  }

  public Page<AttendanceDtos.AttendanceRow> search(Long studentId, Long teacherId, Long subjectId, LocalDate date, Pageable pageable) {
    return attendanceRepository.search(studentId, teacherId, subjectId, date, pageable).map(this::toRow);
  }

  private AttendanceDtos.AttendanceRow toRow(AttendanceRecord a) {
    return new AttendanceDtos.AttendanceRow(
      a.getId(),
      a.getStudent().getId(),
      a.getStudent().getName(),
      a.getStudent().getEnrollmentNumber(),
      a.getSubject().getId(),
      a.getSubject().getSubjectName(),
      a.getSubject().getSubjectCode(),
      a.getAttendanceDate(),
      a.getStatus(),
      a.getMarkedBy()
    );
  }
}
