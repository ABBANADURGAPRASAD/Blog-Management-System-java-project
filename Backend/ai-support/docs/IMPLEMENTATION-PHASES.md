# Implementation Phases

| Phase | Focus | Exit criteria |
|-------|--------|---------------|
| **P0** (2 wk) | DB migrations, Kafka topics, comment text moderation | Comments get SAFE/WARNING/BLOCKED; audit rows in PG |
| **P1** (2 wk) | Posts + profile + images | NSFW images blocked; notifications wired |
| **P2** (3 wk) | Video worker + human review UI | 60s video p95 < 90s; queue claim/override |
| **P3** (2 wk) | Indic models + observability | Grafana dashboards; DehateBERT in prod |
| **P4** | Chat/reels | `CHAT_MESSAGE` hook on existing Kafka chat pipeline |

## P0 checklist

- [ ] Run `database/mysql_app_migrations.sql` and `schema.postgresql.sql`
- [ ] `docker compose up` in `docker/`
- [ ] Copy Java samples → `Blog_mng_sevice`
- [ ] Set `app.moderation.enabled=true`
- [ ] Hook `CommentServiceImpl.addComment`
- [ ] E2E: toxic comment → BLOCKED
