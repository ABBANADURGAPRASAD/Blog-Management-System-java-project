package com.blog.service;

import com.blog.model.dto.AvatarCityBuildingOwnerResponse;
import com.blog.model.dto.AvatarCityPlayerResponse;
import com.blog.model.dto.AvatarCityPresenceRequest;
import com.blog.model.dto.AvatarCitySpawnResponse;
import com.blog.model.dto.AvatarCityStateResponse;

import java.util.List;

public interface AvatarCityService {
    void updatePresence(Long userId, AvatarCityPresenceRequest body);

    void leave(Long userId);

    List<AvatarCityPlayerResponse> listPlayers(Long viewerUserId);

    AvatarCityStateResponse getState(Long viewerUserId);

    AvatarCitySpawnResponse getSpawn(Long userId);

    List<AvatarCityBuildingOwnerResponse> listOwnerships(Long viewerUserId);

    AvatarCityBuildingOwnerResponse claimBuilding(Long userId, String buildingId, String ownerName);

    void releaseBuilding(Long userId);

    int ownerCount();
}
