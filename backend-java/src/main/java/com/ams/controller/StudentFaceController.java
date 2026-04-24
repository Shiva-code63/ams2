package com.ams.controller;

import com.ams.api.ApiResponse;
import com.ams.security.AppRole;
import com.ams.security.SecurityUtils;
import com.ams.service.FaceProxyService;
import com.ams.service.FaceStorageService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.FORBIDDEN;

@RestController
@RequestMapping("/student")
public class StudentFaceController {
  private final FaceProxyService faceProxyService;
  private final FaceStorageService faceStorageService;

  public StudentFaceController(FaceProxyService faceProxyService, FaceStorageService faceStorageService) {
    this.faceProxyService = faceProxyService;
    this.faceStorageService = faceStorageService;
  }

  @PostMapping("/register-face")
  @PreAuthorize("hasRole('STUDENT')")
  public ApiResponse<Map<String, Object>> register(@RequestParam("files") List<MultipartFile> files) {
    var user = SecurityUtils.currentUser();
    Map<String, Object> res = faceProxyService.registerFace(user.userId(), files);
    return ApiResponse.ok(res);
  }

  @PostMapping("/verify-face")
  @PreAuthorize("hasRole('STUDENT')")
  public ApiResponse<Map<String, Object>> verify(@RequestParam("frames") List<MultipartFile> frames) {
    var user = SecurityUtils.currentUser();
    Map<String, Object> res = faceProxyService.verifyFace(user.userId(), frames);
    return ApiResponse.ok(res);
  }

  @GetMapping("/face-images/{studentId}")
  @PreAuthorize("hasAnyRole('STUDENT','ADMIN')")
  public ApiResponse<List<String>> listImages(@PathVariable Long studentId) throws Exception {
    var user = SecurityUtils.currentUser();
    if (user.role() == AppRole.STUDENT && !user.userId().equals(studentId)) {
      throw new org.springframework.web.server.ResponseStatusException(FORBIDDEN, "Forbidden");
    }
    return ApiResponse.ok(faceStorageService.listImageNames(studentId));
  }

  @DeleteMapping("/delete-face/{studentId}")
  @PreAuthorize("hasAnyRole('STUDENT','ADMIN')")
  public ApiResponse<Map<String, Object>> delete(@PathVariable Long studentId) throws Exception {
    var user = SecurityUtils.currentUser();
    if (user.role() == AppRole.STUDENT && !user.userId().equals(studentId)) {
      throw new org.springframework.web.server.ResponseStatusException(FORBIDDEN, "Forbidden");
    }
    int deleted = faceStorageService.deleteAll(studentId);
    return ApiResponse.ok(Map.of("deleted", deleted > 0, "count", deleted));
  }
}
