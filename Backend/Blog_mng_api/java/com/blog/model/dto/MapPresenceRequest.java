package com.blog.model.dto;

import lombok.Data;

@Data
public class MapPresenceRequest {
    private Double latitude;
    private Double longitude;
    private String colorHex;
    /** Must be true to appear on the map (consent). */
    private Boolean visible;
}
