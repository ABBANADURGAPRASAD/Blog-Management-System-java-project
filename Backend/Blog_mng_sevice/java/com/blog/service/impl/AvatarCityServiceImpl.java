package com.blog.service.impl;

import com.blog.model.dto.AvatarCityBuildingOwnerResponse;
import com.blog.model.dto.AvatarCityPlayerResponse;
import com.blog.model.dto.AvatarCityPresenceRequest;
import com.blog.model.dto.AvatarCitySpawnResponse;
import com.blog.model.dto.AvatarCityStateResponse;
import com.blog.service.AvatarCityService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Shared Avatar City — one map for all players + one building per user.
 */
@Service
public class AvatarCityServiceImpl implements AvatarCityService {

    private static final long STALE_MS = 15_000L;
    private static final double WORLD_W = 3600;
    private static final double WORLD_H = 2800;
    private static final double CENTER_X = 1800;
    private static final double CENTER_Y = 1560;

    /** Known ownable building ids → door spawn (must match frontend city-map.data). */
    private static final Map<String, double[]> BUILDING_SPAWNS = new LinkedHashMap<>();

    static {
        // homes row A
        BUILDING_SPAWNS.put("home-a1", new double[]{220, 1218});
        BUILDING_SPAWNS.put("home-a2", new double[]{400, 1218});
        BUILDING_SPAWNS.put("home-a3", new double[]{580, 1218});
        BUILDING_SPAWNS.put("home-a4", new double[]{760, 1218});
        // homes row B
        BUILDING_SPAWNS.put("home-b1", new double[]{220, 1458});
        BUILDING_SPAWNS.put("home-b2", new double[]{400, 1458});
        BUILDING_SPAWNS.put("home-b3", new double[]{580, 1458});
        BUILDING_SPAWNS.put("home-b4", new double[]{760, 1458});
        // mall
        BUILDING_SPAWNS.put("mall-cafe", new double[]{2420, 358});
        BUILDING_SPAWNS.put("mall-books", new double[]{2640, 358});
        BUILDING_SPAWNS.put("mall-gear", new double[]{2860, 358});
        BUILDING_SPAWNS.put("mall-arcade", new double[]{2520, 558});
        // expansion
        BUILDING_SPAWNS.put("exp-1", new double[]{2420, 2198});
        BUILDING_SPAWNS.put("exp-2", new double[]{2640, 2198});
        BUILDING_SPAWNS.put("exp-3", new double[]{2860, 2198});
        BUILDING_SPAWNS.put("exp-4", new double[]{2520, 2418});
    }

    private static final Set<String> EXPANSION_AT_2 = Set.of("exp-1", "exp-2");
    private static final Set<String> EXPANSION_AT_4 = Set.of("exp-3", "exp-4");

    private final ConcurrentHashMap<Long, Presence> players = new ConcurrentHashMap<>();
    /** buildingId → ownership (persists while server runs). */
    private final ConcurrentHashMap<String, Ownership> ownershipByBuilding = new ConcurrentHashMap<>();
    /** userId → buildingId (one building per user). */
    private final ConcurrentHashMap<Long, String> buildingByUser = new ConcurrentHashMap<>();

    @Override
    public void updatePresence(Long userId, AvatarCityPresenceRequest body) {
        if (userId == null || body == null || body.getX() == null || body.getY() == null) {
            throw new IllegalArgumentException("userId, x, and y are required");
        }
        double x = clamp(body.getX(), 40, WORLD_W - 40);
        double y = clamp(body.getY(), 40, WORLD_H - 40);
        String facing = normalizeFacing(body.getFacing());
        String name = trimTo(body.getCharacterName(), 32, "Traveler");
        String skin = trimTo(body.getSkinColor(), 16, "#FFDFC4");
        String shape = trimTo(body.getShape(), 16, "ROUND");
        String outfit = trimTo(body.getOutfitId(), 32, "uni-tee");
        String placeId = body.getPlaceId() == null ? "" : body.getPlaceId().trim();
        String owned = buildingByUser.get(userId);

        players.put(userId, new Presence(
                userId, x, y, facing, name, skin, shape, outfit, placeId, owned, System.currentTimeMillis()
        ));
        pruneStale();
    }

    @Override
    public void leave(Long userId) {
        if (userId != null) {
            players.remove(userId);
        }
    }

    @Override
    public List<AvatarCityPlayerResponse> listPlayers(Long viewerUserId) {
        pruneStale();
        List<AvatarCityPlayerResponse> out = new ArrayList<>();
        for (Presence p : players.values()) {
            out.add(toPlayer(p, viewerUserId));
        }
        return out;
    }

    @Override
    public AvatarCityStateResponse getState(Long viewerUserId) {
        return AvatarCityStateResponse.builder()
                .players(listPlayers(viewerUserId))
                .ownerships(listOwnerships(viewerUserId))
                .spawn(getSpawn(viewerUserId))
                .ownerCount(ownerCount())
                .build();
    }

    @Override
    public AvatarCitySpawnResponse getSpawn(Long userId) {
        int owners = ownerCount();
        if (userId != null) {
            String buildingId = buildingByUser.get(userId);
            if (buildingId != null) {
                double[] xy = BUILDING_SPAWNS.get(buildingId);
                if (xy != null) {
                    return AvatarCitySpawnResponse.builder()
                            .x(xy[0])
                            .y(xy[1])
                            .buildingId(buildingId)
                            .ownerCount(owners)
                            .build();
                }
            }
        }
        return AvatarCitySpawnResponse.builder()
                .x(CENTER_X)
                .y(CENTER_Y)
                .buildingId(null)
                .ownerCount(owners)
                .build();
    }

