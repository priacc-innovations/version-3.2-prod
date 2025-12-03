package com.example.employee_service_mama.service;

import com.example.employee_service_mama.model.Attendance;
import com.example.employee_service_mama.model.Users;
import com.example.employee_service_mama.repository.AttendanceRepository;
import com.example.employee_service_mama.repository.LeaveRequestsRepository;
import com.example.employee_service_mama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final LeaveRequestsRepository leaveRepository;

    private final LocalTime LOGIN_START = LocalTime.of(9, 0);
    private final LocalTime FULL_PRESENT_LIMIT = LocalTime.of(9, 5);
    private final LocalTime AUTO_LOGOUT_TIME = LocalTime.of(18, 30);
    private final int FULL_DAY_HOURS = 9;
    private final int MIN_HOURS = 5;

    private boolean isWeekend(LocalDate date) {
        return date.getDayOfWeek().name().equals("SATURDAY") ||
                date.getDayOfWeek().name().equals("SUNDAY");
    }

    private long workedHours(LocalTime login, LocalTime logout) {
        return Duration.between(login, logout).toHours();
    }

    // LOGIN
    // LOGIN (corrected to prevent duplicate entries)
    public synchronized String login(Integer userId) {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User Not Found"));

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        boolean isOnLeave = leaveRepository.existsApprovedLeaveForDate(userId, today);
        if (isOnLeave) {
            return "You are on approved leave today — Login not allowed";
        }
        if (isWeekend(today)) return "Weekend — Login not allowed";
        if (now.isBefore(LOGIN_START)) return "Login not allowed before 9:00 AM";


        boolean exists = attendanceRepository.existsByUserIdAndDate(userId, today);

        if (exists) {
            Attendance att = attendanceRepository.findByUserIdAndDate(userId, today);

            if (att.getLogoutTime() == null) {
                return "Already logged in today";
            }
            return "You have already logged out today — cannot login again";
        }

        Attendance attendance = Attendance.builder()
                .user(user)
                .empid(user.getEmpid())
                .date(today)
                .loginTime(now)
                .status("PRESENT")
                .remarks("Login Recorded")
                .build();

        try {
            attendanceRepository.save(attendance);
        } catch (Exception e) {
            return "Already logged in today";
        }

        return "Login Successful";
    }

    // LOGOUT Method
    public synchronized String logout(Integer userId) {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        if (isWeekend(today)) return "Weekend — Logout not needed";
        boolean isOnLeave = leaveRepository.existsApprovedLeaveForDate(userId, today);
        if (isOnLeave) {
            return "You are on approved leave today — Logout not needed";
        }
        Attendance att = attendanceRepository.findByUserIdAndDate(userId, today);

        if (att == null) {
            return "You did not login today";
        }

        if (att.getLogoutTime() != null) {
            return "You have already logged out today";
        }

        att.setLogoutTime(now);

        long hours = workedHours(att.getLoginTime(), now);

        LocalTime login = att.getLoginTime();

        // ⭐ Special Full Day Rule ⭐
        // Login between 09:00 - 09:05  AND Logout after 18:00
        if (!login.isAfter(FULL_PRESENT_LIMIT) && !now.isBefore(LocalTime.of(18, 0))) {
            att.setStatus("PRESENT");
            att.setRemarks("Full Day Present — Time Condition Met");
        } else {
            // 🔹 Default Logic
            if (hours < MIN_HOURS) {
                att.setStatus("ABSENT");
                att.setRemarks("Logout — Worked: " + hours + " Hrs | ABSENT");
            } else {
                if (login.isAfter(FULL_PRESENT_LIMIT)) {
                    att.setStatus("HALF_DAY");
                    att.setRemarks("Logout — Late Login | HALF DAY");
                } else {
                    String status = (hours >= FULL_DAY_HOURS) ? "PRESENT" : "HALF_DAY";
                    att.setStatus(status);
                    att.setRemarks("Logout — Worked: " + hours + " Hrs | " + status);
                }
            }
        }

        attendanceRepository.save(att);
        return "Logout Updated: " + att.getStatus();
    }



    // 1:05 PM AUTO ABSENT
    @Scheduled(cron = "0 5 13 * * MON-FRI")
    public void autoAbsentAfter1PM() {
        LocalDate today = LocalDate.now();
        if (isWeekend(today)) return;

        List<Users> users = userRepository.findAll();
        for (Users user : users) {
            Attendance att = attendanceRepository.findByUserIdAndDate(user.getId(), today);

            if (att == null) {
                Attendance a = Attendance.builder()
                        .user(user)
                        .empid(user.getEmpid())
                        .date(today)
                        .status("ABSENT")
                        .remarks("Auto Absent — No Login Before 1 PM")
                        .build();
                attendanceRepository.save(a);
            }
        }
    }

    // 6:30 PM AUTO LOGOUT
    @Scheduled(cron = "0 35 18 * * MON-FRI")
    public void autoLogoutForForgotUsers() {
        LocalDate today = LocalDate.now();
        if (isWeekend(today)) return;

        List<Users> users = userRepository.findAll();
        for (Users user : users) {
            Attendance att = attendanceRepository.findByUserIdAndDate(user.getId(), today);

            if (att != null && att.getLoginTime() != null && att.getLogoutTime() == null) {

                att.setLogoutTime(AUTO_LOGOUT_TIME);
                long hours = workedHours(att.getLoginTime(), AUTO_LOGOUT_TIME);

                if (hours < MIN_HOURS) {
                    att.setStatus("ABSENT");
                    att.setRemarks("Auto Absent — Less than 5 Hours");
                } else {
                    att.setStatus(att.getLoginTime().isAfter(FULL_PRESENT_LIMIT)
                            ? "HALF_DAY"
                            : "HALF_DAY");
                    att.setRemarks("Auto Logout — Half Day (Forgot Logout)");
                }

                attendanceRepository.save(att);
            }
        }
    }

    // WEEKEND MARKING
    @Scheduled(cron = "0 1 0 * * *") // 00:01 AM
    public void markWeekendDays() {
        LocalDate today = LocalDate.now();
        if (!isWeekend(today)) return;

        List<Users> users = userRepository.findAll();
        for (Users user : users) {
            Attendance att = attendanceRepository.findByUserIdAndDate(user.getId(), today);

            if (att == null) {
                att = Attendance.builder()
                        .user(user)
                        .empid(user.getEmpid())
                        .date(today)
                        .status("WEEKEND")
                        .remarks("Auto Weekend Marked")
                        .build();
                attendanceRepository.save(att);
            }
        }
    }

    // SANDWICH POLICY — Friday or Monday Absent → Sat & Sun Absent
    @Scheduled(cron = "0 10 0 * * *") // 12:10 AM Daily
    public void sandwichPolicyFix() {
        LocalDate today = LocalDate.now();
        List<Users> users = userRepository.findAll();

        for (Users user : users) {

            LocalDate friday = today.with(java.time.DayOfWeek.FRIDAY);
            if (friday.isAfter(today)) friday = friday.minusWeeks(1);

            LocalDate saturday = friday.plusDays(1);
            LocalDate sunday = friday.plusDays(2);
            LocalDate monday = friday.plusDays(3);

            Attendance friAtt = attendanceRepository.findByUserIdAndDate(user.getId(), friday);
            Attendance monAtt = attendanceRepository.findByUserIdAndDate(user.getId(), monday);

            boolean isFridayAbsent = friAtt != null && "ABSENT".equals(friAtt.getStatus());
            boolean isMondayAbsent = monAtt != null && "ABSENT".equals(monAtt.getStatus());

            // Apply sandwich for both cases
            if (isFridayAbsent || isMondayAbsent) {
                markAbsentOrUpdate(user, saturday);
                markAbsentOrUpdate(user, sunday);
            }
        }
    }

    private void markAbsentOrUpdate(Users user, LocalDate date) {
        Attendance att = attendanceRepository.findByUserIdAndDate(user.getId(), date);

        if (att == null) {
            att = Attendance.builder()
                    .user(user)
                    .empid(user.getEmpid())
                    .date(date)
                    .remarks("Sandwich Applied")
                    .build();
        } else {
            att.setRemarks("Sandwich Applied");
        }

        att.setStatus("ABSENT");
        attendanceRepository.save(att);
    }
    public List<Attendance> getAllAttendance(String search, String date) {
        String safeDate = (date == null || date.isBlank()) ? null : date;

        String searchText = (search == null || search.isBlank()) ? null : search;

        if (safeDate == null && searchText == null)
            return attendanceRepository.findAll();

        return attendanceRepository.findAllFiltered(searchText, safeDate);
    }
    // REPORTS
    public List<Attendance> getAttendanceByUserId(Integer userId) {
        return attendanceRepository.findAttendanceHistory(userId);
    }

    public Attendance getTodayAttendance(Integer userId) {
        return attendanceRepository.findByUserIdAndDate(userId, LocalDate.now());
    }

    public Integer presentdays(Integer userId) {
        return attendanceRepository.findByPresentDays(userId);
    }

    public Integer absentdays(Integer userId) {
        return attendanceRepository.findByAbsentDays(userId);
    }

    public Integer halfdays(Integer userId) {
        return attendanceRepository.findByHalfDays(userId);
    }

    public Integer late(Integer userId) {
        return attendanceRepository.findLateLoginDays(userId, FULL_PRESENT_LIMIT);
    }

    public List<Attendance> getAttendancehistory(Integer userId) {
        return attendanceRepository.findAttendanceHistory(userId);
    }
}