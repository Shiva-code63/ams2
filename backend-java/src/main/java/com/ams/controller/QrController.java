package com.ams.controller;

import com.ams.api.ApiResponse;
import com.ams.dto.QrDtos;
import com.ams.service.QrService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/qr")
public class QrController {
  private final QrService qrService;

  public QrController(QrService qrService) {
    this.qrService = qrService;
  }

  @PostMapping("/generate")
  @PreAuthorize("hasRole('TEACHER')")
  public ApiResponse<QrDtos.QrSessionResponse> generate(@RequestParam Long subjectId) {
    return ApiResponse.ok(qrService.generate(subjectId));
  }

  @PostMapping("/stop/{qrToken}")
  @PreAuthorize("hasRole('TEACHER')")
  public ApiResponse<Void> stop(@PathVariable String qrToken) {
    qrService.stop(qrToken);
    return ApiResponse.ok("Stopped", null);
  }

  @GetMapping("/validate/{qrToken}")
  public ApiResponse<Object> validate(@PathVariable String qrToken) {
    qrService.requireValid(qrToken);
    return ApiResponse.ok("Valid", java.util.Map.of("valid", true));
  }

  @GetMapping("/{qrToken}")
  public ApiResponse<Object> get(@PathVariable String qrToken) {
    var session = qrService.requireValid(qrToken);
    return ApiResponse.ok(java.util.Map.of(
      "qrToken", session.getQrToken(),
      "expiresAt", session.getExpiresAt(),
      "subjectId", session.getSubject().getId(),
      "subjectName", session.getSubject().getSubjectName(),
      "subjectCode", session.getSubject().getSubjectCode()
    ));
  }
}
