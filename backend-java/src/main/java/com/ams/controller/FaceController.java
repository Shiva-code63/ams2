package com.ams.controller;

import com.ams.api.ApiResponse;
import com.ams.security.AppRole;
import com.ams.security.SecurityUtils;
import com.ams.service.FaceProxyService;
import com.ams.service.FaceStorageService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/face")
public class FaceController {
  private final FaceStorageService faceStorageService;
  private final FaceProxyService faceProxyService;

  public FaceController(FaceStorageService faceStorageService, FaceProxyService faceProxyService) {
    this.faceStorageService = faceStorageService;
    this.faceProxyService = faceProxyService;
  }

  @GetMapping("/check/{studentId}")
  public ApiResponse<Map<String, Object>> check(@PathVariable Long studentId) {
    return ApiResponse.ok(Map.of("faceRegistered", faceStorageService.isRegistered(studentId)));
  }

  @GetMapping("/service-health")
  public ApiResponse<Map<String, Object>> serviceHealth() {
    return ApiResponse.ok(faceProxyService.health());
  }

  @GetMapping(value = "/image/{studentId}", produces = MediaType.IMAGE_JPEG_VALUE)
  public ResponseEntity<byte[]> image(@PathVariable Long studentId) throws Exception {
    Path path = faceStorageService.firstImage(studentId).orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(NOT_FOUND, "No face image"));
    byte[] bytes = faceStorageService.readImage(path);
    return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(bytes);
  }

  @PostMapping("/register/{studentId}")
  @PreAuthorize("hasRole('STUDENT')")
  public ApiResponse<Map<String, Object>> registerLegacy(@PathVariable Long studentId, @RequestParam("file") MultipartFile file) {
    var user = SecurityUtils.currentUser();
    if (user.role() == AppRole.STUDENT && !user.userId().equals(studentId)) {
      throw new org.springframework.web.server.ResponseStatusException(UNAUTHORIZED, "Cannot register for another student");
    }
    Map<String, Object> res = faceProxyService.registerFace(studentId, List.of(file));
    return ApiResponse.ok(res);
  }
}
