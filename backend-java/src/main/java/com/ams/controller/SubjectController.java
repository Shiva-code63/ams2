package com.ams.controller;

import com.ams.api.ApiResponse;
import com.ams.dto.SubjectDtos;
import com.ams.dto.StudentDtos;
import com.ams.service.SubjectService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/subjects")
public class SubjectController {
  private final SubjectService subjectService;

  public SubjectController(SubjectService subjectService) {
    this.subjectService = subjectService;
  }

  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Page<SubjectDtos.SubjectResponse>> list(@RequestParam(defaultValue = "0") int page,
                                                            @RequestParam(defaultValue = "50") int size) {
    return ApiResponse.ok(subjectService.list(null, PageRequest.of(page, size)));
  }

  @GetMapping("/search")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Page<SubjectDtos.SubjectResponse>> search(@RequestParam(defaultValue = "0") int page,
                                                              @RequestParam(defaultValue = "50") int size,
                                                              @RequestParam String search) {
    return ApiResponse.ok(subjectService.list(search, PageRequest.of(page, size)));
  }

  @GetMapping("/teacher/{teacherId}")
  public ApiResponse<List<SubjectDtos.SubjectResponse>> listTeacher(@PathVariable Long teacherId) {
    return ApiResponse.ok(subjectService.listByTeacher(teacherId));
  }

  @PostMapping
  @PreAuthorize("hasRole('TEACHER')")
  public ApiResponse<SubjectDtos.SubjectResponse> create(@Valid @RequestBody SubjectDtos.CreateSubjectRequest req) {
    return ApiResponse.ok(subjectService.create(req));
  }

  @DeleteMapping("/{subjectId}")
  @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
  public ApiResponse<Void> delete(@PathVariable Long subjectId) {
    subjectService.delete(subjectId);
    return ApiResponse.ok("Deleted", null);
  }

  @GetMapping("/{subjectId}/students")
  @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
  public ApiResponse<List<StudentDtos.StudentProfileResponse>> listStudents(@PathVariable Long subjectId) {
    return ApiResponse.ok(subjectService.listStudents(subjectId));
  }
}

