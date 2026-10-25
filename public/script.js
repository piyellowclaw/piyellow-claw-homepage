"use strict";
// Both languages are full HTML documents. Storage is optional.
const year = document.querySelector("#year");
if (year) year.textContent = String(new Date().getFullYear());
try {
  const chosen = new URLSearchParams(location.search).get("lang");
  const current = document.documentElement.lang === "en" ? "en" : "zh";
  const saved = localStorage.getItem("piyellow-language");
  if ((chosen === "en" || chosen === "zh") && chosen !== current) {
    location.replace(chosen === "en" ? "en.html?lang=en" : "index.html?lang=zh");
  } else if (!chosen && saved && saved !== current && (saved === "en" || saved === "zh")) {
    location.replace(saved === "en" ? "en.html?lang=en" : "index.html?lang=zh");
  } else {
    localStorage.setItem("piyellow-language", current);
  }
} catch (_) { /* Keep navigation usable when storage is blocked. */ }
document.querySelectorAll("[data-language]").forEach(link => {
  link.addEventListener("click", () => {
    try { localStorage.setItem("piyellow-language", link.dataset.language); } catch (_) {}
  });
});

// Original deterministic plotter portrait. No network or activity feed.
(() => {
  const canvas = document.querySelector('#portrait');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const en = document.documentElement.lang === 'en';
  const density = document.querySelector('#density');
  const output = document.querySelector('#density-value');
  const motion = document.querySelector('#motion');
  const status = document.querySelector('#sketch-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let seed = 417, running = false, visible = true, frame = 0, last = 0, phase = 0;
  let pointer = null;
  const say = () => {
    status.textContent = `${running ? (en ? 'Breathing' : '呼吸中') : (en ? 'Still' : '靜止')} · ${en ? 'seed' : '種子'} ${String(seed).padStart(4, '0')} · ${en ? 'density' : '密度'} ${density.value}${reduced.matches ? (en ? ' · reduced motion' : ' · 減少動態') : ''}`;
    motion.textContent = running ? (en ? 'Pause breathing' : '暫停呼吸') : (en ? 'Start breathing' : '啟動呼吸');
    motion.setAttribute('aria-pressed', String(running));
  };
  function draw() {
    const box = canvas.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const w = Math.min(1600, Math.round(box.width * dpr));
    const h = Math.round(w * box.height / box.width);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    ctx.setTransform(w / 1400, 0, 0, h / 700, 0, 0);
    ctx.clearRect(0, 0, 1400, 700);
    ctx.lineWidth = .85;
    let state = seed;
    const random = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
    const twist = .8 + random() * .45;
    const count = Number(density.value);
    // Nested contour bands grow through three distinct branch regions.
    for (let branch = 0; branch < 3; branch++) {
      const angle = -2.55 + branch * 1.02;
      const reach = 230 + random() * 85;
      for (let line = 0; line < count; line++) {
        const q = line / (count - 1);
        ctx.beginPath();
        ctx.strokeStyle = line % 13 === 0 ? '#b44632' : '#20251f';
        for (let step = 0; step <= 110; step++) {
          const t = step / 110;
          const a = angle + Math.sin(t * Math.PI) * twist + (q - .5) * (.55 + t * .7);
          const radius = 45 + t * reach;
          let x = 690 + Math.cos(a) * radius * 1.64 + Math.sin(t * 9 + q * 4) * 19;
          let y = 450 + Math.sin(a) * radius + (q - .5) * 98 * Math.sin(t * Math.PI);
          y += Math.sin(t * 6 + phase) * 2;
          if (pointer) {
            const dx = x - pointer.x, dy = y - pointer.y;
            const influence = Math.exp(-(dx * dx + dy * dy) / 24000);
            x += dx * influence * .055; y += dy * influence * .055;
          }
          if (step === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    // The palm folds into a woven orbital sun; same seed, same structure.
    for (let i = 0; i < count; i++) {
      const q = i / count;
      ctx.beginPath(); ctx.strokeStyle = i % 17 === 0 ? '#b44632' : '#20251f';
      for (let j = 0; j <= 140; j++) {
        const a = j / 140 * Math.PI * 2;
        const r = 105 + q * 104 + Math.sin(a * 3 + twist) * 22 * q;
        const x = 810 + Math.cos(a) * r * 1.48;
        const y = 426 + Math.sin(a) * r * .82 + Math.sin(a * 2 + q * 7) * 17;
        if (!j) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
    }
    // Registration grid and small recursive subdivision specimen.
    ctx.lineWidth = .7; ctx.strokeStyle = '#20251f';
    for (const [x,y] of [[60,55],[1340,55],[60,645],[1340,645]]) {
      ctx.beginPath();ctx.moveTo(x-9,y);ctx.lineTo(x+9,y);ctx.moveTo(x,y-9);ctx.lineTo(x,y+9);ctx.stroke();
    }
    function divide(x,y,w,h,depth) {
      ctx.strokeRect(x,y,w,h);
      if (!depth) return;
      const split = .38 + random() * .24;
      if (w > h) { divide(x,y,w*split,h,depth-1); divide(x+w*split,y,w*(1-split),h,depth-1); }
      else { divide(x,y,w,h*split,depth-1); divide(x,y+h*split,w,h*(1-split),depth-1); }
    }
    divide(1120,480,155,115,3);
  }
  function tick(time) {
    frame = 0;
    if (!running || !visible || document.hidden || reduced.matches) return;
    if (time - last >= 80) { phase += .025; draw(); last = time; }
    frame = requestAnimationFrame(tick);
  }
  function schedule() {
    cancelAnimationFrame(frame); frame = 0;
    if (running && visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
  }
  document.querySelector('#regenerate').addEventListener('click', () => {
    seed = (seed + 7919) % 10000; phase = 0; draw(); say();
  });
  density.addEventListener('input', () => { output.value = density.value; draw(); });
  density.addEventListener('change', say);
  motion.addEventListener('click', () => {
    running = !running;
    // Reduced motion always remains a still composition.
    if (reduced.matches) running = false;
    say(); schedule();
  });
  function motionPreference() {
    if (reduced.matches) running = false;
    motion.disabled = reduced.matches;
    say(); schedule();
  }
  reduced.addEventListener('change', motionPreference);
  canvas.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || reduced.matches) return;
    const box = canvas.getBoundingClientRect();
    pointer = {x: (event.clientX-box.left)/box.width*1400, y:(event.clientY-box.top)/box.height*700};
    if (!frame) frame = requestAnimationFrame(() => {frame = 0; draw(); schedule();});
  });
  canvas.addEventListener('pointerleave', () => { pointer = null; draw(); });
  document.addEventListener('visibilitychange', schedule);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting; schedule();
  }).observe(canvas);
  if ('ResizeObserver' in window) new ResizeObserver(draw).observe(canvas);
  else window.addEventListener('resize', draw);
  motionPreference(); draw();
})();
