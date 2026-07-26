package com.blog.model.dto;

import lombok.Data;

@Data
public class AvatarCityPresenceRequest {
    /** World X in Avatar City pixels. */
    private Double x;
    /** World Y in Avatar City pixels. */
    private Double y;
    /** front | back | left | right */
    private String facing;
    private String characterName;
    private String skinColor;
    private String shape;
    private String outfitId;
    private String placeId;
}
