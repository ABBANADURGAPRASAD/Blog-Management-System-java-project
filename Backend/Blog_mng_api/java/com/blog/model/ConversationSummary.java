package com.blog.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One row in the inbox: the other participant, latest message in that DM, and unread count from them.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationSummary {

    private User otherUser;
    private ChatMessage lastMessage;
    private long unreadCount;
}
