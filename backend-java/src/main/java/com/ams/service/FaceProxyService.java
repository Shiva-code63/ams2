package com.ams.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;
import reactor.netty.http.client.HttpClient;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@Service
public class FaceProxyService {
  private final WebClient webClient;
  private final String baseUrl;

  public FaceProxyService(@Value("${ams2.face.service.base-url}") String baseUrl) {
    this.baseUrl = baseUrl;
    HttpClient httpClient = HttpClient.create()
      .responseTimeout(Duration.ofSeconds(120));
    this.webClient = WebClient.builder()
      .baseUrl(baseUrl)
      .clientConnector(new ReactorClientHttpConnector(httpClient))
      .build();
  }

  public Map<String, Object> health() {
    try {
      return webClient.get()
        .uri("/health")
        .retrieve()
        .bodyToMono(Map.class)
        .timeout(Duration.ofSeconds(3))
        .block();
    } catch (Exception ex) {
      throw faceUnavailable(ex);
    }
  }

  public Map<String, Object> registerFace(Long studentId, List<MultipartFile> files) {
    if (files == null || files.isEmpty()) throw new ResponseStatusException(BAD_REQUEST, "No files uploaded");
    // Fail fast with a clear message if the face service isn't running.
    health();
    MultipartBodyBuilder builder = new MultipartBodyBuilder();
    builder.part("studentId", String.valueOf(studentId));
    for (MultipartFile f : files) {
      builder.part("files", toResource(f)).filename(safeName(f.getOriginalFilename())).contentType(MediaType.parseMediaType(defaultType(f)));
    }
    try {
      return webClient.post()
        .uri("/register-face")
        .contentType(MediaType.MULTIPART_FORM_DATA)
        .body(BodyInserters.fromMultipartData(builder.build()))
        .retrieve()
        .bodyToMono(Map.class)
        .block();
    } catch (WebClientResponseException ex) {
      throw mapFaceError(ex);
    } catch (Exception ex) {
      throw faceUnavailable(ex);
    }
  }

  public Map<String, Object> verifyFace(Long studentId, List<MultipartFile> frames) {
    if (frames == null || frames.isEmpty()) throw new ResponseStatusException(BAD_REQUEST, "No frames uploaded");
    health();
    MultipartBodyBuilder builder = new MultipartBodyBuilder();
    builder.part("studentId", String.valueOf(studentId));
    for (MultipartFile f : frames) {
      builder.part("frames", toResource(f)).filename(safeName(f.getOriginalFilename())).contentType(MediaType.parseMediaType(defaultType(f)));
    }
    try {
      return webClient.post()
        .uri("/verify-face")
        .contentType(MediaType.MULTIPART_FORM_DATA)
        .body(BodyInserters.fromMultipartData(builder.build()))
        .retrieve()
        .bodyToMono(Map.class)
        .block();
    } catch (WebClientResponseException ex) {
      throw mapFaceError(ex);
    } catch (Exception ex) {
      throw faceUnavailable(ex);
    }
  }

  private ResponseStatusException faceUnavailable(Exception ex) {
    String reason = ex.getMessage();
    if (ex.getCause() != null && ex.getCause().getMessage() != null) reason = ex.getCause().getMessage();
    String msg = "Face service unavailable at " + baseUrl + " (start python-face-service).";
    if (reason != null && !reason.isBlank()) msg += " " + reason;
    return new ResponseStatusException(SERVICE_UNAVAILABLE, msg, ex);
  }

  private static ResponseStatusException mapFaceError(WebClientResponseException ex) {
    String body = ex.getResponseBodyAsString();
    String msg = (body == null || body.isBlank()) ? ex.getMessage() : body;
    HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
    if (status == null) status = BAD_REQUEST;
    return new ResponseStatusException(status, "Face service error: " + msg, ex);
  }

  private static ByteArrayResource toResource(MultipartFile file) {
    try {
      byte[] bytes = file.getBytes();
      return new ByteArrayResource(bytes) {
        @Override
        public String getFilename() {
          return safeName(file.getOriginalFilename());
        }
      };
    } catch (IOException e) {
      throw new ResponseStatusException(BAD_REQUEST, "Invalid upload");
    }
  }

  private static String safeName(String name) {
    if (name == null || name.trim().isEmpty()) return "upload.jpg";
    return name.replace("\\", "_").replace("/", "_");
  }

  private static String defaultType(MultipartFile f) {
    String ct = f.getContentType();
    return (ct == null || ct.isBlank()) ? "image/jpeg" : ct;
  }
}
