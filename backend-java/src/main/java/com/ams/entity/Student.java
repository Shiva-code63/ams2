package com.ams.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "students")
public class Student {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Column(nullable = false)
  private String name;

  @Column(name = "enrollment_number", nullable = false, unique = true, length = 11)
  private String enrollmentNumber;

  @Column(name = "college_email", nullable = false, unique = true)
  private String collegeEmail;

  @Column(nullable = false)
  private String role;

  @Column(nullable = false)
  private String password;

  @Column(name = "attendance_percentage", nullable = false)
  private double attendancePercentage;

  @Column(name = "face_registered", nullable = false)
  private boolean faceRegistered;

  @Lob
  @Column(name = "registered_face_image")
  private byte[] registeredFaceImage;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Column
  private String studentPhoneNumber;

  @Column
  private String dob;

  @Column
  private String fatherName;

  @Column
  private String motherName;

  @Column
  private String fatherPhoneNumber;

  @Column
  private String motherPhoneNumber;

  @Column(length = 1024)
  private String address;

  public Long getId() {
    return id;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getEnrollmentNumber() {
    return enrollmentNumber;
  }

  public void setEnrollmentNumber(String enrollmentNumber) {
    this.enrollmentNumber = enrollmentNumber;
  }

  public String getCollegeEmail() {
    return collegeEmail;
  }

  public void setCollegeEmail(String collegeEmail) {
    this.collegeEmail = collegeEmail;
  }

  public String getRole() {
    return role;
  }

  public void setRole(String role) {
    this.role = role;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public double getAttendancePercentage() {
    return attendancePercentage;
  }

  public void setAttendancePercentage(double attendancePercentage) {
    this.attendancePercentage = attendancePercentage;
  }

  public boolean isFaceRegistered() {
    return faceRegistered;
  }

  public void setFaceRegistered(boolean faceRegistered) {
    this.faceRegistered = faceRegistered;
  }

  public byte[] getRegisteredFaceImage() {
    return registeredFaceImage;
  }

  public void setRegisteredFaceImage(byte[] registeredFaceImage) {
    this.registeredFaceImage = registeredFaceImage;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public void setPasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
  }

  public String getStudentPhoneNumber() {
    return studentPhoneNumber;
  }

  public void setStudentPhoneNumber(String studentPhoneNumber) {
    this.studentPhoneNumber = studentPhoneNumber;
  }

  public String getDob() {
    return dob;
  }

  public void setDob(String dob) {
    this.dob = dob;
  }

  public String getFatherName() {
    return fatherName;
  }

  public void setFatherName(String fatherName) {
    this.fatherName = fatherName;
  }

  public String getMotherName() {
    return motherName;
  }

  public void setMotherName(String motherName) {
    this.motherName = motherName;
  }

  public String getFatherPhoneNumber() {
    return fatherPhoneNumber;
  }

  public void setFatherPhoneNumber(String fatherPhoneNumber) {
    this.fatherPhoneNumber = fatherPhoneNumber;
  }

  public String getMotherPhoneNumber() {
    return motherPhoneNumber;
  }

  public void setMotherPhoneNumber(String motherPhoneNumber) {
    this.motherPhoneNumber = motherPhoneNumber;
  }

  public String getAddress() {
    return address;
  }

  public void setAddress(String address) {
    this.address = address;
  }
}
