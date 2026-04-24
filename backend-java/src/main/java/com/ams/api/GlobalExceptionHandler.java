package com.ams.api;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(ErrorResponseException.class)
  public ResponseEntity<Map<String, Object>> handleStatus(ErrorResponseException ex) {
    Map<String, Object> body = new HashMap<>();
    body.put("message", ex.getBody() != null ? ex.getBody().getDetail() : ex.getMessage());
    body.put("detail", ex.getMessage());
    return ResponseEntity.status(ex.getStatusCode()).body(body);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
    Map<String, Object> body = new HashMap<>();
    body.put("message", "Validation failed");
    body.put("detail", ex.getBindingResult().getFieldErrors().stream()
      .findFirst()
      .map(err -> err.getField() + ": " + err.getDefaultMessage())
      .orElse("Invalid request"));
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
  }

  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<Map<String, Object>> handleConstraint(ConstraintViolationException ex) {
    Map<String, Object> body = new HashMap<>();
    body.put("message", "Validation failed");
    body.put("detail", ex.getMessage());
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
  }

  @ExceptionHandler(NoResourceFoundException.class)
  public ResponseEntity<Map<String, Object>> handleNotFound(NoResourceFoundException ex) {
    Map<String, Object> body = new HashMap<>();
    body.put("message", "Not found");
    body.put("detail", ex.getMessage());
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handleUnknown(Exception ex) {
    Map<String, Object> body = new HashMap<>();
    body.put("message", "Internal server error");
    body.put("detail", ex.getMessage());
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
  }
}
