package com.blog.moderation;

import com.blog.model.ModerationStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Rule-based comment moderation (toxicity, threats, hate, spam, NSFW, harassment).
 * Aligns with ai-support policy labels; can be extended with Python AI later.
 */
@Component
public class CommentContentModerator {

    private static final Pattern THREAT = Pattern.compile(
            "\\b(kill\\s+(you|u)|kys|kill\\s+yourself|i\\s*will\\s+kill|die\\s+bitch|rape\\s+you)\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern SPAM = Pattern.compile(
            "(bit\\.ly|free\\s+crypto|click\\s+here\\s+to\\s+win|whatsapp\\s+\\+\\d|earn\\s+\\$\\d)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern NSFW = Pattern.compile(
            "\\b(nude|nudes|porn|xxx|onlyfans|send\\s+nudes)\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern HATE = Pattern.compile(
            "\\b(nigger|nigga|faggot|retard\\b|kys\\b)\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern DIRECT_HARASSMENT = Pattern.compile(
            "\\b(fuck\\s+you|f\\s*\\*\\s*\\*\\s*k\\s+you|stfu|go\\s+die|you\\s+(idiot|moron|bastard))\\b",
            Pattern.CASE_INSENSITIVE);

    private static final String[] PROFANITY_WORDS = {
            "fuck", "fucking", "fucker", "motherfucker", "shit", "bullshit", "bitch", "bastard",
            "asshole", "dick", "pussy", "cunt", "whore", "slut"
    };

    @Value("${app.moderation.enabled:true}")
    private boolean enabled;

    public CommentModerationDecision analyze(String rawContent) {
        if (!enabled || rawContent == null || rawContent.isBlank()) {
            return safe();
        }

        String text = normalize(rawContent);
        Map<String, Double> scores = new LinkedHashMap<>();

        if (THREAT.matcher(text).find()) {
            scores.put("THREAT", 0.92);
        }
        if (HATE.matcher(text).find()) {
            scores.put("HATE_SPEECH", 0.90);
        }
        if (NSFW.matcher(text).find()) {
            scores.put("NSFW", 0.88);
        }
        if (SPAM.matcher(text).find()) {
            scores.put("SPAM", 0.85);
        }
        if (DIRECT_HARASSMENT.matcher(text).find()) {
            scores.put("BULLYING", 0.90);
            scores.put("TOXICITY", 0.92);
        }

        double toxicity = profanityScore(text);
        if (toxicity > 0) {
            scores.merge("TOXICITY", toxicity, Math::max);
        }

        if (scores.isEmpty()) {
            return safe();
        }

        double max = scores.values().stream().mapToDouble(Double::doubleValue).max().orElse(0);
        List<String> labels = new ArrayList<>(scores.keySet());

        if (scores.containsKey("THREAT") || scores.containsKey("HATE_SPEECH")
                || max >= 0.88 && (scores.containsKey("TOXICITY") || scores.containsKey("BULLYING"))) {
            return decision(ModerationStatus.BLOCKED, "BLOCKED", max, labels,
                    "Comment blocked: policy violation detected.");
        }

        if (max >= 0.55) {
            return decision(ModerationStatus.WARNING, "WARNING", max, labels,
                    "Comment flagged for review: potentially inappropriate language.");
        }

        return safe();
    }

    private static CommentModerationDecision safe() {
        return CommentModerationDecision.builder()
                .status(ModerationStatus.APPROVED)
                .commentClass("SAFE")
                .confidence(0.0)
                .detectedLabels(List.of())
                .summary("OK")
                .build();
    }

    private static CommentModerationDecision decision(
            ModerationStatus status, String commentClass, double confidence,
            List<String> labels, String summary) {
        return CommentModerationDecision.builder()
                .status(status)
                .commentClass(commentClass)
                .confidence(confidence)
                .detectedLabels(labels)
                .summary(summary)
                .build();
    }

    private static double profanityScore(String text) {
        double max = 0;
        for (String word : PROFANITY_WORDS) {
            if (containsWord(text, word)) {
                max = Math.max(max, 0.85);
            }
        }
        return max;
    }

    private static boolean containsWord(String text, String word) {
        Pattern p = Pattern.compile("\\b" + Pattern.quote(word) + "\\b", Pattern.CASE_INSENSITIVE);
        return p.matcher(text).find();
    }

    private static String normalize(String input) {
        String n = Normalizer.normalize(input, Normalizer.Form.NFKC).toLowerCase(Locale.ROOT);
        n = n.replaceAll("[^\\p{L}\\p{N}\\s@#]+", " ");
        n = n.replaceAll("\\s+", " ").trim();
        return n;
    }
}
