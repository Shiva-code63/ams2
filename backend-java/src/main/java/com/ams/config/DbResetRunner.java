package com.ams.config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class DbResetRunner {
  private final JdbcTemplate jdbcTemplate;
  private final PasswordEncoder passwordEncoder;

  public DbResetRunner(JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder) {
    this.jdbcTemplate = jdbcTemplate;
    this.passwordEncoder = passwordEncoder;
  }

  @EventListener(ApplicationReadyEvent.class)
  public void resetIfEnabled() {
    boolean doReset = isTruthy(System.getenv("AMS2_DB_RESET"));
    if (!doReset) doReset = isTruthy(System.getProperty("AMS2_DB_RESET"));

    if (doReset) {
      // WARNING: Destructive reset. Intended for local/dev recovery only.
      truncateAllTablesInCurrentSchema();
    }

    // Always ensure at least one admin exists after reset (or first boot).
    ensureAdminUser();
  }

  private void truncateAllTablesInCurrentSchema() {
    List<String> tables = jdbcTemplate.queryForList(
      """
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_type = 'BASE TABLE'
      """,
      String.class
    );

    jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS=0");
    for (String t : tables) {
      if (t == null || t.isBlank()) continue;
      jdbcTemplate.execute("TRUNCATE TABLE `" + t + "`");
    }
    jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS=1");
  }

  private void ensureAdminUser() {
    Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM admins", Long.class);
    if (count != null && count > 0) return;

    List<Map<String, Object>> cols = jdbcTemplate.queryForList(
      """
        SELECT column_name, data_type, is_nullable, column_default, extra
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'admins'
      """
    );

    Map<String, Col> byName = new HashMap<>();
    for (Map<String, Object> row : cols) {
      String name = String.valueOf(row.get("COLUMN_NAME"));
      String type = String.valueOf(row.get("DATA_TYPE"));
      String nullable = String.valueOf(row.get("IS_NULLABLE"));
      Object def = row.get("COLUMN_DEFAULT");
      String extra = String.valueOf(row.get("EXTRA"));
      byName.put(name.toLowerCase(Locale.ROOT), new Col(name, type, "YES".equalsIgnoreCase(nullable), def, extra));
    }

    // Build values for required columns, using safe defaults where possible.
    Map<String, Object> values = new LinkedHashMap<>();
    Map<String, String> expressions = new LinkedHashMap<>();

    putIfPresent(values, byName, "email", "admin@ams.com");
    putIfPresent(values, byName, "name", "Admin");
    putIfPresent(values, byName, "phone_number", "");
    putIfPresent(values, byName, "password_hash", passwordEncoder.encode("Admin@123"));
    putIfPresent(values, byName, "role", "ADMIN");

    putNowIfPresent(expressions, byName, "created_at");
    putNowIfPresent(expressions, byName, "updated_at");

    putIfPresent(values, byName, "enabled", 1);
    putIfPresent(values, byName, "is_enabled", 1);
    putIfPresent(values, byName, "active", 1);
    putIfPresent(values, byName, "is_active", 1);

    // Fill any remaining NOT NULL columns without defaults (excluding auto-increment id).
    for (Col c : byName.values()) {
      String key = c.nameLower();
      if (values.containsKey(c.name)) continue;
      if (expressions.containsKey(c.name)) continue;
      if (key.equals("id")) continue;
      if (c.extra != null && c.extra.toLowerCase(Locale.ROOT).contains("auto_increment")) continue;
      if (c.nullable) continue;
      if (c.defaultValue != null) continue;

      if (isDateLike(c.dataType)) {
        expressions.put(c.name, "NOW()");
      } else if (isNumeric(c.dataType)) {
        values.put(c.name, 0);
      } else {
        values.put(c.name, "");
      }
    }

    if (values.isEmpty() && expressions.isEmpty()) return;

    List<String> columns = new ArrayList<>();
    List<String> placeholders = new ArrayList<>();
    List<Object> args = new ArrayList<>();

    for (var entry : values.entrySet()) {
      columns.add("`" + entry.getKey() + "`");
      placeholders.add("?");
      args.add(entry.getValue());
    }
    for (var entry : expressions.entrySet()) {
      columns.add("`" + entry.getKey() + "`");
      placeholders.add(entry.getValue());
    }

    String sql = "INSERT INTO admins (" + String.join(",", columns) + ") VALUES (" + String.join(",", placeholders) + ")";
    jdbcTemplate.update(sql, args.toArray());
  }

  private static void putIfPresent(Map<String, Object> values, Map<String, Col> cols, String nameLower, Object value) {
    Col c = cols.get(nameLower);
    if (c != null) values.put(c.name, value);
  }

  private static void putNowIfPresent(Map<String, String> expressions, Map<String, Col> cols, String nameLower) {
    Col c = cols.get(nameLower);
    if (c != null) expressions.put(c.name, "NOW()");
  }

  private static boolean isTruthy(String v) {
    if (v == null) return false;
    String s = v.trim().toLowerCase(Locale.ROOT);
    return s.equals("1") || s.equals("true") || s.equals("yes") || s.equals("y") || s.equals("on");
  }

  private static boolean isNumeric(String dataType) {
    if (dataType == null) return false;
    String t = dataType.toLowerCase(Locale.ROOT);
    return t.contains("int") || t.contains("decimal") || t.contains("numeric") || t.contains("float") || t.contains("double") || t.contains("bit");
  }

  private static boolean isDateLike(String dataType) {
    if (dataType == null) return false;
    String t = dataType.toLowerCase(Locale.ROOT);
    return t.contains("date") || t.contains("time") || t.contains("timestamp");
  }

  private record Col(String name, String dataType, boolean nullable, Object defaultValue, String extra) {
    String nameLower() {
      return name.toLowerCase(Locale.ROOT);
    }
  }
}
