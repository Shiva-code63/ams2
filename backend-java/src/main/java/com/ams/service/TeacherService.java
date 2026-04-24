package com.ams.service;

import com.ams.dto.TeacherDtos;
import com.ams.entity.Teacher;
import com.ams.repository.SubjectRepository;
import com.ams.repository.TeacherRepository;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class TeacherService {
  private final TeacherRepository teacherRepository;
  private final SubjectRepository subjectRepository;
  private final PasswordEncoder passwordEncoder;
  private final JdbcTemplate jdbc;

  public TeacherService(TeacherRepository teacherRepository,
                        SubjectRepository subjectRepository,
                        PasswordEncoder passwordEncoder,
                        JdbcTemplate jdbc) {
    this.teacherRepository = teacherRepository;
    this.subjectRepository = subjectRepository;
    this.passwordEncoder = passwordEncoder;
    this.jdbc = jdbc;
  }

  public TeacherDtos.TeacherProfileResponse getTeacher(Long id) {
    Teacher t = teacherRepository.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Teacher not found"));
    return new TeacherDtos.TeacherProfileResponse(t.getId(), t.getName(), t.getEmployeeId(), t.getEmail(), t.getPhoneNumber());
  }

  public void updateTeacher(Long id, TeacherDtos.UpdateTeacherProfileRequest req) {
    Teacher t = teacherRepository.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Teacher not found"));
    if (req.name() != null) t.setName(req.name().trim());
    if (req.phoneNumber() != null) t.setPhoneNumber(req.phoneNumber().trim());
    teacherRepository.save(t);
  }

  public void changePassword(Long id, String currentPassword, String newPassword) {
    Teacher t = teacherRepository.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Teacher not found"));
    if (!passwordEncoder.matches(currentPassword, t.getPasswordHash())) {
      throw new ResponseStatusException(BAD_REQUEST, "Current password is incorrect");
    }
    if (newPassword == null || newPassword.length() < 6) {
      throw new ResponseStatusException(BAD_REQUEST, "New password must be at least 6 characters");
    }
    String hash = passwordEncoder.encode(newPassword);
    t.setPasswordHash(hash);
    t.setPassword(hash);
    teacherRepository.save(t);
  }

  public TeacherDtos.TeacherDashboardResponse dashboard(Long teacherId, long sessionsCreated) {
    long subjectsTaught = subjectRepository.findByTeacherId(teacherId).size();
    long totalStudents = subjectRepository.findByTeacherId(teacherId).stream()
      .mapToLong(s -> s.getStudents() == null ? 0 : s.getStudents().size())
      .sum();
    return new TeacherDtos.TeacherDashboardResponse(subjectsTaught, totalStudents, sessionsCreated);
  }

  @Transactional
  public void deleteTeacher(Long id) {
    teacherRepository.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Teacher not found"));

    try {
      List<Long> subjectIds = jdbc.queryForList("SELECT id FROM subjects WHERE teacher_id = ?", Long.class, id);

      // For each subject taught by this teacher, clear dependent rows first.
      for (Long subjectId : subjectIds) {
        jdbc.update("DELETE FROM attendance WHERE subject_id = ?", subjectId);
        jdbc.update("DELETE FROM attendance_records WHERE subject_id = ?", subjectId);
        jdbc.update("DELETE FROM qr_sessions WHERE subject_id = ?", subjectId);
        jdbc.update("DELETE FROM student_subject WHERE subject_id = ?", subjectId);
        jdbc.update("DELETE FROM subject_students WHERE subject_id = ?", subjectId);
      }

      // Clear any remaining rows linked directly to the teacher.
      jdbc.update("DELETE FROM attendance WHERE teacher_id = ?", id);
      jdbc.update("DELETE FROM qr_sessions WHERE teacher_id = ?", id);
      jdbc.update("DELETE FROM qr_sessions WHERE created_by_teacher_id = ?", id);

      // Remove subjects, then the teacher.
      jdbc.update("DELETE FROM subjects WHERE teacher_id = ?", id);
      jdbc.update("DELETE FROM teachers WHERE id = ?", id);
    } catch (DataAccessException ex) {
      String msg = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
      throw new ResponseStatusException(BAD_REQUEST, "Delete teacher failed: " + msg, ex);
    }
  }
}
