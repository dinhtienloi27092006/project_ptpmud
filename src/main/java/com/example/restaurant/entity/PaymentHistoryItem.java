package com.example.restaurant.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "payment_history_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentHistoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String foodName;

    private Integer quantity;

    private Double subtotal;

    @ManyToOne
    @JoinColumn(name = "payment_history_id")
    @JsonBackReference
    private PaymentHistory paymentHistory;
}
