package com.example.restaurant.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {

    private Integer orderId;
    private Double amount;
    private String payUrl;
    private String qrCodeDataUrl;
    private String message;
}
