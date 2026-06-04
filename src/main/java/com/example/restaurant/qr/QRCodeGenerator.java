package com.example.restaurant.qr;

import java.nio.file.FileSystems;
import java.nio.file.Path;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

public class QRCodeGenerator {

    public static void main(String[] args) throws Exception {

        QRCodeWriter qrCodeWriter = new QRCodeWriter();

        for (int table = 1; table <= 7; table++) {
            String url = "http://localhost:8080/index.html?table=" + table;
            BitMatrix bitMatrix = qrCodeWriter.encode(
                    url,
                    BarcodeFormat.QR_CODE,
                    300,
                    300
            );

            Path path = FileSystems.getDefault()
                    .getPath("table" + table + ".png");

            MatrixToImageWriter.writeToPath(
                    bitMatrix,
                    "PNG",
                    path
            );

            System.out.println("Tạo QR cho " + url + " -> " + path);
        }
    }
}
