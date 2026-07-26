package com.blog.controller;

import com.blog.model.dto.AvatarCityBuildingOwnerResponse;
import com.blog.model.dto.AvatarCityPlayerResponse;
import com.blog.model.dto.AvatarCityPresenceRequest;
import com.blog.model.dto.AvatarCitySpawnResponse;
import com.blog.model.dto.AvatarCityStateResponse;
import com.blog.service.AvatarCityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Single shared Avatar City — players meet on one map; one building per user.
 */
@RestController
@RequestMapping("/api/avatar-city")
public class AvatarCityController {

    private final AvatarCityService avatarCityService;

    @Autowired
    public AvatarCityController(AvatarCityService avatarCityService) {
        this.avatarCityService = avatarCityService;
    }

    @PutMapping("/presence")
    public ResponseEntity<?> upsert(
            @RequestParam Long userId,
            @RequestBody AvatarCityPresenceRequest body
    ) {
        try {
            avatarCityService.updatePresence(userId, body);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/presence")
    public ResponseEntity<Void> leave(@RequestParam Long userId) {
        avatarCityService.leave(userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/players")
    public List<AvatarCityPlayerResponse> players(
            @RequestParam(required = false) Long viewerUserId
    ) {
        return avatarCityService.listPlayers(viewerUserId);
    }

    @GetMapping("/state")
    public AvatarCityStateResponse state(@RequestParam(required = false) Long viewerUserId) {
        return avatarCityService.getState(viewerUserId);
    }

    @GetMapping("/spawn")
    public AvatarCitySpawnResponse spawn(@RequestParam Long userId) {
        return avatarCityService.getSpawn(userId);
    }

    @GetMapping("/buildings")
    public List<AvatarCityBuildingOwnerResponse> buildings(
            @RequestParam(required = false) Long viewerUserId
    ) {
        return avatarCityService.listOwnerships(viewerUserId);
    }

    @PostMapping("/buildings/{buildingId}/claim")
    public ResponseEntity<?> claim(
            @RequestParam Long userId,
            @PathVariable String buildingId,
            @RequestParam(required = false) String ownerName
    ) {
        try {
            return ResponseEntity.ok(
                    avatarCityService.claimBuilding(userId, buildingId, ownerName)
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/buildings/mine")
    public ResponseEntity<Void> release(@RequestParam Long userId) {
        avatarCityService.releaseBuilding(userId);
        return ResponseEntity.ok().build();
    }
}
