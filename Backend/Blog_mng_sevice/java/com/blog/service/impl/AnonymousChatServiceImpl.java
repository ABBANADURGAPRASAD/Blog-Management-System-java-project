package com.blog.service.impl;

import com.blog.model.*;
import com.blog.model.dto.*;
import com.blog.repository.*;
import com.blog.service.AnonymousChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnonymousChatServiceImpl implements AnonymousChatService {

    private static final int MAX_MESSAGE_LEN = 2000;
    private static final double DEFAULT_MATCH_RADIUS_KM = 100;
    private static final double MAX_ALLOWED_MATCH_RADIUS_KM = 500;
    private static final int QUEUE_MAX_AGE_MINUTES = 30;

    private final UserRepository userRepository;
    private final AnonymousChatSessionRepository sessionRepository;
    private final AnonymousChatMessageRepository messageRepository;
    private final RevealRequestEntityRepository revealRequestRepository;
    private final AnonymousMapMarkerRepository mapMarkerRepository;
    private final AnonymousMatchQueueRepository queueRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public AnonymousChatServiceImpl(UserRepository userRepository,
            AnonymousChatSessionRepository sessionRepository,
            AnonymousChatMessageRepository messageRepository,
            RevealRequestEntityRepository revealRequestRepository,
            AnonymousMapMarkerRepository mapMarkerRepository,
            AnonymousMatchQueueRepository queueRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.revealRequestRepository = revealRequestRepository;
        this.mapMarkerRepository = mapMarkerRepository;
        this.queueRepository = queueRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    @Transactional
    public void updateMapPresence(Long userId, MapPresenceRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (Boolean.TRUE.equals(request.getVisible())) {
            if (request.getLatitude() == null || request.getLongitude() == null) {
                throw new IllegalArgumentException("latitude and longitude required when visible");
            }
            String color = sanitizeColor(request.getColorHex());
            user.setMapLatitude(request.getLatitude());
            user.setMapLongitude(request.getLongitude());
            user.setFavoriteColor(color);
            user.setMapVisible(true);
            userRepository.save(user);

            AnonymousMapMarker marker = mapMarkerRepository.findByUser_Id(userId).orElse(null);
            if (marker == null) {
                marker = AnonymousMapMarker.builder()
                        .publicToken(AnonymousMapMarker.newToken())
                        .user(user)
                        .build();
            }
            marker.setLatitude(request.getLatitude());
            marker.setLongitude(request.getLongitude());
            marker.setColorHex(color);
            marker.setStatus(normalizeClientMapStatus(request.getMapStatus()));
            marker.setUpdatedAt(LocalDateTime.now());
            mapMarkerRepository.save(marker);
        } else {
            user.setMapVisible(false);
            userRepository.save(user);
            mapMarkerRepository.deleteByUser_Id(userId);
        }
    }

    @Override
    @Transactional
    public void clearMapPresence(Long userId) {
        userRepository.findById(userId).ifPresent(u -> {
            u.setMapVisible(false);
            userRepository.save(u);
        });
        mapMarkerRepository.deleteByUser_Id(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MapMarkerResponse> listMarkers(Long viewerUserId, double minLat, double maxLat, double minLng,
            double maxLng) {
        return mapMarkerRepository.findInBounds(minLat, maxLat, minLng, maxLng).stream()
                .map(m -> MapMarkerResponse.builder()
                        .markerPublicId(m.getPublicToken())
                        .latitude(m.getLatitude())
                        .longitude(m.getLongitude())
                        .colorHex(m.getColorHex())
                        .status(normalizeMapStatus(m.getStatus()))
                        .displayLabel(displayLabelFromToken(m.getPublicToken()))
                        .self(viewerUserId != null && m.getUser().getId().equals(viewerUserId))
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AnonymousSessionResponse startMapChat(Long requesterUserId, MapChatStartRequest request) {
        if (request.getTargetMarkerPublicId() == null || request.getTargetMarkerPublicId().isBlank()) {
            throw new IllegalArgumentException("targetMarkerPublicId required");
        }
        User requester = userRepository.findById(requesterUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        AnonymousMapMarker marker = mapMarkerRepository.findByPublicToken(request.getTargetMarkerPublicId().trim())
                .orElseThrow(() -> new IllegalArgumentException("Marker not found"));
        User target = marker.getUser();
        if (target.getId().equals(requesterUserId)) {
            throw new IllegalArgumentException("Cannot chat with yourself");
        }
        MapMarkerStatus st = normalizeMapStatus(marker.getStatus());
        if (st == MapMarkerStatus.BUSY) {
            throw new IllegalStateException("User offline");
        }
        if (st == MapMarkerStatus.IN_CHAT) {
            throw new IllegalStateException("User in chat");
        }
        AnonymousChatSession session = AnonymousChatSession.builder()
                .publicId(AnonymousChatSession.newPublicId())
                .userA(requester)
                .userB(target)
                .mode(AnonymousSessionMode.MAP_FINDER)
                .revealed(false)
                .build();
        session = sessionRepository.save(session);
        markUsersInChatOnMap(requester, target);
        return toSessionResponse(requesterUserId, session);
    }

    @Override
    @Transactional
    public RandomQueueResponse joinRandomQueue(Long userId, RandomMatchRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (request.getLatitude() == null || request.getLongitude() == null || request.getSeeking() == null) {
            throw new IllegalArgumentException("latitude, longitude, seeking required");
        }
        Gender myG = effectiveGender(user);
        GenderPreference seek = request.getSeeking();
        queueRepository.findByUser_Id(userId).ifPresent(queueRepository::delete);

        List<AnonymousMatchQueue> waiting = queueRepository.findAllWaitingExcept(userId).stream()
                .filter(q -> q.getCreatedAt().isAfter(LocalDateTime.now().minusMinutes(QUEUE_MAX_AGE_MINUTES)))
                .sorted(Comparator.comparing(AnonymousMatchQueue::getCreatedAt))
                .collect(Collectors.toList());

        for (AnonymousMatchQueue peer : waiting) {
            if (!mutualGenderMatch(myG, seek, effectiveGender(peer.getUser()), peer.getSeeking())) {
                continue;
            }
            double d = haversineKm(request.getLatitude(), request.getLongitude(),
                    peer.getLatitude() != null ? peer.getLatitude() : request.getLatitude(),
                    peer.getLongitude() != null ? peer.getLongitude() : request.getLongitude());
            double rJoiner = effectiveRadiusKm(request.getMaxDistanceKm());
            double rPeer = effectiveRadiusKm(peer.getMaxDistanceKm());
            if (d > Math.min(rJoiner, rPeer)) {
                continue;
            }
            AnonymousChatSession session = AnonymousChatSession.builder()
                    .publicId(AnonymousChatSession.newPublicId())
                    .userA(user.getId() < peer.getUser().getId() ? user : peer.getUser())
                    .userB(user.getId() < peer.getUser().getId() ? peer.getUser() : user)
                    .mode(AnonymousSessionMode.RANDOM)
                    .revealed(false)
                    .build();
            session = sessionRepository.save(session);
            peer.setMatchedSession(session);
            queueRepository.save(peer);
            queueRepository.deleteByUser_Id(userId);
            markRandomPairInChatOnMap(user, peer.getUser(),
                    request.getLatitude(), request.getLongitude(),
                    peer.getLatitude(), peer.getLongitude());
            return RandomQueueResponse.builder()
                    .matched(true)
                    .sessionPublicId(session.getPublicId())
                    .ticketPublicId(null)
                    .message("matched")
                    .build();
        }

        String ticket = UUID.randomUUID().toString();
        AnonymousMatchQueue row = AnonymousMatchQueue.builder()
                .ticketPublicId(ticket)
                .user(user)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .seeking(seek)
                .myGender(myG)
                .maxDistanceKm(effectiveRadiusKm(request.getMaxDistanceKm()))
                .build();
        queueRepository.save(row);
        return RandomQueueResponse.builder()
                .matched(false)
                .sessionPublicId(null)
                .ticketPublicId(ticket)
                .message("waiting")
                .build();
    }

    @Override
    @Transactional
    public RandomQueueResponse pollRandomQueue(Long userId, String ticketPublicId) {
        AnonymousMatchQueue row = queueRepository.findByTicketPublicId(ticketPublicId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
        if (!row.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Forbidden");
        }
        if (row.getMatchedSession() != null) {
            queueRepository.delete(row);
            return RandomQueueResponse.builder()
                    .matched(true)
                    .sessionPublicId(row.getMatchedSession().getPublicId())
                    .ticketPublicId(null)
                    .message("matched")
                    .build();
        }
        return RandomQueueResponse.builder()
                .matched(false)
                .sessionPublicId(null)
                .ticketPublicId(ticketPublicId)
                .message("waiting")
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AnonymousSessionResponse getSession(Long userId, String sessionPublicId) {
        AnonymousChatSession session = sessionRepository.findByPublicId(sessionPublicId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        if (!isParticipant(session, userId)) {
            throw new IllegalArgumentException("Forbidden");
        }
        return toSessionResponse(userId, session);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AnonymousMessageView> listMessages(Long userId, String sessionPublicId) {
        AnonymousChatSession session = sessionRepository.findByPublicId(sessionPublicId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        if (!isParticipant(session, userId)) {
            throw new IllegalArgumentException("Forbidden");
        }
        return messageRepository.findBySessionOrderByCreatedAtAsc(session).stream()
                .map(m -> toMessageView(userId, session, m))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AnonymousMessageView sendMessage(Long userId, String sessionPublicId, SendAnonymousMessageRequest request) {
        AnonymousChatSession session = sessionRepository.findByPublicId(sessionPublicId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        if (!isParticipant(session, userId)) {
            throw new IllegalArgumentException("Forbidden");
        }
        if (session.getEndedAt() != null) {
            throw new IllegalArgumentException("Session ended");
        }
        String content = request.getContent();
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Empty message");
        }
        if (content.length() > MAX_MESSAGE_LEN) {
            throw new IllegalArgumentException("Message too long");
        }
        content = content.trim();
        User sender = userRepository.findById(userId).orElseThrow();
        AnonymousChatMessage msg = AnonymousChatMessage.builder()
                .session(session)
                .sender(sender)
                .content(content)
                .build();
        msg = messageRepository.save(msg);
        AnonymousMessageView view = toMessageView(userId, session, msg);
        messagingTemplate.convertAndSend("/topic/anonymous/" + sessionPublicId, view);
        return view;
    }

    @Override
    @Transactional
    public void requestReveal(Long userId, String sessionPublicId) {
        AnonymousChatSession session = loadSessionForParticipant(sessionPublicId, userId);
        if (session.isRevealed()) {
            return;
        }
        User from = userRepository.findById(userId).orElseThrow();
        revealRequestRepository.findBySessionAndFromUser(session, from).orElseGet(() ->
                revealRequestRepository.save(RevealRequestEntity.builder()
                        .session(session)
                        .fromUser(from)
                        .status(RevealStatus.PENDING)
                        .build()));
    }

    @Override
    @Transactional
    public void respondReveal(Long userId, String sessionPublicId, boolean accept) {
        AnonymousChatSession session = loadSessionForParticipant(sessionPublicId, userId);
        User partner = partnerOf(session, userId);
        revealRequestRepository.findBySessionAndFromUser(session, partner).ifPresent(req -> {
            if (accept) {
                req.setStatus(RevealStatus.ACCEPTED);
                session.setRevealed(true);
            } else {
                req.setStatus(RevealStatus.REJECTED);
            }
            revealRequestRepository.save(req);
            sessionRepository.save(session);
        });
    }

    @Override
    @Transactional
    public void endSession(Long userId, String sessionPublicId) {
        AnonymousChatSession session = loadSessionForParticipant(sessionPublicId, userId);
        session.setEndedAt(LocalDateTime.now());
        sessionRepository.save(session);
        queueRepository.findByUser_Id(userId).ifPresent(queueRepository::delete);
        restoreMapMarkersAfterChat(session.getUserA().getId(), session.getUserB().getId());
    }

    private void markUsersInChatOnMap(User requester, User target) {
        requester.setMapVisible(true);
        target.setMapVisible(true);
        userRepository.save(requester);
        userRepository.save(target);
        mapMarkerRepository.findByUser_Id(requester.getId()).ifPresent(m -> {
            m.setStatus(MapMarkerStatus.IN_CHAT);
            m.setUpdatedAt(LocalDateTime.now());
            mapMarkerRepository.save(m);
        });
        mapMarkerRepository.findByUser_Id(target.getId()).ifPresent(m -> {
            m.setStatus(MapMarkerStatus.IN_CHAT);
            m.setUpdatedAt(LocalDateTime.now());
            mapMarkerRepository.save(m);
        });
    }

    private void markRandomPairInChatOnMap(User a, User b, double latA, double lngA, Double latB, Double lngB) {
        double bLat = latB != null ? latB : latA;
        double bLng = lngB != null ? lngB : lngA;
        upsertInChatMarker(a, latA, lngA);
        upsertInChatMarker(b, bLat, bLng);
    }

    private void upsertInChatMarker(User user, double lat, double lng) {
        String color = sanitizeColor(user.getFavoriteColor());
        user.setMapLatitude(lat);
        user.setMapLongitude(lng);
        user.setMapVisible(true);
        user.setFavoriteColor(color);
        userRepository.save(user);
        AnonymousMapMarker marker = mapMarkerRepository.findByUser_Id(user.getId()).orElse(null);
        if (marker == null) {
            marker = AnonymousMapMarker.builder()
                    .publicToken(AnonymousMapMarker.newToken())
                    .user(user)
                    .build();
        }
        marker.setLatitude(lat);
        marker.setLongitude(lng);
        marker.setColorHex(color);
        marker.setStatus(MapMarkerStatus.IN_CHAT);
        marker.setUpdatedAt(LocalDateTime.now());
        mapMarkerRepository.save(marker);
    }

    private void restoreMapMarkersAfterChat(Long userId1, Long userId2) {
        for (Long uid : Arrays.asList(userId1, userId2)) {
            mapMarkerRepository.findByUser_Id(uid).ifPresent(m -> {
                if (m.getStatus() == MapMarkerStatus.IN_CHAT) {
                    m.setStatus(MapMarkerStatus.AVAILABLE);
                    m.setUpdatedAt(LocalDateTime.now());
                    mapMarkerRepository.save(m);
                }
            });
        }
    }

    private AnonymousChatSession loadSessionForParticipant(String sessionPublicId, Long userId) {
        AnonymousChatSession session = sessionRepository.findByPublicId(sessionPublicId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        if (!isParticipant(session, userId)) {
            throw new IllegalArgumentException("Forbidden");
        }
        return session;
    }

    private static boolean isParticipant(AnonymousChatSession s, Long userId) {
        return s.getUserA().getId().equals(userId) || s.getUserB().getId().equals(userId);
    }

    private static User partnerOf(AnonymousChatSession s, Long userId) {
        return s.getUserA().getId().equals(userId) ? s.getUserB() : s.getUserA();
    }

    private AnonymousSessionResponse toSessionResponse(Long viewerId, AnonymousChatSession s) {
        User partner = partnerOf(s, viewerId);
        AnonymousSessionResponse.AnonymousSessionResponseBuilder b = AnonymousSessionResponse.builder()
                .sessionPublicId(s.getPublicId())
                .mode(s.getMode())
                .revealed(s.isRevealed());
        if (s.isRevealed()) {
            b.partnerUserId(partner.getId())
                    .partnerUserName(partner.getUserName())
                    .partnerFullName(partner.getFullName());
        }
        return b.build();
    }

    private AnonymousMessageView toMessageView(Long viewerId, AnonymousChatSession session, AnonymousChatMessage m) {
        boolean fromSelf = m.getSender().getId().equals(viewerId);
        String label;
        if (session.isRevealed()) {
            label = m.getSender().getUserName();
        } else {
            label = fromSelf ? "ME" : "PARTNER";
        }
        return AnonymousMessageView.builder()
                .messageId(m.getId())
                .fromSelf(fromSelf)
                .senderLabel(label)
                .content(m.getContent())
                .createdAt(m.getCreatedAt())
                .build();
    }

    private static Gender effectiveGender(User u) {
        return u.getGender() != null ? u.getGender() : Gender.UNSPECIFIED;
    }

    private static boolean mutualGenderMatch(Gender myGender, GenderPreference mySeek, Gender peerGender,
            GenderPreference peerSeek) {
        return preferenceMatches(peerGender, mySeek) && preferenceMatches(myGender, peerSeek);
    }

    private static boolean preferenceMatches(Gender candidate, GenderPreference pref) {
        if (pref == GenderPreference.ANY) {
            return true;
        }
        if (candidate == null || candidate == Gender.UNSPECIFIED) {
            return false;
        }
        if (pref == GenderPreference.MALE) {
            return candidate == Gender.MALE;
        }
        if (pref == GenderPreference.FEMALE) {
            return candidate == Gender.FEMALE;
        }
        return false;
    }

    private static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private static MapMarkerStatus normalizeMapStatus(MapMarkerStatus s) {
        return s != null ? s : MapMarkerStatus.AVAILABLE;
    }

    /** Clients may only set AVAILABLE or BUSY; IN_CHAT is server-controlled. */
    private static MapMarkerStatus normalizeClientMapStatus(MapMarkerStatus s) {
        if (s == null || s == MapMarkerStatus.IN_CHAT) {
            return MapMarkerStatus.AVAILABLE;
        }
        return s;
    }

    private static String displayLabelFromToken(String publicToken) {
        if (publicToken == null || publicToken.isBlank()) {
            return "User #????";
        }
        int n = Math.floorMod(publicToken.hashCode(), 9000) + 1000;
        return "User #" + n;
    }

    private static double effectiveRadiusKm(Double requestedKm) {
        if (requestedKm == null || requestedKm <= 0) {
            return DEFAULT_MATCH_RADIUS_KM;
        }
        return Math.min(requestedKm, MAX_ALLOWED_MATCH_RADIUS_KM);
    }

    private static String sanitizeColor(String hex) {
        if (hex == null || hex.isBlank()) {
            return "#4A90E2";
        }
        String h = hex.trim();
        if (!h.startsWith("#")) {
            h = "#" + h;
        }
        if (h.length() < 4 || h.length() > 9) {
            return "#4A90E2";
        }
        return h;
    }
}
