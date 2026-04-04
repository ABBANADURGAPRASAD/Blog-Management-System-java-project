package com.blog.util;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Extracts @username tokens from comment text (alphanumeric and underscore, like typical handles).
 */
public final class MentionParser {

    private static final Pattern MENTION = Pattern.compile("@([a-zA-Z0-9_]+)");

    private MentionParser() {
    }

    public static List<String> parseUsernames(String content) {
        if (content == null || content.isBlank()) {
            return List.of();
        }
        Matcher m = MENTION.matcher(content);
        LinkedHashSet<String> unique = new LinkedHashSet<>();
        while (m.find()) {
            unique.add(m.group(1));
        }
        return new ArrayList<>(unique);
    }
}
