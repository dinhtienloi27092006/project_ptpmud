package com.example.restaurant.qr;

import java.nio.file.FileSystems;
import java.nio.file.Path;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

public class QRCodeGenerator {

    public static void main(String[] args) throws Exception {

        String url =
                "http://localhost:8080/index.html?table=1";

        QRCodeWriter qrCodeWriter = new QRCodeWriter();

        BitMatrix bitMatrix = qrCodeWriter.encode(
                url,
                BarcodeFormat.QR_CODE,
                300,
                300
        );

        Path path = FileSystems.getDefault()
                .getPath("table1.png");

        MatrixToImageWriter.writeToPath(
                bitMatrix,
                "PNG",
                path
        );

        System.out.println("Tạo QR thành công");
    }
}
