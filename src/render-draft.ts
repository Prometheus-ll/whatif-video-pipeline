import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve, join } from "node:path";
import { chromium } from "playwright";
import { validatePlan } from "./validate-plan.js";
import { buildSimulationHtml } from "./render/build-simulation-html.js";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node dist/render-draft.js <scene-plan.json>");
  process.exit(2);
}
const plan = JSON.parse(await readFile(resolve(input), "utf8"));
const errors = validatePlan(plan);
if (errors.length) {
  console.error("Scene plan rejected:", ...errors);
  process.exit(1);
}

const outputDir = resolve("output", plan.video_id);
await mkdir(outputDir, { recursive: true });
const htmlPath = join(outputDir, "composition.html");
const captureDir = join(outputDir, "capture");
await mkdir(captureDir, { recursive: true });
await writeFile(htmlPath, buildSimulationHtml(plan), "utf8");

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
let webmPath = "";
try {
  const context = await browser.newContext({
    viewport: { width: plan.format.width, height: plan.format.height },
    deviceScaleFactor: 1,
    recordVideo: { dir: captureDir, size: { width: plan.format.width, height: plan.format.height } }
  });
  const page = await context.newPage();
  await page.goto("file://" + htmlPath, { waitUntil: "load" });
  await page.waitForTimeout(500);
  const video = page.video();
  if (!video) throw new Error("Browser video recording did not start.");
  // Record the browser's animated composition once, instead of taking thousands of PNG screenshots.
  await page.waitForTimeout(plan.target_duration_seconds * 1000);
  await context.close();
  webmPath = await video.path();
  const mp4Path = join(outputDir, `${plan.video_id}.mp4`);
  await new Promise<void>((resolvePromise, reject) => {
    const proc = spawn("ffmpeg", [
      "-y", "-i", webmPath,
      "-t", String(plan.target_duration_seconds),
      "-vf", `fps=${plan.format.fps},scale=${plan.format.width}:${plan.format.height}:flags=fast_bilinear`,
      "-an", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "25",
      "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4Path
    ], { stdio: "inherit" });
    proc.on("error", reject);
    proc.on("exit", (code) => code === 0 ? resolvePromise() : reject(new Error(`ffmpeg exited with code ${code}`)));
  });
  await writeFile(join(outputDir, "DRAFT-NOTES.txt"),
    "Visual-only procedural draft. No narration/audio or topic-specific generated footage is included yet. Review motion and scene changes before publication.\n",
    "utf8");
  console.log(JSON.stringify({
    ok: true, mp4: mp4Path, duration_seconds: plan.target_duration_seconds,
    fps: plan.format.fps, resolution: `${plan.format.width}x${plan.format.height}`,
    capture: "single browser video recording", audio: false
  }, null, 2));
} finally {
  await browser.close();
}
