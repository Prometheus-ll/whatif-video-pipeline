# What-if Shorts Factory

A low-cost, cloud-first pipeline for producing vertical **What if...?** science/explainer Shorts. Gemini plans the story; deterministic HTML/CSS motion graphics and HyperFrames render it; quality checks package a draft for manual upload.

> **Current milestone:** foundation + first deterministic cinematic timeline composition. AI research, narration generation, and licensed asset providers are intentionally staged behind explicit interfaces so the first render stays reproducible and does not silently spend money.

## Goals

- 30–90 second YouTube Shorts, 1080×1920, 30 fps.
- Cinematic visuals, animated elapsed-time timeline, scientific overlays, documentary-style narration.
- Cloud automation through GitHub Actions; outputs saved as downloadable workflow artifacts.
- **No automatic publishing.** Upload drafts manually after review.
- Free/low-cost defaults, explicit spending limits, retries bounded, source/license provenance required.

## Quick start

Requirements: Node.js 22+, npm, and FFmpeg for local rendering. HyperFrames documents these prerequisites and the CLI workflow: [Quickstart](https://hyperframes.app/docs/1-startup/2-quickstart), [CLI](https://hyperframes.app/docs/5-packages/cli).

```bash
npm ci
npm run validate
npm run build
npx hyperframes doctor
npx hyperframes lint ./templates/cinematic-timeline
npx hyperframes render ./templates/cinematic-timeline --output ./renders/demo.mp4 --fps 30 --quality draft
```

If HyperFrames CLI argument behavior changes, check `npx hyperframes render --help`; the CLI evolves independently of this repository.

## Repository map

- `src/validate-plan.ts` — safe input validation and duration/format/source checks.
- `src/cli.ts` — validate a scene-plan JSON file.
- `schemas/scene-plan.schema.json` — machine-readable plan contract.
- `examples/earth-stops-spinning.json` — illustrative, explicitly speculative demo plan.
- `templates/cinematic-timeline/` — deterministic 9:16 HyperFrames composition with timeline and scientific overlays.
- `.github/workflows/` — validation CI and manually triggered draft render.
- `config/` — visual and provider defaults; no credentials.
- `docs/ARCHITECTURE.md` — pipeline boundaries, data flow, security and cost controls.

## Pipeline stages

`QUEUED → PLANNING → PLANNED → ASSETS_READY → RENDERING → QC → READY_FOR_REVIEW`

Failures transition to `RETRY_PENDING` or `FAILED`. Completed assets should be cached and reused on retries. Never put API keys in manifests, source files, or committed environment files.

## Secrets and provider policy

The initial render needs no AI key. Add `GEMINI_API_KEY` as a GitHub Actions repository secret only when the AI planning stage is implemented. The pipeline must stop safely if a configured budget is exhausted; it must never silently switch to a paid provider.

AI-generated factual claims must include source URLs/evidence, or be clearly labeled as speculative. Every external media asset needs a source URL, creator, license, and attribution instructions before it can enter a final draft.

## Draft artifact contents

The target delivery package is `video.mp4`, `thumbnail.png`, `captions.srt`, `script.md`, `sources.json`, and `qc-report.json`. The starter milestone currently focuses on validating plans and rendering the deterministic demo; later milestones add TTS, sourced assets, captions, and full QC.

## Safety

- No YouTube upload/publishing integration in v1.
- Never execute model-generated HTML, JavaScript, shell commands, or arbitrary URLs.
- Model output is data validated against an allowlist, not executable code.
- Check each asset's license and the selected TTS voice/model license.
