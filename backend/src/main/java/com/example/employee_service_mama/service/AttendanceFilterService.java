package com.example.employee_service_mama.service;

import com.example.employee_service_mama.model.AttendanceCsvFile;
import com.example.employee_service_mama.repository.AttendanceCsvFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceFilterService {

    private final AttendanceCsvFileRepository repo;


public List<AttendanceCsvFile> filterAttendance(String month, String date) {

    List<AttendanceCsvFile> all = repo.findAll();

    Integer targetMonth = null;
    LocalDate targetDate = null;

    // Parse Month (1–12)
    if (month != null && !month.isBlank()) {
        try {
            targetMonth = Integer.parseInt(month); // "12"
        } catch (Exception e) {
            try {
                targetMonth = Month.valueOf(month.toUpperCase()).getValue(); // "DECEMBER"
            } catch (Exception ignore) {}
        }
    }

    // Parse Date (YYYY-MM-DD)
    if (date != null && !date.isBlank()) {
        try {
            targetDate = LocalDate.parse(date);  // browser sends YYYY-MM-DD
        } catch (Exception ignore) {}
    }

    Integer finalMonth = targetMonth;
    LocalDate finalDate = targetDate;

    return all.stream()
            .filter(row -> {

                if (row.getDate() == null || row.getDate().isBlank()) {
                    return false;
                }

                LocalDate recordDate;
                try {
                    recordDate = LocalDate.parse(row.getDate()); // parse DB "YYYY-MM-DD"
                } catch (Exception e) {
                    return false;
                }

                // Filter by date
                if (finalDate != null && !recordDate.equals(finalDate)) {
                    return false;
                }

                // Filter by month
                if (finalMonth != null && recordDate.getMonthValue() != finalMonth) {
                    return false;
                }

                return true;
            })
            .collect(Collectors.toList());
}




    public String updateStatus(int id, String newStatus) {
        AttendanceCsvFile row = repo.findById(id).orElse(null);
        if (row == null) return "Record not found";

        row.setStatus(newStatus);
        repo.save(row);

        return "Status updated";
    }

    public List<AttendanceCsvFile> getAll() {
        return repo.findAll();
    }

}

