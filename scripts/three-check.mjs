/**
 * 3D + KONTUR KATMANI DENETİMİ
 *
 * Kapsam: WebGL sahnesi, SVG yedeği, kontur alanı, indirgemek (reduced motion),
 * görünürlük ve yeniden boyutlanma davranışı.
 *
 * Kullanım: node scripts/three-check.mjs [port]
 */
import puppeteer from "puppeteer-core";

const PORT = process.argv[2] || "3000";
const BASE = `http://localhost:${PORT}`;
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

let problems = 0;
const note = (s) => {
  problems++;
  console.log("  ! " + s);
};
const ok = (s) => console.log("  ✓ " + s);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: [
    "--no-sandbox",
    "--disable-gpu",
    "--hide-scrollbars",
    // Yazılım WebGL: headless ortamda sahnenin gerçekten kurulması için.
    "--enable-unsafe-swiftshader",
    "--use-gl=swiftshader",
  ],
});

/** Sayfayı açar, WebGL durumunu ve sahne sağlığını ölçer. */
async function inspect(label, { reduced = false, width = 1440, height = 900 } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  if (reduced) {
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
  }
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  // Three dinamik import + ilk kare: zaman tanı.
  await new Promise((r) => setTimeout(r, 3500));

  const res = await page.evaluate(() => {
    const canvases = [...document.querySelectorAll("canvas")];
    const mount = document.querySelector(".pointer-events-none.absolute.inset-0");
    const threeCanvas = mount?.querySelector("canvas") || null;
    const fb = mount?.querySelector("div");
    const r = threeCanvas?.getBoundingClientRect();
    const lineCanvas = canvases.find((c) => c !== threeCanvas);
    let webgl = false;
    try {
      const c = document.createElement("canvas");
      webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webgl = false;
    }
    return {
      webgl,
      canvasCount: canvases.length,
      threeCanvas: !!threeCanvas,
      lineFieldDrawn: !!lineCanvas && lineCanvas.width > 0 && lineCanvas.height > 0,
      buffer: threeCanvas ? threeCanvas.width + "x" + threeCanvas.height : "YOK",
      cssSize: r ? Math.round(r.width) + "x" + Math.round(r.height) : "YOK",
      fallbackOpacity: fb ? getComputedStyle(fb).opacity : "?",
      hasSvgFallback: !!mount?.querySelector("svg"),
    };
  });

  console.log(`\n--- ${label} ---`);
  console.log(
    `  WebGL=${res.webgl} canvas=${res.canvasCount} three=${res.threeCanvas} kontur=${res.lineFieldDrawn}`
  );
  console.log(
    `  buffer=${res.buffer} css=${res.cssSize} yedekOpacity=${res.fallbackOpacity} svgYedek=${res.hasSvgFallback}`
  );
  for (const e of errors.slice(0, 3)) note(`${label} konsol: ${e.slice(0, 130)}`);

  await page.close();
  return res;
}


// === 1) Normal koşul
const norm = await inspect("masaustu 1440x900 (hareket acik)");
if (!norm.webgl) note("WebGL baglami alinamadi (ortam destiklemiyor olabilir)");
if (!norm.threeCanvas) note("3D sahne canvas'i DOM'a eklenmedi — SVG yedek kullaniliyor");
if (!norm.lineFieldDrawn) note("kontur alani (LineField) cizmedi");

if (norm.threeCanvas && parseFloat(norm.fallbackOpacity) > 0.01) {
  note(
    `SVG yedek kapanmamis (opacity=${norm.fallbackOpacity}) — WebGL uzerinde YINE DE gorunuyor (cift gorsuntu)`
  );
} else if (norm.threeCanvas) {
  ok("3D sahne yuklendi, SVG yedek kapandi");
}

