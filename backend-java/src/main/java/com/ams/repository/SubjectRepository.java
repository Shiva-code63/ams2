package com.ams.repository;

import com.ams.entity.Subject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
  Page<Subject> findBySubjectNameContainingIgnoreCaseOrSubjectCodeContainingIgnoreCaseOrCourseNameContainingIgnoreCase(
    String name, String code, String course, Pageable pageable);

  List<Subject> findByTeacherId(Long teacherId);

  @Query("""
    select count(s) > 0 from Subject s
      join s.students st
    where s.teacher.id = :teacherId
      and st.id = :studentId
  """)
  boolean existsTeacherStudentLink(@Param("teacherId") Long teacherId, @Param("studentId") Long studentId);
}
