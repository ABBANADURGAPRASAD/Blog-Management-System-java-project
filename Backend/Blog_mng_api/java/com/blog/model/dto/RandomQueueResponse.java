package com.blog.model.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RandomQueueResponse {
    private boolean matched;
    private String sessionPublicId;
    private String ticketPublicId;
    private String message;
}
