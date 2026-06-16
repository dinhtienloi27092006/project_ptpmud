package com.example.restaurant.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.restaurant.entity.PaymentHistory;

public interface PaymentHistoryRepository extends JpaRepository<PaymentHistory, Integer> {

    @Query("SELECT DISTINCT p FROM PaymentHistory p LEFT JOIN FETCH p.items WHERE p.paidAt >= :from AND p.paidAt < :to ORDER BY p.paidAt DESC")
    List<PaymentHistory> findByPaidAtBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