    @Override
    public List<AvatarCityBuildingOwnerResponse> listOwnerships(Long viewerUserId) {
        List<AvatarCityBuildingOwnerResponse> out = new ArrayList<>();
        for (Map.Entry<String, Ownership> e : ownershipByBuilding.entrySet()) {
            Ownership o = e.getValue();
            out.add(AvatarCityBuildingOwnerResponse.builder()
                    .buildingId(e.getKey())
                    .ownerUserId(o.userId)
                    .ownerName(o.ownerName)
                    .mine(viewerUserId != null && viewerUserId.equals(o.userId))
                    .build());
        }
        return out;
    }

    @Override
    public synchronized AvatarCityBuildingOwnerResponse claimBuilding(
            Long userId,
            String buildingId,
            String ownerName
    ) {
        if (userId == null || buildingId == null || buildingId.isBlank()) {
            throw new IllegalArgumentException("userId and buildingId are required");
        }
        String id = buildingId.trim();
        if (!BUILDING_SPAWNS.containsKey(id)) {
            throw new IllegalArgumentException("Unknown building");
        }
        int owners = ownerCount();
        if (EXPANSION_AT_2.contains(id) && owners < 2) {
            throw new IllegalStateException("District unlocks after 2 citizens own homes");
        }
        if (EXPANSION_AT_4.contains(id) && owners < 4) {
            throw new IllegalStateException("District unlocks after 4 citizens own homes");
        }

        String already = buildingByUser.get(userId);
        if (already != null && !already.equals(id)) {
            throw new IllegalStateException("You already own a building — release it first");
        }
        if (already != null) {
            Ownership mine = ownershipByBuilding.get(id);
            return AvatarCityBuildingOwnerResponse.builder()
                    .buildingId(id)
                    .ownerUserId(userId)
                    .ownerName(mine != null ? mine.ownerName : trimTo(ownerName, 32, "Citizen"))
                    .mine(true)
                    .build();
        }

        Ownership existing = ownershipByBuilding.get(id);
        if (existing != null && !existing.userId.equals(userId)) {
            throw new IllegalStateException("Building already adopted by " + existing.ownerName);
        }

        String name = trimTo(ownerName, 32, "Citizen");
        ownershipByBuilding.put(id, new Ownership(userId, name));
        buildingByUser.put(userId, id);

        Presence p = players.get(userId);
        if (p != null) {
            players.put(userId, p.withBuilding(id));
        }

        return AvatarCityBuildingOwnerResponse.builder()
                .buildingId(id)
                .ownerUserId(userId)
                .ownerName(name)
                .mine(true)
                .build();
    }

    @Override
    public synchronized void releaseBuilding(Long userId) {
        if (userId == null) {
            return;
        }
        String buildingId = buildingByUser.remove(userId);
        if (buildingId != null) {
            ownershipByBuilding.remove(buildingId);
        }
        Presence p = players.get(userId);
        if (p != null) {
            players.put(userId, p.withBuilding(null));
        }
    }

    @Override
    public int ownerCount() {
        return ownershipByBuilding.size();
    }

    private AvatarCityPlayerResponse toPlayer(Presence p, Long viewerUserId) {
        return AvatarCityPlayerResponse.builder()
                .userId(p.userId)
                .x(p.x)
                .y(p.y)
                .facing(p.facing)
                .characterName(p.characterName)
                .skinColor(p.skinColor)
                .shape(p.shape)
                .outfitId(p.outfitId)
                .placeId(p.placeId)
                .buildingId(p.buildingId)
                .self(viewerUserId != null && viewerUserId.equals(p.userId))
                .updatedAt(p.updatedAt)
                .build();
    }

    private void pruneStale() {
        long now = System.currentTimeMillis();
        players.entrySet().removeIf(e -> now - e.getValue().updatedAt > STALE_MS);
    }

    private static double clamp(double v, double min, double max) {
        return Math.max(min, Math.min(max, v));
    }

    private static String normalizeFacing(String facing) {
        if (facing == null) {
            return "front";
        }
        String f = facing.trim().toLowerCase();
        if ("back".equals(f) || "left".equals(f) || "right".equals(f) || "front".equals(f)) {
            return f;
        }
        return "front";
    }

    private static String trimTo(String value, int max, String fallback) {
        if (value == null || value.trim().isEmpty()) {
            return fallback;
        }
        String t = value.trim();
        return t.length() > max ? t.substring(0, max) : t;
    }

    private static final class Ownership {
        final Long userId;
        final String ownerName;

        Ownership(Long userId, String ownerName) {
            this.userId = userId;
            this.ownerName = ownerName;
        }
    }

    private static final class Presence {
        final Long userId;
        final double x;
        final double y;
        final String facing;
        final String characterName;
        final String skinColor;
        final String shape;
        final String outfitId;
        final String placeId;
        final String buildingId;
        final long updatedAt;

        Presence(
                Long userId,
                double x,
                double y,
                String facing,
                String characterName,
                String skinColor,
                String shape,
                String outfitId,
                String placeId,
                String buildingId,
                long updatedAt
        ) {
            this.userId = userId;
            this.x = x;
            this.y = y;
            this.facing = facing;
            this.characterName = characterName;
            this.skinColor = skinColor;
            this.shape = shape;
            this.outfitId = outfitId;
            this.placeId = placeId;
            this.buildingId = buildingId;
            this.updatedAt = updatedAt;
        }

        Presence withBuilding(String buildingId) {
            return new Presence(
                    userId, x, y, facing, characterName, skinColor, shape, outfitId, placeId, buildingId, updatedAt
            );
        }
    }
}
