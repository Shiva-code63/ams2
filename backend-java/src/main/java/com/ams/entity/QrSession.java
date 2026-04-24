package com.ams.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "qr_sessions")
public class QrSession {
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
  private boolean active;

  @Column(name = "generated_at", nullable = false)
  private Instant generatedAt;

  @Column(name = "qr_token", nullable = false, unique = true)
  private String qrToken;

  @Column(nullable = false, length = 128)
  private String token;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "subject_id")
  private Subject subject;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(name = "teacher_id", nullable = false)
  private Long teacherId;

  @Column(name = "created_by_teacher_id", nullable = false)
  private Long createdByTeacherId;

  public Long getId() {
    return id;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public boolean isActive() {
    return active;
  }

  public void setActive(boolean active) {
    this.active = active;
  }

  public Instant getGeneratedAt() {
    return generatedAt;
  }

  public void setGeneratedAt(Instant generatedAt) {
    this.generatedAt = generatedAt;
  }

  public String getQrToken() {
    return qrToken;
  }

  public void setQrToken(String qrToken) {
    this.qrToken = qrToken;
  }

  public String getToken() {
    return token;
  }

  public void setToken(String token) {
    this.token = token;
  }

  public Subject getSubject() {
    return subject;
  }

  public void setSubject(Subject subject) {
    this.subject = subject;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }

  public void setExpiresAt(Instant expiresAt) {
    this.expiresAt = expiresAt;
  }

  public Long getTeacherId() {
    return teacherId;
  }

  public void setTeacherId(Long teacherId) {
    this.teacherId = teacherId;
  }

  public Long getCreatedByTeacherId() {
    return createdByTeacherId;
  }

  public void setCreatedByTeacherId(Long createdByTeacherId) {
    this.createdByTeacherId = createdByTeacherId;
  }
}
