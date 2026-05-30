package com.blog.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    public FileStorageService() {
        this.fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        String originalFileName = file.getOriginalFilename();
        String safeName = sanitizeStoredFileName(originalFileName);
        String fileName = UUID.randomUUID().toString() + "_" + safeName;

        try {
            // Check if the file's name contains invalid characters
            if (fileName.contains("..")) {
                throw new RuntimeException("Sorry! Filename contains invalid path sequence " + fileName);
            }

            // Copy file to the target location (Replacing existing file with the same name)
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return fileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + fileName + ". Please try again!", ex);
        }
    }

    /**
     * Store a profile image keyed by username so each user has a stable file (re-upload replaces it).
     */
    public String storeProfileImage(MultipartFile file, String userName) {
        String safeBase = (userName == null || userName.isBlank()) ? "user" : userName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String ext = extensionOf(file.getOriginalFilename());
        String fileName = safeBase + "_profile" + ext;
        try {
            if (fileName.contains("..")) {
                throw new RuntimeException("Sorry! Filename contains invalid path sequence " + fileName);
            }
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return fileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store profile image " + fileName + ". Please try again!", ex);
        }
    }

    public String storeBackgroundImage(MultipartFile file, String userName) {
        String safeBase = (userName == null || userName.isBlank()) ? "user" : userName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String ext = extensionOf(file.getOriginalFilename());
        String fileName = safeBase + "_banner" + ext;
        try {
            if (fileName.contains("..")) {
                throw new RuntimeException("Sorry! Filename contains invalid path sequence " + fileName);
            }
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return fileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store background image " + fileName + ". Please try again!", ex);
        }
    }

    private static String extensionOf(String originalFileName) {
        if (originalFileName == null || originalFileName.isBlank()) {
            return ".jpg";
        }
        int i = originalFileName.lastIndexOf('.');
        if (i <= 0 || i >= originalFileName.length() - 1) {
            return ".jpg";
        }
        String ext = originalFileName.substring(i).toLowerCase(Locale.ROOT);
        if (ext.length() > 8) {
            return ".jpg";
        }
        return ext;
    }

    /**
     * ASCII-safe stored name (Tomcat headers and URLs cannot use characters like U+202F in filenames).
     */
    static String sanitizeStoredFileName(String originalFileName) {
        if (originalFileName == null || originalFileName.isBlank()) {
            return "file.bin";
        }
        String ext = extensionOf(originalFileName);
        String base = originalFileName;
        int dot = originalFileName.lastIndexOf('.');
        if (dot > 0) {
            base = originalFileName.substring(0, dot);
        }
        base = Normalizer.normalize(base, Normalizer.Form.NFKD);
        base = base.replaceAll("\\p{M}", "");
        base = base.replaceAll("[^a-zA-Z0-9._-]", "_");
        base = base.replaceAll("_+", "_");
        base = base.replaceAll("^_+|_+$", "");
        if (base.isBlank()) {
            base = "file";
        }
        if (base.length() > 80) {
            base = base.substring(0, 80);
        }
        return base + ext;
    }

    public static boolean isVideoExtension(String fileName) {
        if (fileName == null) {
            return false;
        }
        String lower = fileName.toLowerCase(Locale.ROOT);
        return lower.endsWith(".mp4")
                || lower.endsWith(".mov")
                || lower.endsWith(".webm")
                || lower.endsWith(".m4v")
                || lower.endsWith(".avi")
                || lower.endsWith(".mkv")
                || lower.endsWith(".ogg");
    }

    public static boolean isImageExtension(String fileName) {
        if (fileName == null) {
            return false;
        }
        String lower = fileName.toLowerCase(Locale.ROOT);
        return lower.endsWith(".jpg")
                || lower.endsWith(".jpeg")
                || lower.endsWith(".png")
                || lower.endsWith(".gif")
                || lower.endsWith(".webp")
                || lower.endsWith(".bmp");
    }
}
