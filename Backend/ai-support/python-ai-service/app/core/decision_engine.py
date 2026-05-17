from app.models.schemas import CommentClass, FinalStatus, LabelScore, ModerationResult

# Production: load from YAML (docs/MODELS-AND-THRESHOLDS.md)
DEFAULT_THRESHOLDS: dict[str, dict[str, float]] = {
    "NSFW": {"block": 0.85, "warn": 0.55},
    "HATE_SPEECH": {"block": 0.80, "warn": 0.50},
    "TOXICITY": {"block": 0.88, "warn": 0.60},
    "THREAT": {"block": 0.75, "warn": 0.45},
    "SPAM": {"block": 0.90, "warn": 0.70},
    "VIOLENCE": {"block": 0.82, "warn": 0.52},
}

CRITICAL = {"THREAT", "ILLEGAL"}


def aggregate_decision(scores: list[LabelScore], is_comment: bool = False) -> ModerationResult:
    if not scores:
        return ModerationResult(
            final_status=FinalStatus.APPROVED,
            comment_class=CommentClass.SAFE if is_comment else None,
            confidence=0.0,
            scores=[],
        )

    max_score = 0.0
    needs_review = False
    final = FinalStatus.APPROVED

    for s in scores:
        th = DEFAULT_THRESHOLDS.get(s.label, {"block": 0.9, "warn": 0.6})
        if s.label in CRITICAL and s.score >= th["block"] * 0.9:
            final = FinalStatus.BLOCKED
        elif s.score >= th["block"]:
            final = FinalStatus.BLOCKED
        elif s.score >= th["warn"] and final != FinalStatus.BLOCKED:
            final = FinalStatus.WARNING
        elif th["warn"] * 0.75 <= s.score < th["warn"]:
            needs_review = True
        max_score = max(max_score, s.score)

    comment_class = None
    if is_comment:
        if final == FinalStatus.BLOCKED:
            comment_class = CommentClass.BLOCKED
        elif final == FinalStatus.WARNING:
            comment_class = CommentClass.WARNING
        else:
            comment_class = CommentClass.SAFE

    return ModerationResult(
        final_status=final,
        comment_class=comment_class,
        confidence=max_score,
        needs_human_review=needs_review or (0.45 < max_score < 0.72),
        scores=scores,
    )
