package com.blog.model;

import lombok.Data;

@Data
public class SendMessageRequest {
    private Long senderId;
    private Long receiverId;
    private String content;
}
