/**
 * GERCEK CIHAZ EMULASYONU — DevTools Device Mode'a YAKIN kosullar.
 * Önceki test deviceScaleFactor:1 kullaniyordu; gercek cihaz modunda DPR
 * 2/2.625/3 olur ve `screen` ölçüsü viewport'tan FARKLIDIR. Puppeteer'in
 * KnownDevices + page.emulate() bu farki taklit eder.
 */
import puppeteer, { KnownDevices } from "puppeteer-core";

const PORT = process.argv[2] || "3222";
const BASE = `http://localhost:${PORT}`;

const PRESETS = [
  "iPhone SE", "iPhone 12", "iPhone 13", "iPhone 14 Pro", "iPhone 15 Pro",
  "iPhone 16", "iPhone 16 Pro", "Pixel 5", "Pixel 7", "Pixel 8",
  "Galaxy S9+", "Galaxy S10+", "iPad Mini",
].filter((n) => !!KnownDevices[n]);

let problems = 0;

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--enable-unsafe-swiftshader"],
});

async function inspect(page, label) {
  const d = await page.evaluate(() => {
    const a = document.querySelector('a[aria-label*="WhatsApp"]');
    if (!a) return { found: false };
    const r = a.getBoundingClientRect();
    const cs = getComputedStyle(a);
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const vv = window.visualViewport;
    return {
      found: true,
      w: +r.width.toFixed(1), h: +r.height.toFixed(1),
      x: +r.x.toFixed(1), y: +r.y.toFixed(1),
      display: cs.display, visibility: cs.visibility, opacity: +cs.opacity,
      position: cs.position, zIndex: cs.zIndex,
      offsetParent: a.offsetParent ? a.offsetParent.tagName : "null",
      inView: r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight + 1 && r.right <= window.innerWidth + 1,
      hitOk: !!top && (top === a || a.contains(top)),
      hitEl: top ? top.tagName + "." + String(top.className).slice(0, 24) : "null",
      vp: `${window.innerWidth}x${window.innerHeight}`,
      vv: vv ? `${Math.round(vv.width)}x${Math.round(vv.height)}` : "-",
      dpr: window.devicePixelRatio,
    };
  });
  const shot = await page.screenshot({ encoding: "base64" });
  const px = await page.evaluate(async (b) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b;
    await img.decode();
    const cv = document.createElement("canvas");
    cv.width = img.width; cv.height = img.height;
    const c = cv.getContext("2d");
    c.drawImage(img, 0, 0);
    const dd = c.getImageData(0, 0, cv.width, cv.height).data;
    let n = 0;
    for (let i = 0; i < dd.length; i += 4) {
      if (dd[i + 1] > 100 && dd[i + 1] > dd[i] + 45 && dd[i + 1] > dd[i + 2] + 20) n++;
    }
    return n;
  }, shot);
  const bad = [];
  if (!d.found) bad.push("DOM YOK");
  else {
    if (d.display === "none" || d.visibility === "hidden" || d.opacity === 0) bad.push("gizli");
    if (!d.inView) bad.push(`vp disi y=${d.y} vp=${d.vp}`);
    if (!d.hitOk) bad.push(`ustte ${d.hitEl}`);
    if (px === 0) bad.push("EKRANDA YESIL YOK");
  }
  if (bad.length) problems++;
  console.log(`${bad.length ? "!   " : "ok  "} ${label.padEnd(15)} dpr=${d.dpr || "?"} ${d.found ? d.w + "x" + d.h : "yok"} yesil=${String(px).padStart(5)} vp=${d.vp || "?"} vv=${d.vv || "?"} op=${d.offsetParent || "-"} ${bad.length ? "-> " + bad.join(", ") : ""}`);
}

console.log("=== GERCEK CIHAZ PRESETLERI (DPR dahil) ===");
for (const name of PRESETS) {
  const dev = KnownDevices[name];
  const p = await browser.newPage();
  await p.emulate(dev);
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1000));
  await inspect(p, name + " P");
  await p.setViewport({ width: dev.viewport.height, height: dev.viewport.width, deviceScaleFactor: dev.viewport.deviceScaleFactor, isMobile: true, hasTouch: true });
  await p.reload({ waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1000));
  await inspect(p, name + " Y");
  await p.close();
}

console.log("\n=== RESPONSIVE @3x ===");
for (const w of [320, 360, 375, 390, 414, 430]) {
  const p = await browser.newPage();
  await p.setViewport({ width: w, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 900));
  await inspect(p, w + "px@3x");
  await p.close();
}

await browser.close();
console.log(`\nTOPLAM SORUN: ${problems}`);
