package com.ams.api;

public record ApiResponse<T>(boolean success, String message, T data) {
  public static <T> ApiResponse<T> ok(T data) {
    return new ApiResponse<>(true, "OK", data);
  }

  public static <T> ApiResponse<T> ok(String message, T data) {
    return new ApiResponse<>(true, message, data);
  }
}

