package com.blog.model.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AnonymousMessageView {
    private Long messageId;
    private boolean fromSelf;
    /** PARTNER or ME — never raw user id until reveal. */
    private String senderLabel;
    private String content;
    private LocalDateTime createdAt;
}
