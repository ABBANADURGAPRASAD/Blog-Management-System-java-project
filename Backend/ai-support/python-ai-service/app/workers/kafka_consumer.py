"""
Kafka consumer: moderation.requested -> analyze -> moderation.completed

Run: python -m app.workers.kafka_consumer
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from uuid import UUID

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

from app.config import settings
from app.core.moderation_runner import run_moderation
from app.models.schemas import ContentType, ModerationEvent, ModerationPayload

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("moderation.kafka")


async def process_message(raw: bytes, producer: AIOKafkaProducer) -> None:
    data = json.loads(raw.decode("utf-8"))
    event = ModerationEvent.model_validate(data)

    if event.event_type != "MODERATION_REQUESTED":
        log.warning("Skipping event type %s", event.event_type)
        return

    content_type = ContentType(event.content_type)
    result = await run_moderation(content_type, event.payload)

    completed = {
        "eventType": "MODERATION_COMPLETED",
        "requestId": str(event.request_id),
        "idempotencyKey": event.idempotency_key,
        "contentType": event.content_type,
        "contentId": event.content_id,
        "userId": event.user_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "traceId": event.trace_id,
        "result": {
            "finalStatus": result.final_status.value,
            "commentClass": result.comment_class.value if result.comment_class else None,
            "confidence": result.confidence,
            "needsHumanReview": result.needs_human_review,
            "detectedLanguage": result.detected_language,
            "degradedMode": result.degraded_mode,
            "processingMs": result.processing_ms,
            "scores": [s.model_dump() for s in result.scores],
        },
    }

    await producer.send_and_wait(
        settings.kafka_completed_topic,
        key=str(event.request_id).encode(),
        value=json.dumps(completed).encode("utf-8"),
    )
    log.info("Completed moderation requestId=%s status=%s", event.request_id, result.final_status)


async def send_to_dlq(producer: AIOKafkaProducer, raw: bytes, error: str) -> None:
    dlq_payload = {
        "original": raw.decode("utf-8", errors="replace"),
        "error": error,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await producer.send_and_wait(
        settings.kafka_dlq_topic,
        key=str(UUID(int=0)).encode(),
        value=json.dumps(dlq_payload).encode("utf-8"),
    )


async def run_consumer() -> None:
    consumer = AIOKafkaConsumer(
        settings.kafka_request_topic,
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id=settings.kafka_consumer_group,
        auto_offset_reset="earliest",
        enable_auto_commit=True,
    )
    producer = AIOKafkaProducer(bootstrap_servers=settings.kafka_bootstrap_servers)

    await consumer.start()
    await producer.start()
    log.info("Listening on %s", settings.kafka_request_topic)

    try:
        async for msg in consumer:
            retries = 3
            for attempt in range(retries):
                try:
                    await process_message(msg.value, producer)
                    break
                except Exception as exc:
                    log.exception("Attempt %s failed: %s", attempt + 1, exc)
                    if attempt == retries - 1:
                        await send_to_dlq(producer, msg.value, str(exc))
                    else:
                        await asyncio.sleep(2**attempt)
    finally:
        await consumer.stop()
        await producer.stop()


def main() -> None:
    if not settings.kafka_enabled:
        log.error("Kafka disabled; set KAFKA_ENABLED=true")
        return
    asyncio.run(run_consumer())


if __name__ == "__main__":
    main()
