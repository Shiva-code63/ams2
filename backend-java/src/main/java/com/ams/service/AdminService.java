package com.ams.service;

import com.ams.dto.AdminDtos;
import com.ams.entity.Admin;
import com.ams.repository.AdminRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class AdminService {
  private final AdminRepository adminRepository;
  private final PasswordEncoder passwordEncoder;

  public AdminService(AdminRepository adminRepository, PasswordEncoder passwordEncoder) {
    this.adminRepository = adminRepository;
    this.passwordEncoder = passwordEncoder;
  }

  public AdminDtos.AdminProfileResponse getProfile(Long id) {
    Admin admin = adminRepository.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Admin not found"));
    return new AdminDtos.AdminProfileResponse(admin.getId(), admin.getName(), admin.getEmail(), admin.getPhoneNumber());
  }

  public void updateProfile(Long id, AdminDtos.UpdateAdminProfileRequest req) {
    Admin admin = adminRepository.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Admin not found"));
    admin.setName(req.name().trim());
    String phone = req.phoneNumber();
    if (phone == null) phone = "";
    phone = phone.trim();
    admin.setPhoneNumber(phone);
    adminRepository.save(admin);
  }

  public void changePassword(Long id, String currentPassword, String newPassword) {
    Admin admin = adminRepository.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Admin not found"));
    if (!passwordEncoder.matches(currentPassword, admin.getPasswordHash())) {
      throw new ResponseStatusException(BAD_REQUEST, "Current password is incorrect");
    }
    if (newPassword == null || newPassword.length() < 6) {
      throw new ResponseStatusException(BAD_REQUEST, "New password must be at least 6 characters");
    }
    String hash = passwordEncoder.encode(newPassword);
    admin.setPasswordHash(hash);
    admin.setPassword(hash);
    adminRepository.save(admin);
  }
}
