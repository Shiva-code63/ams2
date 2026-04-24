package com.ams.service;

import com.ams.dto.QrDtos;
import com.ams.entity.QrSession;
import com.ams.entity.Subject;
import com.ams.repository.QrSessionRepository;
import com.ams.repository.SubjectRepository;
import com.ams.security.AppRole;
import com.ams.security.SecurityUtils;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class QrService {
  private final SubjectRepository subjectRepository;
  private final QrSessionRepository qrSessionRepository;
  private final long ttlSeconds;

  public QrService(SubjectRepository subjectRepository,
                   QrSessionRepository qrSessionRepository,
                   @Value("${ams2.qr.ttl-seconds}") long ttlSeconds) {
    this.subjectRepository = subjectRepository;
    this.qrSessionRepository = qrSessionRepository;
    this.ttlSeconds = ttlSeconds;
  }

  public QrDtos.QrSessionResponse generate(Long subjectId) {
    var user = SecurityUtils.currentUser();
    if (user.role() != AppRole.TEACHER) throw new ResponseStatusException(FORBIDDEN, "Only TEACHER can generate QR sessions");

    Subject subject = subjectRepository.findById(subjectId).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Subject not found"));
    if (!subject.getTeacher().getId().equals(user.userId())) {
      throw new ResponseStatusException(FORBIDDEN, "Cannot generate QR for another teacher's subject");
    }

    String token = UUID.randomUUID().toString();
    Instant expiresAt = Instant.now().plusSeconds(ttlSeconds);
    QrSession session = new QrSession();
    session.setQrToken(token);
    session.setToken(token);
    session.setSubject(subject);
    session.setExpiresAt(expiresAt);
    session.setActive(true);
    session.setGeneratedAt(Instant.now());
    session.setTeacherId(user.userId());
    session.setCreatedByTeacherId(user.userId());
    qrSessionRepository.save(session);

    String dataUrl = "data:image/png;base64," + Base64.getEncoder().encodeToString(renderQrPng(token));
    return new QrDtos.QrSessionResponse(token, expiresAt, dataUrl);
  }

  public QrSession requireValid(String qrToken) {
    QrSession session = qrSessionRepository.findByQrToken(qrToken).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Invalid QR token"));
    if (!session.isActive()) {
      throw new ResponseStatusException(BAD_REQUEST, "QR session stopped");
    }
    if (Instant.now().isAfter(session.getExpiresAt())) {
      throw new ResponseStatusException(BAD_REQUEST, "QR session expired");
    }
    return session;
  }

  public void stop(String qrToken) {
    var user = SecurityUtils.currentUser();
    if (user.role() != AppRole.TEACHER) throw new ResponseStatusException(FORBIDDEN, "Only TEACHER can stop QR sessions");

    QrSession session = qrSessionRepository.findByQrToken(qrToken).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Invalid QR token"));
    if (session.getCreatedByTeacherId() == null || !session.getCreatedByTeacherId().equals(user.userId())) {
      throw new ResponseStatusException(FORBIDDEN, "Cannot stop another teacher's QR session");
    }

    session.setActive(false);
    session.setExpiresAt(Instant.now());
    qrSessionRepository.save(session);
  }

  public long sessionsCreated(Long teacherId) {
    return qrSessionRepository.countByCreatedByTeacherId(teacherId);
  }

  private static byte[] renderQrPng(String text) {
    try {
      QRCodeWriter writer = new QRCodeWriter();
      BitMatrix matrix = writer.encode(text, BarcodeFormat.QR_CODE, 320, 320);
      ByteArrayOutputStream out = new ByteArrayOutputStream();
      MatrixToImageWriter.writeToStream(matrix, "PNG", out);
      return out.toByteArray();
    } catch (WriterException ex) {
      throw new IllegalStateException("Failed to generate QR image", ex);
    } catch (Exception ex) {
      throw new IllegalStateException("Failed to encode QR image", ex);
    }
  }
}
