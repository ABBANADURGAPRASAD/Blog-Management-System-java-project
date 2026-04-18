package com.blog.model.dto;

import com.blog.model.GenderPreference;
import lombok.Data;

@Data
public class RandomMatchRequest {
    private Double latitude;
    private Double longitude;
    private GenderPreference seeking;
    /** Max distance in km to match (default 100 server-side if null). */
    private Double maxDistanceKm;
}
