import { readFile } from "node:fs/promises";

export type Claim = {
  text: string;
  source_urls?: string[];
  speculative?: boolean;
};

export type Scene = {
  id: string;
  duration_seconds: number;
  narration: string;
  visual_type: "cinematic_image" | "diagram" | "timeline" | "licensed_clip";
  visual_prompt?: string;
  camera_motion?: "none" | "slow_push_in" | "slow_pull_out" | "pan_left" | "pan_right";
  overlay?: { type: "headline" | "label" | "callout" | "timeline"; text: string };
  sound_effects?: string[];
  claims?: Claim[];
};

export type ScenePlan = {
  video_id: string;
  title: string;
  format: { width: number; height: number; fps: number };
  target_duration_seconds: number;
  narration_style: "natural_documentary";
  scenes: Scene[];
  sources: { url: string; title: string; accessed_at?: string }[];
  status: "planned";
};

const allowedVisuals = new Set(["cinematic_image", "diagram", "timeline", "licensed_clip"]);
const allowedMotions = new Set(["none", "slow_push_in", "slow_pull_out", "pan_left", "pan_right"]);
const urlIsHttp = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

export function validatePlan(value: unknown): string[] {
  const errors: string[] = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return ["Plan must be a JSON object."];
  const plan = value as Partial<ScenePlan>;

  if (typeof plan.video_id !== "string" || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(plan.video_id)) errors.push("video_id must be 3–64 lowercase letters, numbers, or hyphens.");
  if (typeof plan.title !== "string" || plan.title.trim().length < 8 || plan.title.length > 100) errors.push("title must be 8–100 characters.");
  if (plan.format?.width !== 1080 || plan.format?.height !== 1920) errors.push("format must be 1080×1920 (vertical 9:16).");
  if (plan.format?.fps !== 30) errors.push("format.fps must be 30.");
  if (typeof plan.target_duration_seconds !== "number" || plan.target_duration_seconds < 30 || plan.target_duration_seconds > 90) errors.push("target_duration_seconds must be between 30 and 90.");
  if (plan.narration_style !== "natural_documentary") errors.push("narration_style must be natural_documentary.");
  if (plan.status !== "planned") errors.push("status must be planned.");
  if (!Array.isArray(plan.scenes) || plan.scenes.length < 3 || plan.scenes.length > 18) errors.push("scenes must contain 3–18 scenes.");
  if (!Array.isArray(plan.sources)) errors.push("sources must be an array.");

  const sceneIds = new Set<string>();
  let totalDuration = 0;
  for (const [index, rawScene] of (Array.isArray(plan.scenes) ? plan.scenes : []).entries()) {
    const scene = rawScene as Partial<Scene>;
    const prefix = `scenes[${index}]`;
    if (typeof scene.id !== "string" || !/^[a-z0-9-]{1,40}$/.test(scene.id)) errors.push(`${prefix}.id is invalid.`);
    else if (sceneIds.has(scene.id)) errors.push(`${prefix}.id duplicates another scene.`);
    else sceneIds.add(scene.id);
    if (typeof scene.duration_seconds !== "number" || scene.duration_seconds < 2 || scene.duration_seconds > 20) errors.push(`${prefix}.duration_seconds must be 2–20.`);
    else totalDuration += scene.duration_seconds;
    if (typeof scene.narration !== "string" || scene.narration.trim().length < 4 || scene.narration.length > 800) errors.push(`${prefix}.narration must be 4–800 characters.`);
    if (typeof scene.visual_type !== "string" || !allowedVisuals.has(scene.visual_type)) errors.push(`${prefix}.visual_type is not allowed.`);
    if (scene.camera_motion && !allowedMotions.has(scene.camera_motion)) errors.push(`${prefix}.camera_motion is not allowed.`);
    if (scene.overlay && (typeof scene.overlay.text !== "string" || scene.overlay.text.length > 90)) errors.push(`${prefix}.overlay.text must be at most 90 characters.`);
    for (const claim of scene.claims ?? []) {
      if (!claim || typeof claim.text !== "string" || !claim.text.trim()) {
        errors.push(`${prefix} contains an invalid claim.`);
        continue;
      }
      if (claim.speculative !== true && (!Array.isArray(claim.source_urls) || claim.source_urls.length === 0)) errors.push(`${prefix} claim needs source_urls or speculative: true.`);
      for (const url of claim.source_urls ?? []) if (!urlIsHttp(url)) errors.push(`${prefix} claim source URL must use HTTP(S).`);
    }
  }
  if (typeof plan.target_duration_seconds === "number" && Math.abs(totalDuration - plan.target_duration_seconds) > 0.5) {
    errors.push(`Scene durations total ${totalDuration}s, not target ${plan.target_duration_seconds}s (tolerance 0.5s).`);
  }
  for (const [index, source] of (Array.isArray(plan.sources) ? plan.sources : []).entries()) {
    if (!source || typeof source.url !== "string" || !urlIsHttp(source.url)) errors.push(`sources[${index}].url must be HTTP(S).`);
  }
  return errors;
}

export async function validatePlanFile(path: string): Promise<{ valid: boolean; errors: string[]; plan?: ScenePlan }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    return { valid: false, errors: [`Unable to read valid JSON: ${error instanceof Error ? error.message : String(error)}`] };
  }
  const errors = validatePlan(parsed);
  return errors.length ? { valid: false, errors } : { valid: true, errors, plan: parsed as ScenePlan };
}
