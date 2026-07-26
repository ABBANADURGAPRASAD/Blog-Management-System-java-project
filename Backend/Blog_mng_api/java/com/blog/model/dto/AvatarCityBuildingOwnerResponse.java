package com.blog.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvatarCityBuildingOwnerResponse {
    private String buildingId;
    private Long ownerUserId;
    private String ownerName;
    private boolean mine;
}
