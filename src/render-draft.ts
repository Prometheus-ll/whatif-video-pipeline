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
const frameDir = join(outputDir, "frames");
await mkdir(frameDir, { recursive: true });
await writeFile(htmlPath, buildSimulationHtml(plan), "utf8");
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
try {
  const page = await browser.newPage({ viewport: { width: plan.format.width, height: plan.format.height }, deviceScaleFactor: 1 });
  await page.goto("file://" + htmlPath, { waitUntil: "load" });
  await page.waitForTimeout(300);
  const totalFrames = Math.round(plan.target_duration_seconds * plan.format.fps);
  for (let frame = 0; frame < totalFrames; frame++) {
    await page.evaluate((value) => (window as unknown as { setSimulationFrame: (n: number) => void }).setSimulationFrame(value), frame);
    await page.screenshot({ path: join(frameDir, `frame-${String(frame).padStart(6, "0")}.png`), type: "png" });
  }
  const mp4Path = join(outputDir, `${plan.video_id}.mp4`);
  await new Promise<void>((resolvePromise, reject) => {
    const proc = spawn("ffmpeg", ["-y", "-framerate", String(plan.format.fps), "-i", join(frameDir, "frame-%06d.png"), "-an", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4Path], { stdio: "inherit" });
    proc.on("error", reject);
    proc.on("exit", (code) => code === 0 ? resolvePromise() : reject(new Error(`ffmpeg exited with code ${code}`)));
  });
  await writeFile(join(outputDir, "DRAFT-NOTES.txt"), "Visual-only draft. No narration/audio is included yet. Review scene motion and composition before publication.\n", "utf8");
  console.log(JSON.stringify({ ok: true, mp4: mp4Path, duration_seconds: plan.target_duration_seconds, frames: totalFrames, audio: false }, null, 2));
} finally {
  await browser.close();
}
