package com.blog.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvatarCityStateResponse {
    private List<AvatarCityPlayerResponse> players;
    private List<AvatarCityBuildingOwnerResponse> ownerships;
    private AvatarCitySpawnResponse spawn;
    private int ownerCount;
}
