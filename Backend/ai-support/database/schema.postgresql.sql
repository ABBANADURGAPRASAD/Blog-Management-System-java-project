-- AI Moderation Platform — PostgreSQL Schema
-- Database: moderation_db
-- Run: psql -U moderation -d moderation_db -f schema.postgresql.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ---------------------------------------------------------------------------
-- Enums (as CHECK constraints for portability)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS moderation_requests (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idempotency_key     VARCHAR(128) NOT NULL UNIQUE,
    content_type        VARCHAR(32) NOT NULL,  -- POST, COMMENT, USER_PROFILE, ...
    content_id          BIGINT NOT NULL,
    user_id             BIGINT NOT NULL,
    status              VARCHAR(32) NOT NULL DEFAULT 'PENDING',  -- PENDING, PROCESSING, COMPLETED, FAILED
    priority            SMALLINT NOT NULL DEFAULT 5,
    payload_json        JSONB NOT NULL,
    detected_language   VARCHAR(16),
    source_service      VARCHAR(64) NOT NULL DEFAULT 'blog-api',
    parent_request_id   UUID REFERENCES moderation_requests(id),
    retry_count         INT NOT NULL DEFAULT 0,
    error_message       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,
    CONSTRAINT chk_content_type CHECK (content_type IN (
        'POST','COMMENT','USER_PROFILE','USER_BIO','USER_AVATAR','USER_MEDIA',
        'REEL','CHAT_MESSAGE','STORY','APPEAL'
    )),
    CONSTRAINT chk_request_status CHECK (status IN (
        'PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED'
    ))
);

CREATE INDEX idx_mod_req_content ON moderation_requests (content_type, content_id);
CREATE INDEX idx_mod_req_user ON moderation_requests (user_id);
CREATE INDEX idx_mod_req_status_created ON moderation_requests (status, created_at DESC);
CREATE INDEX idx_mod_req_priority ON moderation_requests (priority, created_at) WHERE status = 'PENDING';
CREATE INDEX idx_mod_req_payload_gin ON moderation_requests USING GIN (payload_json);

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS moderation_results (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id          UUID NOT NULL REFERENCES moderation_requests(id) ON DELETE CASCADE,
    final_status        VARCHAR(32) NOT NULL,  -- APPROVED, WARNING, BLOCKED
    comment_class       VARCHAR(16),           -- SAFE, WARNING, BLOCKED (comments)
    confidence          NUMERIC(5,4) NOT NULL,
    needs_human_review  BOOLEAN NOT NULL DEFAULT FALSE,
    degraded_mode       BOOLEAN NOT NULL DEFAULT FALSE,
    summary             TEXT,
    metadata_json       JSONB,
    model_bundle_version VARCHAR(64) NOT NULL,
    processing_ms       INT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_final_status CHECK (final_status IN ('APPROVED','WARNING','BLOCKED')),
    CONSTRAINT uq_result_per_request UNIQUE (request_id)
);

CREATE INDEX idx_mod_results_status ON moderation_results (final_status, created_at DESC);
CREATE INDEX idx_mod_results_review ON moderation_results (needs_human_review) WHERE needs_human_review = TRUE;

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS moderation_scores (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id           UUID NOT NULL REFERENCES moderation_results(id) ON DELETE CASCADE,
    label_code          VARCHAR(64) NOT NULL,
    score               NUMERIC(6,5) NOT NULL,
    model_name          VARCHAR(128) NOT NULL,
    model_version       VARCHAR(64) NOT NULL,
    language            VARCHAR(16),
    raw_json            JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mod_scores_result ON moderation_scores (result_id);
CREATE INDEX idx_mod_scores_label ON moderation_scores (label_code, score DESC);

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS moderation_audit_logs (
    id                  BIGSERIAL PRIMARY KEY,
    request_id          UUID REFERENCES moderation_requests(id),
    actor_type          VARCHAR(32) NOT NULL,  -- SYSTEM, AI, MODERATOR, USER
    actor_id            VARCHAR(128),
    action              VARCHAR(64) NOT NULL,
    before_json         JSONB,
    after_json          JSONB,
    ip_address          INET,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mod_audit_request ON moderation_audit_logs (request_id, created_at DESC);
CREATE INDEX idx_mod_audit_created ON moderation_audit_logs (created_at DESC);

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS moderation_actions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id          UUID NOT NULL REFERENCES moderation_requests(id),
    action_type         VARCHAR(64) NOT NULL,  -- OVERRIDE_APPROVE, OVERRIDE_BLOCK, ESCALATE
    moderator_id        BIGINT NOT NULL,
    reason              TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mod_actions_request ON moderation_actions (request_id);

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS moderation_queue (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id          UUID NOT NULL UNIQUE REFERENCES moderation_requests(id),
    queue_status        VARCHAR(32) NOT NULL DEFAULT 'PENDING_REVIEW',
    priority            SMALLINT NOT NULL DEFAULT 5,
    assigned_to         BIGINT,
    claimed_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    progress_pct        SMALLINT DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_queue_status CHECK (queue_status IN (
        'PENDING_REVIEW','IN_REVIEW','COMPLETED','EXPIRED'
    ))
);

CREATE INDEX idx_mod_queue_status_pri ON moderation_queue (queue_status, priority, created_at);

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_model_metadata (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name          VARCHAR(128) NOT NULL,
    model_version       VARCHAR(64) NOT NULL,
    modality            VARCHAR(32) NOT NULL,  -- TEXT, IMAGE, VIDEO
    sha256              VARCHAR(64),
    supported_languages TEXT[],
    latency_p95_ms      INT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    deployed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_model_version UNIQUE (model_name, model_version)
);

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS moderation_outbox (
    id                  BIGSERIAL PRIMARY KEY,
    request_id          UUID NOT NULL,
    topic               VARCHAR(128) NOT NULL,
    message_key         VARCHAR(256) NOT NULL,
    payload_json        JSONB NOT NULL,
    published           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at        TIMESTAMPTZ
);

CREATE INDEX idx_outbox_unpublished ON moderation_outbox (published, created_at) WHERE published = FALSE;

-- ---------------------------------------------------------------------------
-- Seed model metadata (example)
-- ---------------------------------------------------------------------------

INSERT INTO ai_model_metadata (model_name, model_version, modality, supported_languages, latency_p95_ms)
VALUES
  ('unitary/toxic-bert', '1.0', 'TEXT', ARRAY['en'], 120),
  ('Hate-speech-CNERG/dehatebert-mono-indic', '1.0', 'TEXT', ARRAY['hi','te','ta','ml','kn','bn'], 180),
  ('Falconsai/nsfw_image_detection', '1.0', 'IMAGE', NULL, 90)
ON CONFLICT (model_name, model_version) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Updated_at trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_moderation_requests_updated ON moderation_requests;
CREATE TRIGGER trg_moderation_requests_updated
  BEFORE UPDATE ON moderation_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
