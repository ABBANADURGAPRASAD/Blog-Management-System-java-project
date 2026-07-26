package com.blog.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvatarCityPlayerResponse {
    private Long userId;
    private double x;
    private double y;
    private String facing;
    private String characterName;
    private String skinColor;
    private String shape;
    private String outfitId;
    private String placeId;
    private String buildingId;
    private boolean self;
    private long updatedAt;
}
