package com.ams.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {
  private final SecretKey key;
  private final long ttlSeconds;

  public JwtService(@Value("${ams2.jwt.secret}") String secret,
                    @Value("${ams2.jwt.ttl-seconds}") long ttlSeconds) {
    byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
    this.key = Keys.hmacShaKeyFor(bytes.length >= 32 ? bytes : (secret + "0".repeat(32)).getBytes(StandardCharsets.UTF_8));
    this.ttlSeconds = ttlSeconds;
  }

  public String issueToken(AuthUser user) {
    Instant now = Instant.now();
    Instant exp = now.plusSeconds(ttlSeconds);
    return Jwts.builder()
      .setSubject(user.email())
      .addClaims(Map.of(
        "role", user.role().name(),
        "userId", user.userId()
      ))
      .setIssuedAt(Date.from(now))
      .setExpiration(Date.from(exp))
      .signWith(key, SignatureAlgorithm.HS256)
      .compact();
  }

  public AuthUser parse(String token) {
    Claims claims = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    String email = claims.getSubject();
    String roleStr = String.valueOf(claims.get("role"));
    Long userId = Long.valueOf(String.valueOf(claims.get("userId")));
    return new AuthUser(userId, email, AppRole.valueOf(roleStr));
  }
}

