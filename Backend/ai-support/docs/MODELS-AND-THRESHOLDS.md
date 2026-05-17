# AI Models & Decision Thresholds

## 1. Recommended open-source models

### Text — English

| Model | HuggingFace ID | Use | Inference |
|-------|----------------|-----|-----------|
| Toxicity | `unitary/toxic-bert` | toxicity, insult, threat | ONNX / transformers |
| Hate speech | `facebook/roberta-hate-speech-dynabench-r4-target` | hate | CPU ok |
| Spam | `mrm8488/bert-tiny-finetuned-sms-spam-detection` | spam/scam | Fast CPU |

### Text — Indic (hi, te, ta, ml, kn, bn)

| Model | ID | Use |
|-------|-----|-----|
| DehateBERT Indic | `Hate-speech-CNERG/dehatebert-mono-indic` | hate, abuse |
| IndicBERT toxicity | `ai4bharat/indic-bert` + fine-tuned head (custom) | toxicity |

### Text — Arabic

| Model | ID |
|-------|-----|
| Arabic hate | `CAMeL-Lab/bert-base-arabic-camelbert-da-hate` |

### Language detection

| Tool | Notes |
|------|-------|
| `fasttext` lid.176.bin | Fast, 176 langs, production standard |
| `langid` | Fallback |

### Translation (optional path)

| Model | ID | When |
|-------|-----|------|
| NLLB distilled | `facebook/nllb-200-distilled-600M` | Unsupported lang → en |
| IndicTrans2 | `ai4bharat/indictrans2-indic-en-1B` | Indic → en (higher quality for SA languages) |

**Tradeoff:** Translation adds 200–800ms; use only when LID confidence < 0.85 or lang not in native model set.

### Image

| Model | ID | Labels |
|-------|-----|--------|
| NSFW | `Falconsai/nsfw_image_detection` | nsfw/safe |
| NSFW alt | `GantMan/nsfw_model` | nsfw classes |
| Violence | Fine-tuned `resnet50` on UCF-Crime / RWF-2000 (custom export ONNX) | violence |

### Video

- Frame extractor: **FFmpeg** (`fps=1`, scale 224)
- Same image ONNX on frame batches
- Optional: **CLIP** zero-shot for "violence" / "nudity" text prompts (`openai/clip-vit-base-patch32`) when dedicated model unavailable

## 2. Label taxonomy (maps to policy)

| `label_code` | Categories covered |
|--------------|-------------------|
| `NSFW` | 18+, nudity, sexual, pornographic |
| `VIOLENCE` | gore, violent acts |
| `HATE_SPEECH` | hate, racism, religious/country abuse |
| `TOXICITY` | insults, profanity |
| `THREAT` | threats of harm |
| `SPAM` | spam, scam, fraud |
| `BULLYING` | harassment, bullying |
| `ILLEGAL` | illegal/sensitive |
| `IMPERSONATION` | impersonation (metadata + face match later) |
| `USERNAME_ABUSE` | abusive handles |
| `BIO_UNSAFE` | unsafe bios |

## 3. Default thresholds (configurable YAML)

```yaml
thresholds:
  NSFW:
    block: 0.85
    warn: 0.55
    review_low: 0.45
  HATE_SPEECH:
    block: 0.80
    warn: 0.50
  TOXICITY:
    block: 0.88
    warn: 0.60
  THREAT:
    block: 0.75
    warn: 0.45
  SPAM:
    block: 0.90
    warn: 0.70
  VIOLENCE:
    block: 0.82
    warn: 0.52

aggregation:
  strategy: max_weighted  # max across labels with weights
  block_if_any_critical: true
  critical_labels: [THREAT, CSAM_HINT, ILLEGAL]
```

## 4. Comment classification mapping

| Condition | `comment_class` |
|-----------|-----------------|
| All scores < warn | `SAFE` |
| Any warn, none block | `WARNING` |
| Any block | `BLOCKED` |

Stored in `moderation_results.final_status` and mirrored to `comments.moderation_status`.

## 5. GPU vs CPU

| Workload | CPU | GPU |
|----------|-----|-----|
| Text BERT-tiny | ✓ | optional |
| Text RoBERTa-base | slow | ✓ |
| Image ONNX | ✓ quantized | ✓ |
| Video 60s @1fps | borderline | ✓ recommended |

Env: `AI_DEVICE=cpu|cuda`, `ONNX_THREADS=4`.

## 6. Model registry metadata

Track in `ai_model_metadata`:

- `model_name`, `version`, `sha256`, `deployed_at`, `latency_p95_ms`, `supported_languages[]`

Rotate models by deploying new Python image tag; old results retain `model_version` for audit.
