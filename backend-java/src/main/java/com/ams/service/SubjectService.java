package com.ams.service;

import com.ams.dto.SubjectDtos;
import com.ams.dto.StudentDtos;
import com.ams.entity.Student;
import com.ams.entity.Subject;
import com.ams.entity.Teacher;
import com.ams.repository.StudentRepository;
import com.ams.repository.SubjectRepository;
import com.ams.repository.TeacherRepository;
import com.ams.security.AppRole;
import com.ams.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class SubjectService {
  private final SubjectRepository subjectRepository;
  private final TeacherRepository teacherRepository;
  private final StudentRepository studentRepository;

  public SubjectService(SubjectRepository subjectRepository, TeacherRepository teacherRepository, StudentRepository studentRepository) {
    this.subjectRepository = subjectRepository;
    this.teacherRepository = teacherRepository;
    this.studentRepository = studentRepository;
  }

  public SubjectDtos.SubjectResponse create(SubjectDtos.CreateSubjectRequest req) {
    var user = SecurityUtils.currentUser();
    if (user.role() != AppRole.TEACHER) throw new ResponseStatusException(FORBIDDEN, "Only TEACHER can create subjects");

    Teacher teacher = teacherRepository.findById(user.userId()).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Teacher not found"));

    Subject subject = new Subject();
    subject.setSubjectName(req.subjectName().trim());
    subject.setSubjectCode(req.subjectCode().trim());
    subject.setCourseName(req.courseName().trim());
    subject.setTeacher(teacher);

    List<Student> allStudents = studentRepository.findAll();
    subject.getStudents().addAll(allStudents);

    Subject saved = subjectRepository.save(subject);
    return toResponse(saved);
  }

  public void delete(Long subjectId) {
    var user = SecurityUtils.currentUser();
    Subject subject = subjectRepository.findById(subjectId).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Subject not found"));
    if (user.role() == AppRole.TEACHER && !subject.getTeacher().getId().equals(user.userId())) {
      throw new ResponseStatusException(FORBIDDEN, "Cannot delete a subject owned by another teacher");
    }
    subjectRepository.delete(subject);
  }

  public Page<SubjectDtos.SubjectResponse> list(String search, Pageable pageable) {
    if (search == null || search.trim().isEmpty()) {
      return subjectRepository.findAll(pageable).map(this::toResponse);
    }
    String q = search.trim();
    return subjectRepository
      .findBySubjectNameContainingIgnoreCaseOrSubjectCodeContainingIgnoreCaseOrCourseNameContainingIgnoreCase(q, q, q, pageable)
      .map(this::toResponse);
  }

  public List<SubjectDtos.SubjectResponse> listByTeacher(Long teacherId) {
    var user = SecurityUtils.currentUser();
    if (user.role() == AppRole.TEACHER && !user.userId().equals(teacherId)) {
      throw new ResponseStatusException(FORBIDDEN, "Forbidden");
    }
    return subjectRepository.findByTeacherId(teacherId).stream().map(this::toResponse).toList();
  }

  public List<StudentDtos.StudentProfileResponse> listStudents(Long subjectId) {
    Subject subject = subjectRepository.findById(subjectId).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Subject not found"));
    // Backfill: if a subject was created before students existed, attach current students so teacher exports work.
    if (subject.getStudents().isEmpty()) {
      List<Student> all = studentRepository.findAll();
      if (!all.isEmpty()) {
        subject.getStudents().addAll(all);
        subjectRepository.save(subject);
      }
    }
    return subject.getStudents().stream()
      .map(s -> new StudentDtos.StudentProfileResponse(
        s.getId(), s.getName(), s.getEnrollmentNumber(), s.getCollegeEmail(),
        s.getStudentPhoneNumber(), s.getDob(), s.getFatherName(), s.getMotherName(),
        s.getFatherPhoneNumber(), s.getMotherPhoneNumber(), s.getAddress()
      ))
      .toList();
  }

  private SubjectDtos.SubjectResponse toResponse(Subject s) {
    String teacherName = null;
    Long teacherId = null;
    if (s.getTeacher() != null) {
      teacherId = s.getTeacher().getId();
      teacherName = s.getTeacher().getName();
    }
    long total = s.getStudents() == null ? 0 : s.getStudents().size();
    return new SubjectDtos.SubjectResponse(s.getId(), s.getSubjectName(), s.getSubjectCode(), s.getCourseName(), teacherId, teacherName, total);
  }
}