// === 2) Indirgemek (reduced motion)
const red = await inspect("masaustu 1440x900 (prefers-reduced-motion: reduce)", {
  reduced: true,
});
if (red.lineFieldDrawn) ok("kontur alani statik cizildi");
if (red.threeCanvas && parseFloat(red.fallbackOpacity) > 0.01) {
  note(
    `reduced-motion: SVG yedek ACIK kaldi (opacity=${red.fallbackOpacity}) — cift mühur basiliyor`
  );
}

// === 3) Mobil
const mob = await inspect("mobil 390x844", { width: 390, height: 844 });
if (!mob.threeCanvas) note("mobilde 3D sahne kurulmadi");


// === 4) Yeniden boyutlandirma
const p2 = await browser.newPage();
await p2.setViewport({ width: 1440, height: 900 });
await p2.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise((r) => setTimeout(r, 3000));
const before = await p2.evaluate(() => {
  const c = document.querySelector(".pointer-events-none.absolute.inset-0 canvas");
  return c ? c.width + "x" + c.height : "YOK";
});
await p2.setViewport({ width: 700, height: 900 });
await new Promise((r) => setTimeout(r, 1500));
const after = await p2.evaluate(() => {
  const c = document.querySelector(".pointer-events-none.absolute.inset-0 canvas");
  const r = c?.getBoundingClientRect();
  return {
    buf: c ? c.width + "x" + c.height : "YOK",
    css: r ? Math.round(r.width) + "x" + Math.round(r.height) : "YOK",
  };
});
console.log(`\n--- yeniden boyutlandirma ---`);
console.log(`  once=${before} sonra=${after.buf} css=${after.css}`);
if (before === after.buf) {
  note("pencere yeniden boyutlandirildi ama canvas arabellegi guncellenmedi");
} else {
  ok("canvas yeniden boyutlandirmayi izledi");
}

// === 5) Sekme gizlendiginde dongu durmali
const idle = await p2.evaluate(async () => {
  const c = document.querySelector(".pointer-events-none.absolute.inset-0 canvas");
  if (!c) return { err: "canvas yok" };
  let frames = 0;
  const orig = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function (cb) {
    frames++;
    return orig(cb);
  };
  await new Promise((r) => setTimeout(r, 1000));
  const visible = frames;
  frames = 0;
  Object.defineProperty(document, "visibilityState", {
    value: "hidden",
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
  await new Promise((r) => setTimeout(r, 1000));
  const hidden = frames;
  window.requestAnimationFrame = orig;
  Object.defineProperty(document, "visibilityState", {
    value: "visible",
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
  return { visible, hidden };
});
console.log(`\n--- gorunurluk ---`);
console.log(`  gorunurken kare=${idle.visible} gizliyken kare=${idle.hidden}`);
if (idle.err) note(`gorunurluk testi: ${idle.err}`);
else if (idle.hidden > idle.visible / 4) {
  note(
    `sekbe gizliyken dongu calismaya devam ediyor (kare ${idle.visible} -> ${idle.hidden}) — gereksiz guc tuketimi`
  );
} else {
  ok("sekbe gizlenince dongu durdu");
}

await p2.close();

// === 6) Indirgemek kahraman goruntusu (cift mühur kontrolü)
const rp = await browser.newPage();
await rp.setViewport({ width: 1440, height: 900 });
await rp.emulateMediaFeatures([
  { name: "prefers-reduced-motion", value: "reduce" },
]);
const hyd = [];
rp.on("console", (m) => {
  if (m.type() === "error") hyd.push(m.text());
});
rp.on("pageerror", (e) => hyd.push("pageerror: " + e.message));
await rp.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise((r) => setTimeout(r, 3500));
await rp.screenshot({ path: "audit/hero-indirgemek.png" });
const hErr = hyd.filter((t) => /hydrat/i.test(t));
console.log(`\n--- indirgemek kahraman ---`);
if (hErr.length) {
  for (const e of hErr.slice(0, 3)) note(`hydration: ${e.slice(0, 120)}`);
} else {
  ok("hydration hatasi yok");
}
await rp.close();

await browser.close();
console.log(`\n3D/KONTUR SORUN SAYISI: ${problems}`);

