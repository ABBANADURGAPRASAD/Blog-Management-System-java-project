package com.blog.model.dto;

import com.blog.model.MapMarkerStatus;
import lombok.Data;

@Data
public class MapPresenceRequest {
    private Double latitude;
    private Double longitude;
    private String colorHex;
    /** Must be true to appear on the map (consent). */
    private Boolean visible;
    /** When visible, whether others can connect (AVAILABLE) or not (BUSY). */
    private MapMarkerStatus mapStatus;
}
