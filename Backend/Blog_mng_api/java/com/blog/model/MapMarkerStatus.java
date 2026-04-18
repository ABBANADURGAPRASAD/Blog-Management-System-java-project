package com.blog.model;

/**
 * Map pin state: green = available, yellow = offline / do not connect, red = in an active chat.
 */
public enum MapMarkerStatus {
    AVAILABLE,
    /** Offline or not accepting connections (yellow on map). */
    BUSY,
    /** In an active anonymous chat session (red on map). */
    IN_CHAT
}
