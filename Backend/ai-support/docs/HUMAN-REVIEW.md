# Human Review & Appeals

## Queue workflow

1. Decision engine sets `needs_human_review=true` on `moderation_results`.
2. Row inserted into `moderation_queue` with `priority` (1=highest).
3. Moderator claims task: `UPDATE moderation_queue SET assigned_to=?, status=IN_REVIEW`.
4. Moderator action stored in `moderation_actions`:
   - `OVERRIDE_APPROVE`
   - `OVERRIDE_BLOCK`
   - `ESCALATE`
5. Java applies override → updates app entity + notifies user.

## Priority rules

| Priority | Trigger |
|----------|---------|
| 1 | User report + score > 0.4 |
| 2 | Repeat offender (3+ blocks / 30d) |
| 3 | Borderline ML (review band) |
| 5 | Appeals |

## Appeals

- User submits appeal within 14 days.
- New `moderation_requests` with `content_type=APPEAL`, `parent_request_id` set.
- Different reviewer than original (four-eyes principle).

## SLA targets

| Queue depth | Target first review |
|-------------|---------------------|
| < 100 | < 4 hours |
| 100–1000 | < 24 hours |

Metrics: `moderation_queue_age_seconds` histogram in Grafana.
