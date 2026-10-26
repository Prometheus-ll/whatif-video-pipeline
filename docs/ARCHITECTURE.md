# Architecture and delivery plan

## Visual direction: first-person, topic-adaptive simulations

The default camera is a human-scale first-person POV located on Earth, not an exterior space camera. Every episode starts with a topic-specific setting (street, home, forest, shoreline, field, etc.), then shows visible changes over time. The timeline and scientific overlays support the scene; they are not a substitute for environmental simulation.

Topic examples include air circulation suddenly stopping, the Moon disappearing, or a hypothetical loss of all males. Topics must be selected independently for each run; never hard-code Earth stopping its rotation as the channel premise. The scene planner must select setting, visual motifs, physical consequences, time jumps, and explanatory overlays from the current topic.

Use layered procedural animation for low-cost motion (weather, particles, light, camera drift, objects, diagrams) and AI-generated or properly licensed image/video assets for topic-specific realism. For high-quality first-person realism, the long-term asset adapter should support image-to-video or short generated clips where a free quota exists; otherwise use layered stills with parallax and moving elements, and clearly treat them as illustrative. Avoid representing a still frame with a progress bar as a completed simulation.

A topic-specific scene plan should define per beat: environment, camera POV, event state, visible changes, time label, narration, scientific overlay, and source-backed claims. The renderer should consume this data and use approved components rather than model-generated executable code.
## Data flow

1. GitHub Actions manual dispatch or schedule creates a unique job ID and records configuration/input hashes.
2. Topic/script/research adapters produce a structured scene plan. Research evidence is stored separately from model-generated summaries.
3. The validator rejects malformed scenes, unsupported motion names, invalid URLs, invalid durations, and factual claims without evidence unless explicitly marked speculative.
4. Asset adapters create or retrieve images, diagrams, and narration. Each asset records provider, source URL, creator, license, attribution, content hash, and generation parameters.
5. A deterministic composition builder maps approved scene data to predefined HTML/CSS/SVG components. Model output is never executed as code.
6. HyperFrames renders a vertical MP4. FFmpeg/ffprobe perform media checks.
7. QC creates a report and draft package. Workflow artifacts are downloadable; no publishing API is invoked.

## Job state machine

`QUEUED → PLANNING → PLANNED → ASSETS_READY → RENDERING → QC → READY_FOR_REVIEW`

Failure states: `RETRY_PENDING`, `FAILED`. Retries are bounded and stages should be idempotent. Successful assets are cached and not regenerated unnecessarily.

## Provider choices

- **Planning:** Gemini API, selected via configuration from currently available models. No model name is hard-coded. Free-tier limits and data terms vary; inspect the current provider terms before using private material.
- **Research:** search adapter that persists source URLs, page titles, access dates, and evidence snippets. A model's generated prose is not itself a source.
- **Visuals:** licensed media with per-item license checks, or AI-generated stills when a free quota is available. Avoid generating a new video clip for every beat; animate stills and SVG overlays instead.
- **Narration:** local Piper-compatible TTS as a low-cost candidate, but confirm the engine and exact voice model license. Hosted TTS is opt-in and must be blocked unless `ALLOW_PAID_PROVIDERS=true`.
- **Rendering:** HyperFrames CLI with Node.js 22+ and FFmpeg. GitHub Actions is the first cloud runner; measure actual runtime and artifact sizes before adopting managed cloud rendering.
- **Storage:** GitHub Actions artifacts initially. Generated videos do not belong in Git history. Use object storage only when retention needs exceed artifact availability/size limits.

## Secrets and spend protection

Keep API keys in GitHub Actions repository secrets. Never commit `.env`, tokens, or generated secrets. Set explicit per-job limits for AI calls, image generations, retries, duration, and provider spend. If a free quota is exhausted, stop and report it—never silently upgrade to a paid provider.

## Repository layout

- `src/`: TypeScript validation and orchestration.
- `schemas/`: plan contract.
- `examples/`: test fixture and demo plan.
- `templates/cinematic-timeline/`: deterministic composition.
- `.github/workflows/`: CI and manual render.
- `config/`: defaults and visual design tokens.
- `docs/`: architecture and operating notes.

## Acceptance tests

1. Plan is valid structured JSON and includes a hook, progression, explanation, and ending.
2. Total duration is 30–90 seconds and equals scene durations within 0.5 seconds.
3. Output is 1080×1920, 9:16, 30 fps.
4. Narration exists, is intelligible, and aligns with scene timing.
5. Captions match approved narration and remain within safe margins.
6. Factual claims have source URLs/evidence or are explicitly marked speculative.
7. External assets have source, creator, license, and attribution details.
8. No missing media, broken overlays, unexpected blank frames, or unreadable text.
9. Audio is present, unclipped, and has no unintended silence.
10. Failed stages resume without regenerating completed assets.
11. Retry and cost caps prevent runaway usage and unapproved paid calls.
12. Draft package includes MP4, thumbnail, subtitles, script, sources, and QC report.
13. Publishing remains manual; no automated upload occurs.

## Milestones

1. Repository foundation, plan schema, validator, visual template, CI.
2. First deterministic 45-second sample render.
3. Gemini planning and source/evidence collection.
4. Narration + licensed/AI stills + attribution manifest.
5. Captioning, media QC, resumable jobs, draft packaging.
6. Compare GitHub Actions render against managed rendering only after measuring costs.
