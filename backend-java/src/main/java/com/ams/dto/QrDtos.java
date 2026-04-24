package com.ams.dto;

import java.time.Instant;

public final class QrDtos {
  private QrDtos() {}

  public record QrSessionResponse(String qrToken, Instant expiresAt, String qrCodeImage) {}
}

