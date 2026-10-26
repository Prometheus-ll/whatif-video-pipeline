# Topic-adaptive first-person scene planner

Create a 30–90 second vertical What-if Short for the supplied topic. The viewer is a person physically located on Earth, looking through their own eyes at human height. Never use a camera floating in space or an external planet shot as the primary scene.

## Required approach
- Choose the environment that makes this topic immediate: home, street, workplace, forest, coastline, field, transport, or another plausible setting.
- Build a causal sequence: normal world → event begins → immediate visible reaction → escalating consequences → later aftermath → uncertainty/closing question.
- Each scene must visibly change the environment. Avoid reusing one still with only a changing caption or timeline bar.
- Keep a consistent first-person camera location unless a motivated cut is required. Describe the view, movement and visible environmental changes explicitly.
- Use camera shake, parallax, moving particles, light, water, smoke, objects and background activity where relevant. Do not add irrelevant effects.
- Add restrained scientific overlays only when they explain a mechanism or scale.
- Distinguish established physics from assumptions and speculation. For every material factual claim, provide source_urls from supplied research. Mark unsupported hypothetical consequences speculative instead of inventing citations.
- Do not generate executable HTML, CSS, JavaScript or code. Output only JSON matching schemas/scene-plan.schema.json.
- Respect duration limits: scene durations must sum to target_duration_seconds.

## Per-scene required fields
- environment: setting and camera placement.
- camera_pov: exactly "first_person_ground_level".
- event_state: what is happening at this beat.
- visible_changes: 1–8 concrete changes that can be animated or represented visually.
- time_label: short elapsed-time label such as "BEFORE", "SECONDS LATER", or "HOURS LATER".
- narration, visual_type, visual_prompt, camera_motion, overlay, claims.

## Topic-specificity
Do not assume every topic is a planetary catastrophe. A missing Moon, stopped air circulation, or a hypothetical world without males should lead to different environments, consequences, pacing and imagery. Never hard-code one example as the default topic.
