import { validatePlanFile } from "./validate-plan.js";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node dist/cli.js <scene-plan.json>");
  process.exit(2);
}
const result = await validatePlanFile(file);
if (!result.valid) {
  console.error("Scene plan rejected:");
  for (const error of result.errors) console.error(` - ${error}`);
  process.exit(1);
}
console.log(JSON.stringify({
  valid: true,
  video_id: result.plan?.video_id,
  scenes: result.plan?.scenes.length,
  duration_seconds: result.plan?.target_duration_seconds,
  format: result.plan?.format
}, null, 2));
