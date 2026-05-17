# Monitoring, Security & Performance

## Security

### Service authentication

1. **Internal JWT** — Issuer `blog-platform`, claims: `sub=blog-api`, `aud=ai-moderation`, `exp=5m`.
2. Python `app/core/security.py` validates Bearer token on `/api/v1/*`.
3. **mTLS** (production): cert-manager issues certs for `ai-moderation.ai-safety.svc.cluster.local`.

### Media handling

- Never pass raw filesystem paths from client.
- Java generates **presigned URL** (MinIO/S3) valid 300s for AI download.
- ClamAV scan on upload path before moderation event (sidecar or `clamd` in upload pod).

### Rate limiting

Redis keys: `rl:moderation:sync:{userId}` — 30 req/min.
Global: `rl:moderation:api:{ip}` — 100 req/min.

### AI endpoint protection

- No public ingress to Python admin routes.
- NetworkPolicy: only `blog-api` namespace → port 8090.

## Monitoring

### Prometheus metrics (Python example names)

- `moderation_inference_duration_seconds{pipeline,model}`
- `moderation_requests_processed_total{content_type,status}`
- `moderation_kafka_lag`
- `moderation_gpu_utilization`

### Java metrics (Micrometer)

- `moderation.submit.count`
- `moderation.result.apply.duration`

### Logging

Structured JSON:

```json
{"requestId":"...","contentType":"COMMENT","userId":42,"finalStatus":"BLOCKED","traceId":"..."}
```

### OpenTelemetry

- Propagate `traceparent` from Java Kafka headers to Python consumer.
- Export to OTLP collector → Jaeger/Tempo.

### Sentry

- DSN per service; tag `request_id`, scrub PII from breadcrumbs.

## Performance checklist

- [ ] Redis cache for text/image hashes
- [ ] ONNX Runtime with `graph_optimization_level=ORT_ENABLE_ALL`
- [ ] Kafka partition count ≥ peak consumers
- [ ] Separate HPA for video workers
- [ ] Connection pool tuning on moderation PostgreSQL (Hikari max 20)

## Audit

All state changes → `moderation_audit_logs` (immutable append).
Retention: 2 years hot, archive to S3 Glacier.
