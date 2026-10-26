import type { ScenePlan } from "../validate-plan.js";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character] ?? character);
}

function secondsToFrames(seconds: number, fps: number): number {
  return Math.round(seconds * fps);
}

/**
 * Builds a deterministic, seekable HTML composition from a validated scene plan.
 * All user/model-provided strings are HTML-escaped; the scene plan never supplies executable code.
 *
 * This is the procedural renderer foundation. Topic-specific licensed/generated footage and
 * the final MP4/FFmpeg adapter are separate pipeline stages.
 */
export function buildSimulationHtml(plan: ScenePlan): string {
  const fps = plan.format.fps;
  let startFrame = 0;
  const scenes = plan.scenes.map((scene, index) => {
    const durationFrames = secondsToFrames(scene.duration_seconds, fps);
    const from = startFrame;
    const to = from + durationFrames;
    startFrame = to;
    const changes = scene.visible_changes.map((change, changeIndex) =>
      `<div class="change change-${changeIndex % 4}" style="--delay:${changeIndex * 180}ms">${escapeHtml(change)}</div>`
    ).join("");
    const headline = scene.overlay?.text ?? scene.time_label;
    const motion = scene.camera_motion ?? "none";
    return `<section class="scene scene-${index % 5}" data-start-frame="${from}" data-end-frame="${to}" data-start="${(from / fps).toFixed(3)}" data-duration="${scene.duration_seconds}" data-scene-id="${escapeHtml(scene.id)}">
      <div class="environment"></div><div class="horizon"></div><div class="foreground"></div>
      <div class="grain"></div><div class="vignette"></div>
      <header><span>WHAT IF / ${String(index + 1).padStart(2, "0")}</span><span>FIRST-PERSON POV</span></header>
      <div class="setting">${escapeHtml(scene.environment)}</div>
      <div class="event-tag">${escapeHtml(headline)}</div>
      <div class="event-state">${escapeHtml(scene.event_state)}</div>
      <div class="changes">${changes}</div>
      <footer><span>${escapeHtml(scene.time_label)}</span><span>${escapeHtml(scene.narration)}</span></footer>
      <div class="camera-motion" data-motion="${escapeHtml(motion)}"></div>
    </section>`;
  }).join("\n");
  const duration = plan.target_duration_seconds;
  const totalFrames = secondsToFrames(duration, fps);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(plan.title)}</title>
