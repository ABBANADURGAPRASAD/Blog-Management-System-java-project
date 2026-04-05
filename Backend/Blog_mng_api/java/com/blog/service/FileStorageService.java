package com.blog.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
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
        // Normalize file name
        String originalFileName = file.getOriginalFilename();
        // Generate a unique file name to avoid collisions
        String fileName = UUID.randomUUID().toString() + "_" + originalFileName;

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
        String ext = originalFileName.substring(i);
        if (ext.length() > 8) {
            return ".jpg";
        }
        return ext;
    }
}
