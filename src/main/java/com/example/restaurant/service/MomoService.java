package com.example.restaurant.service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import com.example.restaurant.dto.PaymentResponse;
import com.example.restaurant.entity.Order;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

@Service
public class MomoService {

    @Value("${momo.partner-code:}")
    private String partnerCode;

    @Value("${momo.access-key:}")
    private String accessKey;

    @Value("${momo.secret-key:}")
    private String secretKey;

    @Value("${momo.endpoint:https://test-payment.momo.vn/v2/gateway/api/create}")
    private String momoEndpoint;

    @Value("${momo.return-url:http://localhost:8080/}")
    private String returnUrl;

    @Value("${momo.notify-url:http://localhost:8080/api/orders/momo/notify}")
    private String notifyUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public PaymentResponse createPayment(Order order) {
        Double totalPrice = order.getTotalPrice();
        double totalAmount = totalPrice != null ? totalPrice : 0.0;
        String amount = String.valueOf(Math.round(totalAmount));
        String orderInfo = "Thanh toán đơn bàn " + order.getTable().getTableNumber();
        String requestId = "ORDER_" + order.getId() + "_" + System.currentTimeMillis();
        String extraData = "orderId=" + order.getId();
        String payUrl;

        if (!StringUtils.hasText(partnerCode) || !StringUtils.hasText(accessKey) || !StringUtils.hasText(secretKey)) {
            payUrl = "https://momo.vn/?amount=" + amount + "&orderId=" + order.getId();
        } else {
            try {
                Map<String, String> requestBody = new HashMap<>();
                requestBody.put("partnerCode", partnerCode);
                requestBody.put("accessKey", accessKey);
                requestBody.put("requestId", requestId);
                requestBody.put("amount", amount);
                requestBody.put("orderId", requestId);
                requestBody.put("orderInfo", orderInfo);
                requestBody.put("returnUrl", returnUrl);
                requestBody.put("notifyUrl", notifyUrl);
                requestBody.put("extraData", extraData);
                requestBody.put("requestType", "captureMoMoWallet");

                String rawData = String.format(
                        "accessKey=%s&amount=%s&extraData=%s&notifyUrl=%s&orderId=%s&orderInfo=%s&partnerCode=%s&returnUrl=%s&requestId=%s&requestType=%s",
                        accessKey,
                        amount,
                        extraData,
                        notifyUrl,
                        requestId,
                        orderInfo,
                        partnerCode,
                        returnUrl,
                        requestId,
                        "captureMoMoWallet");

                requestBody.put("signature", hmacSHA256(rawData, secretKey));

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(requestBody, headers);
                ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                        momoEndpoint,
                        HttpMethod.POST,
                        requestEntity,
                        new ParameterizedTypeReference<Map<String, Object>>() {
                        });

                Map<String, Object> responseBody = response.getBody();
                if (response.getStatusCode().is2xxSuccessful() && responseBody != null && responseBody.get("payUrl") != null) {
                    payUrl = responseBody.get("payUrl").toString();
                } else {
                    payUrl = "https://momo.vn/?amount=" + amount + "&orderId=" + order.getId();
                }
            } catch (Exception e) {
                payUrl = "https://momo.vn/?amount=" + amount + "&orderId=" + order.getId();
            }
        }

        String qrCodeDataUrl = generateQrCodeDataUrl(payUrl, 300, 300);
        return new PaymentResponse(order.getId(), Double.valueOf(amount), payUrl, qrCodeDataUrl,
                "Quét mã MoMo hoặc mở liên kết để thanh toán.");
    }

    private String hmacSHA256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return bytesToHex(hash);
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte aByte : bytes) {
            result.append(String.format("%02x", aByte));
        }
        return result.toString();
    }

    private String generateQrCodeDataUrl(String text, int width, int height) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, width, height);
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            String base64 = Base64.getEncoder().encodeToString(outputStream.toByteArray());
            return "data:image/png;base64," + base64;
        } catch (WriterException e) {
            throw new RuntimeException("Không thể tạo mã QR", e);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi sinh QR code", e);
        }
    }
}
