package com.ams.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class FaceStorageService {
  private final Path baseDir;

  public FaceStorageService(@Value("${ams2.face.service.upload-dir}") String uploadDir) {
    this.baseDir = Path.of(uploadDir).normalize();
  }

  public boolean isRegistered(Long studentId) {
    Path dir = baseDir.resolve(String.valueOf(studentId));
    if (!Files.isDirectory(dir)) return false;
    try (var stream = Files.list(dir)) {
      return stream.anyMatch(p -> p.getFileName().toString().toLowerCase().endsWith(".jpg"));
    } catch (IOException e) {
      return false;
    }
  }

  public Optional<Path> firstImage(Long studentId) {
    Path dir = baseDir.resolve(String.valueOf(studentId));
    if (!Files.isDirectory(dir)) return Optional.empty();
    try (var stream = Files.list(dir)) {
      return stream
        .filter(p -> p.getFileName().toString().toLowerCase().endsWith(".jpg"))
        .sorted(Comparator.comparing(p -> p.getFileName().toString()))
        .findFirst();
    } catch (IOException e) {
      return Optional.empty();
    }
  }

  public byte[] readImage(Path path) throws IOException {
    return Files.readAllBytes(path);
  }

  public List<String> listImageNames(Long studentId) {
    Path dir = baseDir.resolve(String.valueOf(studentId));
    if (!Files.isDirectory(dir)) return List.of();
    try (var stream = Files.list(dir)) {
      return stream
        .filter(p -> p.getFileName().toString().toLowerCase().endsWith(".jpg"))
        .sorted(Comparator.comparing(p -> p.getFileName().toString()))
        .map(p -> p.getFileName().toString())
        .toList();
    } catch (IOException e) {
      return List.of();
    }
  }

  public int deleteAll(Long studentId) {
    Path dir = baseDir.resolve(String.valueOf(studentId));
    if (!Files.isDirectory(dir)) return 0;
    List<Path> files = new ArrayList<>();
    try (var stream = Files.list(dir)) {
      stream.filter(p -> p.getFileName().toString().toLowerCase().endsWith(".jpg")).forEach(files::add);
    } catch (IOException e) {
      return 0;
    }
    int deleted = 0;
    for (Path p : files) {
      try {
        if (Files.deleteIfExists(p)) deleted += 1;
      } catch (IOException ignored) {
      }
    }
    return deleted;
  }
}
