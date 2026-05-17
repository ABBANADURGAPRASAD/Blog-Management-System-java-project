package com.blog.controller;

import com.blog.moderation.CommentModerationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

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
}
