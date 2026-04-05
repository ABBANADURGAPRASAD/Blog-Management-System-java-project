package com.blog.model.dto;

import com.blog.model.AnonymousSessionMode;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AnonymousSessionResponse {
    private String sessionPublicId;
    private AnonymousSessionMode mode;
    private boolean revealed;
    private String partnerUserName;
    private String partnerFullName;
    private Long partnerUserId;
}
