package com.blog.controller;

import com.blog.moderation.CommentModerationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ModerationExceptionHandler {

    @ExceptionHandler(CommentModerationException.class)
    public ResponseEntity<Map<String, Object>> handleCommentModeration(CommentModerationException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", ex.getMessage());
        body.put("moderationStatus", ex.getStatus().name());
        body.put("detectedLabels", ex.getDetectedLabels());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", "File is too large. Maximum upload size is 50MB per file.");
        body.put("maxFileSize", "50MB");
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(body);
    }
}
