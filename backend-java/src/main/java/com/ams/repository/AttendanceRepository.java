package com.ams.repository;

import com.ams.entity.AttendanceRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {
  Page<AttendanceRecord> findByStudentIdOrderByAttendanceDateDesc(Long studentId, Pageable pageable);

  Optional<AttendanceRecord> findByStudentIdAndSubjectIdAndAttendanceDate(Long studentId, Long subjectId, LocalDate attendanceDate);

  @Query("""
    select a from AttendanceRecord a
    where a.subject.id = :subjectId
      and a.attendanceDate = :date
  """)
  List<AttendanceRecord> findBySubjectIdAndAttendanceDate(@Param("subjectId") Long subjectId, @Param("date") LocalDate date);

  @Query("""
    select a from AttendanceRecord a
    where a.student.id = :studentId
      and (:startDate is null or a.attendanceDate >= :startDate)
      and (:endDate is null or a.attendanceDate <= :endDate)
    order by a.attendanceDate asc
  """)
  List<AttendanceRecord> findStudentReportRows(@Param("studentId") Long studentId,
                                              @Param("startDate") LocalDate startDate,
                                              @Param("endDate") LocalDate endDate);

  @Query("""
    select a from AttendanceRecord a
    where a.student.id = :studentId
      and a.subject.teacher.id = :teacherId
      and (:startDate is null or a.attendanceDate >= :startDate)
      and (:endDate is null or a.attendanceDate <= :endDate)
    order by a.attendanceDate asc
  """)
  List<AttendanceRecord> findStudentReportRowsForTeacher(@Param("studentId") Long studentId,
                                                        @Param("teacherId") Long teacherId,
                                                        @Param("startDate") LocalDate startDate,
                                                        @Param("endDate") LocalDate endDate);

  @Query("""
    select a from AttendanceRecord a
    where (:studentId is null or a.student.id = :studentId)
      and (:teacherId is null or a.subject.teacher.id = :teacherId)
      and (:subjectId is null or a.subject.id = :subjectId)
      and (:date is null or a.attendanceDate = :date)
    order by a.attendanceDate desc
  """)
  Page<AttendanceRecord> search(@Param("studentId") Long studentId,
                               @Param("teacherId") Long teacherId,
                               @Param("subjectId") Long subjectId,
                               @Param("date") LocalDate date,
                               Pageable pageable);

  @Query("""
    select a from AttendanceRecord a
    where a.subject.teacher.id = :teacherId
  """)
  List<AttendanceRecord> findAllForTeacher(@Param("teacherId") Long teacherId);
}
