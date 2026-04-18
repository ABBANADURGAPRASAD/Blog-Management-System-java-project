package com.blog.model.dto;

import com.blog.model.MapMarkerStatus;
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
    private MapMarkerStatus status;
    /** e.g. User #2847 — derived from token, not the real user id. */
    private String displayLabel;
    /** True when the requesting viewer owns this marker. */
    private boolean self;
}
