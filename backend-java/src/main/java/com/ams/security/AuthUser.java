package com.ams.security;

public record AuthUser(Long userId, String email, AppRole role) {}

