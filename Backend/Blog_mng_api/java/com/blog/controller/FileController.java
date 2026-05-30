package com.blog.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/uploads")
public class FileController {

    private final Path fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();

    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            if (!filePath.startsWith(fileStorageLocation)) {
                return ResponseEntity.badRequest().build();
            }
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                String contentType = resolveContentType(filePath);
                String asciiName = toAsciiFilename(filePath.getFileName().toString());

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + asciiName + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    private String resolveContentType(Path filePath) {
        try {
            String probed = Files.probeContentType(filePath);
            if (probed != null && !probed.isBlank()) {
                return probed;
            }
        } catch (java.io.IOException ignored) {
            // fall through to extension map
        }
        String name = filePath.getFileName().toString().toLowerCase();
        if (name.endsWith(".mov")) {
            return "video/quicktime";
        }
        if (name.endsWith(".mp4") || name.endsWith(".m4v")) {
            return "video/mp4";
        }
        if (name.endsWith(".webm")) {
            return "video/webm";
        }
        if (name.endsWith(".ogg")) {
            return "video/ogg";
        }
        if (name.endsWith(".avi")) {
            return "video/x-msvideo";
        }
        if (name.endsWith(".mkv")) {
            return "video/x-matroska";
        }
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (name.endsWith(".png")) {
            return "image/png";
        }
        if (name.endsWith(".gif")) {
            return "image/gif";
        }
        if (name.endsWith(".webp")) {
            return "image/webp";
        }
        if (name.endsWith(".pdf")) {
            return "application/pdf";
        }
        return "application/octet-stream";
    }

    /** Tomcat response headers must be ISO-8859-1; strip unsupported Unicode from filename. */
    private static String toAsciiFilename(String fileName) {
        if (fileName == null) {
            return "download";
        }
        String ascii = fileName.replaceAll("[^\\x20-\\x7E]", "_");
        return ascii.isBlank() ? "download" : ascii;
    }
}
