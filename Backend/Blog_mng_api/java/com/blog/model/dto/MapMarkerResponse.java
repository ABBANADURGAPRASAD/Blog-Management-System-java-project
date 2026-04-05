package com.blog.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** No user id exposed — only opaque token + coordinates + color. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MapMarkerResponse {
    private String markerPublicId;
    private double latitude;
    private double longitude;
    private String colorHex;
}
