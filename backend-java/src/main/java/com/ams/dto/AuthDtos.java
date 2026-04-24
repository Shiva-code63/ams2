package com.ams.dto;

import com.ams.security.AppRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class AuthDtos {
  private AuthDtos() {}

  public record LoginRequest(
    @Email @NotBlank String email,
    @NotBlank String password,
    @NotNull AppRole role,
    Boolean rememberMe
  ) {}

  public record LoginResponse(
    String token,
    String refreshToken,
    AppRole role,
    Long userId
  ) {}
}

