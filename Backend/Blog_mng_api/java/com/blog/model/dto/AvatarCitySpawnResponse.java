package com.blog.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvatarCitySpawnResponse {
    private double x;
    private double y;
    /** Null when spawning at city center (no owned building). */
    private String buildingId;
    private int ownerCount;
}
