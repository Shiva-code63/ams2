package com.ams.service;

import com.ams.dto.AuthDtos;
import com.ams.entity.Admin;
import com.ams.entity.Student;
import com.ams.entity.Teacher;
import com.ams.repository.AdminRepository;
import com.ams.repository.StudentRepository;
import com.ams.repository.TeacherRepository;
import com.ams.security.AppRole;
import com.ams.security.AuthUser;
import com.ams.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class AuthService {
  private final AdminRepository adminRepository;
  private final TeacherRepository teacherRepository;
  private final StudentRepository studentRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AuthService(AdminRepository adminRepository,
                     TeacherRepository teacherRepository,
                     StudentRepository studentRepository,
                     PasswordEncoder passwordEncoder,
                     JwtService jwtService) {
    this.adminRepository = adminRepository;
    this.teacherRepository = teacherRepository;
    this.studentRepository = studentRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  public AuthDtos.LoginResponse login(AuthDtos.LoginRequest req) {
    AppRole role = req.role();
    String email = req.email().trim();
    String password = req.password();

    Long userId;
    String passwordHash;
    String passwordColumn;

    if (role == AppRole.ADMIN) {
      Admin admin = adminRepository.findByEmailIgnoreCase(email).orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid credentials"));
      userId = admin.getId();
      passwordHash = admin.getPasswordHash();
      passwordColumn = admin.getPassword();
      if (!matchesAndMaybeUpgrade(password, passwordHash, passwordColumn, (newHash) -> {
        admin.setPasswordHash(newHash);
        admin.setPassword(newHash);
        adminRepository.save(admin);
      })) {
        throw new ResponseStatusException(UNAUTHORIZED, "Invalid credentials");
      }
    } else if (role == AppRole.TEACHER) {
      Teacher teacher = teacherRepository.findByEmailIgnoreCase(email).orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid credentials"));
      userId = teacher.getId();
      passwordHash = teacher.getPasswordHash();
      passwordColumn = teacher.getPassword();
      if (!matchesAndMaybeUpgrade(password, passwordHash, passwordColumn, (newHash) -> {
        teacher.setPasswordHash(newHash);
        teacher.setPassword(newHash);
        teacherRepository.save(teacher);
      })) {
        throw new ResponseStatusException(UNAUTHORIZED, "Invalid credentials");
      }
    } else {
      Student student = studentRepository.findByCollegeEmailIgnoreCase(email).orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid credentials"));
      userId = student.getId();
      passwordHash = student.getPasswordHash();
      passwordColumn = student.getPassword();
      if (!matchesAndMaybeUpgrade(password, passwordHash, passwordColumn, (newHash) -> {
        student.setPasswordHash(newHash);
        student.setPassword(newHash);
        studentRepository.save(student);
      })) {
        throw new ResponseStatusException(UNAUTHORIZED, "Invalid credentials");
      }
    }

    String token = jwtService.issueToken(new AuthUser(userId, email, role));
    return new AuthDtos.LoginResponse(token, token, role, userId);
  }

  private boolean matchesAndMaybeUpgrade(String rawPassword,
                                        String passwordHash,
                                        String passwordColumn,
                                        java.util.function.Consumer<String> upgrader) {
    // Try bcrypt hashes first (either column can contain the bcrypt hash depending on earlier versions).
    if (looksLikeBcrypt(passwordHash) && passwordEncoder.matches(rawPassword, passwordHash)) return true;
    if (looksLikeBcrypt(passwordColumn) && passwordEncoder.matches(rawPassword, passwordColumn)) return true;

    // Legacy/plaintext fallback: allow exact match, then upgrade to bcrypt.
    boolean legacyMatch = (passwordHash != null && rawPassword.equals(passwordHash))
      || (passwordColumn != null && rawPassword.equals(passwordColumn));

    if (!legacyMatch) return false;

    String newHash = passwordEncoder.encode(rawPassword);
    upgrader.accept(newHash);
    return true;
  }

  private static boolean looksLikeBcrypt(String value) {
    if (value == null) return false;
    // Common BCrypt prefixes: $2a$, $2b$, $2y$
    return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
  }
}
