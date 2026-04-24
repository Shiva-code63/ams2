package com.ams.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(
  name = "attendance_records",
  uniqueConstraints = @UniqueConstraint(name = "uk_attendance_student_subject_date", columnNames = {"student_id", "subject_id", "attendance_date"})
)
public class AttendanceRecord {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "student_id")
  private Student student;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "subject_id")
  private Subject subject;

  @Column(nullable = false)
  private LocalDate attendanceDate;

  @Column(nullable = false)
  private String status;

  @Column(nullable = false)
  private String markedBy;

  public Long getId() {
    return id;
  }

  public Student getStudent() {
    return student;
  }

  public void setStudent(Student student) {
    this.student = student;
  }

  public Subject getSubject() {
    return subject;
  }

  public void setSubject(Subject subject) {
    this.subject = subject;
  }

  public LocalDate getAttendanceDate() {
    return attendanceDate;
  }

  public void setAttendanceDate(LocalDate attendanceDate) {
    this.attendanceDate = attendanceDate;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getMarkedBy() {
    return markedBy;
  }

  public void setMarkedBy(String markedBy) {
    this.markedBy = markedBy;
  }
}
