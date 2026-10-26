import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validatePlan } from "./validate-plan.js";

test("accepts the example plan", async () => {
  const plan = JSON.parse(await readFile(new URL("../examples/earth-stops-spinning.json", import.meta.url), "utf8"));
  assert.deepEqual(validatePlan(plan), []);
});

test("rejects non-vertical format", () => {
  const plan = {
    video_id: "sample-plan", title: "A sample what-if title",
    format: { width: 1920, height: 1080, fps: 30 }, target_duration_seconds: 30,
    narration_style: "natural_documentary",
    scenes: [
      { id: "scene-one", duration_seconds: 10, narration: "This is a test narration.", visual_type: "diagram", claims: [{ text: "A speculative claim", speculative: true }] },
      { id: "scene-two", duration_seconds: 10, narration: "This is another test narration.", visual_type: "timeline", claims: [] },
      { id: "scene-three", duration_seconds: 10, narration: "This is the final test narration.", visual_type: "cinematic_image", claims: [] }
    ], sources: [], status: "planned"
  };
  assert.ok(validatePlan(plan).some((error) => error.includes("1080×1920")));
});

test("requires sources for non-speculative claims", () => {
  const plan = {
    video_id: "sample-plan", title: "A sample what-if title",
    format: { width: 1080, height: 1920, fps: 30 }, target_duration_seconds: 30,
    narration_style: "natural_documentary",
    scenes: [
      { id: "scene-one", duration_seconds: 10, narration: "This is a test narration.", visual_type: "diagram", claims: [{ text: "A factual claim without evidence" }] },
      { id: "scene-two", duration_seconds: 10, narration: "This is another test narration.", visual_type: "timeline", claims: [] },
      { id: "scene-three", duration_seconds: 10, narration: "This is the final test narration.", visual_type: "cinematic_image", claims: [] }
    ], sources: [], status: "planned"
  };
  assert.ok(validatePlan(plan).some((error) => error.includes("needs source_urls")));
});

test("requires a first-person, topic-specific visual plan for every scene", async () => {
  const plan = JSON.parse(await readFile(new URL("../examples/earth-stops-spinning.json", import.meta.url), "utf8"));
  assert.deepEqual(validatePlan(plan), []);
  delete plan.scenes[0].environment;
  delete plan.scenes[0].visible_changes;
  assert.ok(validatePlan(plan).some((error) => error.includes("environment")));
  assert.ok(validatePlan(plan).some((error) => error.includes("visible_changes")));
});
