package com.ams.security;

public enum AppRole {
  ADMIN,
  STUDENT,
  TEACHER;

  public String asAuthority() {
    return "ROLE_" + name();
  }
}

