package com.ams.service;

import com.ams.dto.AdminDtos;
import com.ams.entity.AttendanceRecord;
import com.ams.repository.AttendanceRepository;
import com.ams.repository.StudentRepository;
import com.ams.repository.SubjectRepository;
import com.ams.repository.TeacherRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;

@Service
public class DashboardService {
  private final StudentRepository studentRepository;
  private final TeacherRepository teacherRepository;
  private final SubjectRepository subjectRepository;
  private final AttendanceRepository attendanceRepository;

  public DashboardService(StudentRepository studentRepository,
                          TeacherRepository teacherRepository,
                          SubjectRepository subjectRepository,
                          AttendanceRepository attendanceRepository) {
    this.studentRepository = studentRepository;
    this.teacherRepository = teacherRepository;
    this.subjectRepository = subjectRepository;
    this.attendanceRepository = attendanceRepository;
  }

  public AdminDtos.DashboardStats adminStats() {
    long totalStudents = studentRepository.count();
    long totalTeachers = teacherRepository.count();
    long totalSubjects = subjectRepository.count();
    long totalAttendance = attendanceRepository.count();

    List<AttendanceRecord> all = attendanceRepository.findAll();
    long present = all.stream().filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus())).count();
    long absent = all.stream().filter(a -> "ABSENT".equalsIgnoreCase(a.getStatus())).count();
    double avg = totalAttendance == 0 ? 0.0 : (present * 100.0) / totalAttendance;

    Object weeklyTrend = buildWeeklyTrend(all);
    Object monthlyAttendance = buildMonthlyAttendance(all);

    return new AdminDtos.DashboardStats(
      totalStudents,
      totalTeachers,
      totalSubjects,
      totalAttendance,
      avg,
      present,
      absent,
      weeklyTrend,
      monthlyAttendance
    );
  }

  private static List<Map<String, Object>> buildWeeklyTrend(List<AttendanceRecord> all) {
    LocalDate today = LocalDate.now();
    LocalDate start = today.minusDays(6);
    Map<LocalDate, long[]> bucket = new LinkedHashMap<>();
    for (int i = 0; i < 7; i += 1) {
      LocalDate d = start.plusDays(i);
      bucket.put(d, new long[]{0, 0}); // present, total
    }
    for (AttendanceRecord a : all) {
      LocalDate d = a.getAttendanceDate();
      if (d == null || d.isBefore(start) || d.isAfter(today)) continue;
      long[] v = bucket.get(d);
      if (v == null) continue;
      v[1] += 1;
      if ("PRESENT".equalsIgnoreCase(a.getStatus())) v[0] += 1;
    }
    List<Map<String, Object>> out = new ArrayList<>();
    for (var entry : bucket.entrySet()) {
      LocalDate d = entry.getKey();
      long present = entry.getValue()[0];
      long total = entry.getValue()[1];
      double pct = total == 0 ? 0.0 : Math.round(((present * 100.0) / total) * 10.0) / 10.0;
      out.add(Map.of(
        "name", d.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
        "attendance", pct
      ));
    }
    return out;
  }

  private static List<Map<String, Object>> buildMonthlyAttendance(List<AttendanceRecord> all) {
    YearMonth current = YearMonth.now();
    Map<YearMonth, long[]> bucket = new LinkedHashMap<>();
    for (int i = 11; i >= 0; i -= 1) {
      YearMonth ym = current.minusMonths(i);
      bucket.put(ym, new long[]{0, 0});
    }
    for (AttendanceRecord a : all) {
      if (a.getAttendanceDate() == null) continue;
      YearMonth ym = YearMonth.from(a.getAttendanceDate());
      long[] v = bucket.get(ym);
      if (v == null) continue;
      v[1] += 1;
      if ("PRESENT".equalsIgnoreCase(a.getStatus())) v[0] += 1;
    }
    List<Map<String, Object>> out = new ArrayList<>();
    for (var entry : bucket.entrySet()) {
      YearMonth ym = entry.getKey();
      long present = entry.getValue()[0];
      long total = entry.getValue()[1];
      double pct = total == 0 ? 0.0 : Math.round(((present * 100.0) / total) * 10.0) / 10.0;
      out.add(Map.of(
        "month", ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
        "value", pct
      ));
    }
    return out;
  }
}

