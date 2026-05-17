package com.blog.moderation;

import com.blog.model.ModerationStatus;
import com.blog.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.StringJoiner;

@Service
public class ModerationEmailService {

    private static final Logger log = LoggerFactory.getLogger(ModerationEmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.moderation.admin-email:abbanadurgaprasad9390@gmail.com}")
    private String adminEmail;

    @Value("${app.moderation.from-email:abbanadurgaprasad9390@gmail.com}")
    private String fromEmail;

    @Value("${app.moderation.send-emails:true}")
    private boolean sendEmails;

    @Autowired
    public ModerationEmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async("chatKafkaTaskExecutor")
    public void sendModerationAlerts(
            User author,
            Long postId,
            Long commentId,
            String contentPreview,
            CommentModerationDecision decision,
            boolean savedToDatabase) {
        if (!sendEmails || mailSender == null) {
            log.warn("Moderation email skipped (sendEmails={}, mailSender={})", sendEmails, mailSender != null);
            return;
        }
        try {
            sendAdminAlert(author, postId, commentId, contentPreview, decision, savedToDatabase);
            if (author != null && author.getEmail() != null && !author.getEmail().isBlank()) {
                sendUserWarning(author, postId, commentId, decision, savedToDatabase);
            }
        } catch (Exception e) {
            log.error("Failed to send moderation emails for commentId={}", commentId, e);
        }
    }

    private void sendAdminAlert(
            User author,
            Long postId,
            Long commentId,
            String contentPreview,
            CommentModerationDecision decision,
            boolean savedToDatabase) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromEmail);
        msg.setTo(adminEmail);
        msg.setSubject("[Feel Free] Moderation " + decision.getStatus() + " — comment #" + commentId);
        msg.setText(buildAdminBody(author, postId, commentId, contentPreview, decision, savedToDatabase));
        mailSender.send(msg);
        log.info("Moderation admin email sent to {} for comment {}", adminEmail, commentId);
    }

    private void sendUserWarning(
            User author,
            Long postId,
            Long commentId,
            CommentModerationDecision decision,
            boolean savedToDatabase) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromEmail);
        msg.setTo(author.getEmail());
        msg.setSubject(savedToDatabase
                ? "[Feel Free] Warning: your comment was flagged"
                : "[Feel Free] Your comment was not published");
        msg.setText(buildUserBody(author, postId, commentId, decision, savedToDatabase));
        mailSender.send(msg);
        log.info("Moderation user email sent to {} for comment {}", author.getEmail(), commentId);
    }

    private static String buildAdminBody(
            User author,
            Long postId,
            Long commentId,
            String contentPreview,
            CommentModerationDecision decision,
            boolean savedToDatabase) {
        StringJoiner j = new StringJoiner("\n");
        j.add("Content moderation alert — Feel Free / Blog Management System");
        j.add("Time: " + LocalDateTime.now());
        j.add("Status: " + decision.getStatus());
        j.add("Class: " + decision.getCommentClass());
        j.add("Confidence: " + String.format("%.2f", decision.getConfidence()));
        j.add("Labels: " + String.join(", ", decision.getDetectedLabels()));
        j.add("Saved to database: " + savedToDatabase);
        j.add("Post ID: " + postId);
        j.add("Comment ID: " + (commentId != null ? commentId : "not saved"));
        if (author != null) {
            j.add("User ID: " + author.getId());
            j.add("Username: " + author.getUserName());
            j.add("Email: " + author.getEmail());
            j.add("Full name: " + author.getFullName());
        }
        j.add("Summary: " + decision.getSummary());
        j.add("Content preview (redacted): " + redact(contentPreview));
        return j.toString();
    }

    private static String buildUserBody(
            User author,
            Long postId,
            Long commentId,
            CommentModerationDecision decision,
            boolean savedToDatabase) {
        String name = author.getFullName() != null ? author.getFullName() : "User";
        StringJoiner j = new StringJoiner("\n");
        j.add("Hello " + name + ",");
        j.add("");
        if (decision.getStatus() == ModerationStatus.BLOCKED && !savedToDatabase) {
            j.add("Your comment on post #" + postId + " was not published because it violates our community guidelines.");
        } else if (decision.getStatus() == ModerationStatus.WARNING) {
            j.add("Your comment on post #" + postId + " was published but flagged for inappropriate content.");
            j.add("Repeated violations may result in account restrictions.");
        } else {
            j.add("Your recent comment activity was reviewed.");
        }
        j.add("");
        j.add("Detected issues: " + String.join(", ", decision.getDetectedLabels()));
        j.add("If you believe this is a mistake, contact support.");
        j.add("");
        j.add("— Feel Free Team");
        return j.toString();
    }

    private static String redact(String content) {
        if (content == null) {
            return "";
        }
        String t = content.trim();
        if (t.length() <= 3) {
            return "***";
        }
        return t.substring(0, Math.min(2, t.length())) + "***" + (t.length() > 5 ? " (len=" + t.length() + ")" : "");
    }
}