<style>
*{box-sizing:border-box}html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#050b12;color:#f4f8ff;font-family:Inter,Arial,sans-serif}
#composition{position:relative;width:1080px;height:1920px;overflow:hidden;background:#081521}
.scene{position:absolute;inset:0;overflow:hidden;opacity:0;visibility:hidden;transform:translateZ(0);background:#102a38}
.scene.active{opacity:1;visibility:visible}
.environment{position:absolute;inset:0;background:linear-gradient(180deg,#15374c 0%,#86a9b2 38%,#536e5d 39%,#182c27 100%);animation:environmentDrift 12s ease-in-out infinite alternate}
.scene-1 .environment{background:linear-gradient(180deg,#273e51 0%,#a6a6a0 40%,#5c5146 41%,#211e20 100%)}
.scene-2 .environment{background:linear-gradient(180deg,#182d48 0%,#647c8a 40%,#454d48 41%,#151a1c 100%)}
.scene-3 .environment{background:linear-gradient(180deg,#202d42 0%,#596b77 42%,#42413c 43%,#14191d 100%)}
.scene-4 .environment{background:linear-gradient(180deg,#111d31 0%,#405767 42%,#273a36 43%,#0c1417 100%)}
.horizon{position:absolute;left:-10%;right:-10%;top:40%;height:25%;background:linear-gradient(180deg,#718778,#243a32);clip-path:polygon(0 25%,15% 8%,32% 27%,52% 4%,72% 24%,90% 7%,100% 20%,100% 100%,0 100%);animation:horizonShift 9s ease-in-out infinite alternate}
.foreground{position:absolute;left:-20%;right:-20%;bottom:-12%;height:48%;background:linear-gradient(180deg,#39463d,#111b1a);clip-path:polygon(0 0,100% 0,100% 100%,0 100%)}
.foreground:before{content:"";position:absolute;left:25%;right:25%;top:0;height:100%;background:linear-gradient(90deg,#1b272b,#465055 50%,#182328);clip-path:polygon(43% 0,57% 0,100% 100%,0 100%)}
.grain{position:absolute;inset:0;opacity:.07;background-image:radial-gradient(#fff 0.6px,transparent .8px);background-size:5px 5px}
.vignette{position:absolute;inset:0;background:radial-gradient(ellipse,transparent 25%,#02060bdc 100%)}
header{position:absolute;top:60px;left:62px;right:62px;display:flex;justify-content:space-between;font-size:18px;letter-spacing:4px;font-weight:800;color:#a5f2ff}
.setting{position:absolute;top:120px;left:62px;right:62px;font-size:24px;line-height:1.3;color:#e3f0f6;text-shadow:0 2px 15px #000;max-height:100px;overflow:hidden}
.event-tag{position:absolute;top:290px;left:62px;right:62px;font-size:25px;letter-spacing:4px;color:#9af1ff;font-weight:900}
.event-state{position:absolute;top:355px;left:62px;right:62px;font-size:62px;line-height:1.02;font-weight:900;letter-spacing:-2px;text-shadow:0 4px 20px #0008}
.changes{position:absolute;top:1040px;left:62px;right:62px;display:grid;gap:18px}
.change{padding:20px 24px;background:linear-gradient(90deg,#07131bdc,#07131b66);border-left:5px solid #9af1ff;font-size:27px;line-height:1.2;font-weight:700;animation:changeIn .6s both;animation-delay:var(--delay)}
.change-1{margin-left:30px}.change-2{margin-left:60px}.change-3{margin-left:20px}
footer{position:absolute;left:62px;right:62px;bottom:170px;display:flex;flex-direction:column;gap:16px}
footer span:first-child{font-size:21px;letter-spacing:4px;color:#9af1ff;font-weight:900}
footer span:last-child{font-size:25px;line-height:1.25;font-weight:700;max-height:125px;overflow:hidden}
.camera-motion{position:absolute;inset:0;pointer-events:none;animation:cameraDrift 8s ease-in-out infinite alternate}
.camera-motion[data-motion="slow_push_in"]{animation-name:pushIn}.camera-motion[data-motion="slow_pull_out"]{animation-name:pullOut}.camera-motion[data-motion="pan_left"]{animation-name:panLeft}.camera-motion[data-motion="pan_right"]{animation-name:panRight}
@keyframes environmentDrift{from{transform:scale(1) translateX(-1%)}to{transform:scale(1.08) translateX(1%)}}
@keyframes horizonShift{from{transform:translateX(-1.5%)}to{transform:translateX(1.5%)}}
@keyframes cameraDrift{from{transform:translate(0,0)}to{transform:translate(1%,-.5%)}}
@keyframes pushIn{from{transform:scale(1)}to{transform:scale(1.08)}}@keyframes pullOut{from{transform:scale(1.08)}to{transform:scale(1)}}
@keyframes panLeft{from{transform:translateX(2%)}to{transform:translateX(-2%)}}@keyframes panRight{from{transform:translateX(-2%)}to{transform:translateX(2%)}}
@keyframes changeIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
</style></head>
<body><main id="composition" data-composition-id="${escapeHtml(plan.video_id)}" data-width="${plan.format.width}" data-height="${plan.format.height}" data-fps="${fps}" data-duration="${duration}" data-total-frames="${totalFrames}">
${scenes}
</main>
<script>
(() => {
 const scenes=[...document.querySelectorAll(".scene")];
 const fps=Number(document.querySelector("#composition").dataset.fps);
 const totalFrames=Number(document.querySelector("#composition").dataset.totalFrames);
 // Host renderers may set window.__FRAME__ before each snapshot; otherwise preview uses wall-clock time.
 window.setSimulationFrame=(frame)=>{
   const safeFrame=Math.max(0,Math.min(totalFrames-1,Math.floor(frame)));
   let active=null;
   for(const scene of scenes){
     const start=Number(scene.dataset.startFrame),end=Number(scene.dataset.endFrame);
     const show=safeFrame>=start && safeFrame<end;
     scene.classList.toggle("active",show);
     if(show)active=scene;
   }
   return active;
 };
 window.setSimulationTime=(seconds)=>window.setSimulationFrame(seconds*fps);
 window.setSimulationFrame(Number(window.__FRAME__||0));
 if(!("__FRAME__" in window)){
   let last=-1;
   const preview=()=>{const frame=Math.floor(performance.now()/1000*fps)%totalFrames;if(frame!==last){window.setSimulationFrame(frame);last=frame}requestAnimationFrame(preview)};
   // Preview playback is convenient in a browser. Deterministic renderers should call setSimulationFrame themselves.
   requestAnimationFrame(preview);
 }
})();
</script></body></html>`;
}
