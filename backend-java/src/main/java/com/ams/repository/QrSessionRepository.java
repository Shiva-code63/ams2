package com.ams.repository;

import com.ams.entity.QrSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QrSessionRepository extends JpaRepository<QrSession, Long> {
  Optional<QrSession> findByQrToken(String qrToken);
  Optional<QrSession> findByToken(String token);
  long countByCreatedByTeacherId(Long teacherId);
}
