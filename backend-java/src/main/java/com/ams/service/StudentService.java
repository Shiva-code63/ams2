package com.ams.service;

import com.ams.dto.AttendanceDtos;
import com.ams.dto.StudentDtos;
import com.ams.entity.AttendanceRecord;
import com.ams.entity.Student;
import com.ams.entity.Subject;
import com.ams.repository.AttendanceRepository;
import com.ams.repository.StudentRepository;
import com.ams.repository.SubjectRepository;
import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class StudentService {
  private final StudentRepository studentRepository;
  private final SubjectRepository subjectRepository;
  private final AttendanceRepository attendanceRepository;
  private final PasswordEncoder passwordEncoder;
  private final JdbcTemplate jdbc;

  public StudentService(StudentRepository studentRepository,
                        SubjectRepository subjectRepository,
                        AttendanceRepository attendanceRepository,
                        PasswordEncoder passwordEncoder,
                        JdbcTemplate jdbc) {
    this.studentRepository = studentRepository;
    this.subjectRepository = subjectRepository;
    this.attendanceRepository = attendanceRepository;
    this.passwordEncoder = passwordEncoder;
    this.jdbc = jdbc;
  }

  public StudentDtos.StudentProfileResponse getProfile(Long id) {
    Student s = studentRepository.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Student not found"));
    return new StudentDtos.StudentProfileResponse(
      s.getId(), s.getName(), s.getEnrollmentNumber(), s.getCollegeEmail(),
      s.getStudentPhoneNumber(), s.getDob(), s.getFatherName(), s.getMotherName(),
      s.getFatherPhoneNumber(), s.getMotherPhoneNumber(), s.getAddress()
    );
  }

  public void updateProfile(Long id, StudentDtos.UpdateStudentProfileRequest req) {
    Student s = studentRepository.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Student not found"));
    if (req.studentPhoneNumber() != null) s.setStudentPhoneNumber(trimOrNull(req.studentPhoneNumber()));
    if (req.dob() != null) s.setDob(trimOrNull(req.dob()));
    if (req.fatherName() != null) s.setFatherName(trimOrNull(req.fatherName()));
    if (req.motherName() != null) s.setMotherName(trimOrNull(req.motherName()));
    if (req.fatherPhoneNumber() != null) s.setFatherPhoneNumber(trimOrNull(req.fatherPhoneNumber()));
    if (req.motherPhoneNumber() != null) s.setMotherPhoneNumber(trimOrNull(req.motherPhoneNumber()));
    if (req.address() != null) s.setAddress(trimOrNull(req.address()));
    studentRepository.save(s);
  }

  public Page<AttendanceDtos.AttendanceRow> listAttendance(Long studentId, Pageable pageable) {
    return attendanceRepository.findByStudentIdOrderByAttendanceDateDesc(studentId, pageable).map(this::toRow);
  }

  public StudentDtos.StudentDashboardResponse dashboard(Long studentId) {
    long enrolled = subjectRepository.findAll().stream().filter(sub -> sub.getStudents().stream().anyMatch(st -> st.getId().equals(studentId))).count();
    List<AttendanceDtos.AttendanceRow> recent = attendanceRepository.findByStudentIdOrderByAttendanceDateDesc(studentId, Pageable.ofSize(5)).map(this::toRow).getContent();

    Page<AttendanceRecord> all = attendanceRepository.findByStudentIdOrderByAttendanceDateDesc(studentId, Pageable.ofSize(1000));
    double pct = 0.0;
    if (all.getTotalElements() > 0) {
      long present = all.stream().filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus())).count();
      pct = (present * 100.0) / all.getTotalElements();
    }
    return new StudentDtos.StudentDashboardResponse(pct, enrolled, recent);
  }

  @Transactional
  public void deleteStudent(Long id) {
    studentRepository.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Student not found"));
    try {
      // Delete child rows first to avoid FK constraint violations.
      jdbc.update("DELETE FROM face_verification_attempts WHERE student_id = ?", id);
      jdbc.update("DELETE FROM face_images WHERE student_id = ?", id);
      jdbc.update("DELETE FROM attendance_records WHERE student_id = ?", id);
      jdbc.update("DELETE FROM attendance WHERE student_id = ?", id);
      jdbc.update("DELETE FROM student_subject WHERE student_id = ?", id);
      jdbc.update("DELETE FROM subject_students WHERE student_id = ?", id);
      jdbc.update("DELETE FROM students WHERE id = ?", id);
    } catch (DataAccessException ex) {
      String msg = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
      throw new ResponseStatusException(BAD_REQUEST, "Delete student failed: " + msg, ex);
    }
  }

  public Student createStudent(StudentDtos.CreateStudentRequest req) {
    String name = req.name().trim();
    String enr = req.enrollmentNumber().trim();
    if (enr.length() != 11) throw new ResponseStatusException(BAD_REQUEST, "Enrollment number must be 11 characters");
    String email = enr + "@bennett.edu.in";

    Student s = new Student();
    s.setName(name);
    s.setEnrollmentNumber(enr);
    s.setCollegeEmail(email);

    String hash = passwordEncoder.encode(enr);
    s.setPasswordHash(hash);
    s.setPassword(hash);
    s.setRole("STUDENT");
    s.setAttendancePercentage(0.0);
    s.setFaceRegistered(false);
    Student saved = studentRepository.save(s);

    // Ensure student appears under teacher subject reports (this project treats subjects as containing all students).
    List<Subject> subjects = subjectRepository.findAll();
    boolean changed = false;
    for (Subject subject : subjects) {
      if (subject.getStudents().add(saved)) changed = true;
    }
    if (changed) subjectRepository.saveAll(subjects);

    return saved;
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

  private static String trimOrNull(String v) {
    if (v == null) return null;
    String t = v.trim();
    return t.isEmpty() ? null : t;
  }
}
