package com.ams.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

public final class SecurityUtils {
  private SecurityUtils() {}

  public static AuthUser currentUser() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !(auth.getPrincipal() instanceof AuthUser user)) {
      throw new ResponseStatusException(UNAUTHORIZED, "Not authenticated");
    }
    return user;
  }
}

