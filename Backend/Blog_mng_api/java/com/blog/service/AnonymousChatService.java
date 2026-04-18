package com.blog.service;

import com.blog.model.dto.*;

import java.util.List;

public interface AnonymousChatService {

    void updateMapPresence(Long userId, MapPresenceRequest request);

    void clearMapPresence(Long userId);

    List<MapMarkerResponse> listMarkers(Long viewerUserId, double minLat, double maxLat, double minLng,
            double maxLng);

    AnonymousSessionResponse startMapChat(Long requesterUserId, MapChatStartRequest request);

    RandomQueueResponse joinRandomQueue(Long userId, RandomMatchRequest request);

    RandomQueueResponse pollRandomQueue(Long userId, String ticketPublicId);

    AnonymousSessionResponse getSession(Long userId, String sessionPublicId);

    List<AnonymousMessageView> listMessages(Long userId, String sessionPublicId);

    AnonymousMessageView sendMessage(Long userId, String sessionPublicId, SendAnonymousMessageRequest request);

    void requestReveal(Long userId, String sessionPublicId);

    void respondReveal(Long userId, String sessionPublicId, boolean accept);

    void endSession(Long userId, String sessionPublicId);
}
