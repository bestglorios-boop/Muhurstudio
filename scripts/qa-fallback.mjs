/**
 * qa-fallback.mjs — 3B yedeğinin GERÇEKTEN görünür olduğunu doğrular.
 *   node scripts/qa-fallback.mjs [port]
 *
 * İki kip ölçülür:
 *   A) normal  → canvas var, yedek opaklığı düşmüş (opaklık 0 olmalı)
 *   B) WebGL kapatılmış → canvas olmamalı, yedek GÖRÜNÜR olmalı (opaklık 1)
 *
 * "canvas var" demek "3B çalışıyor" demek DEĞİLDİR; ölçüm olan şey
 * kullanıcının gerçekten bir mühür görmesidir.
 */
import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

const ORIGIN = `http://localhost:${process.argv[2] || "3000"}`;

function chromePath() {
  const c = [
    `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ];
  return c.find((p) => p && existsSync(p)) || null;
}
const exec = chromePath();
if (!exec) {
  console.error("HATA: Chrome/Edge bulunamadi.");
  process.exit(2);
}

const browser = await puppeteer.launch({
  executablePath: exec,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader"],
});

/**
 * Yedeğin gerçekten görünür olduğunu ölçer.
 *
 * KAPSAM SEÇİCİ: mühür konteyneri, FallbackSeal'in kendi SVG'sini içerir.
 * `aria-hidden` + `pointer-events-none` YETMEZ — arka plan alanı (LineField)
 * de aynı sınıfları taşır ve ölçüm yanlış yere düşerdi. Bu yüzden
 * `viewBox="0 0 600 600"` taşıyan SVG üzerinden yukarı çıkılır.
 */
const PROBE = () => {
  const svg = document.querySelector('svg[viewBox="0 0 600 600"]');
  if (!svg) return { found: false };
  const layer = svg.parentElement; // opacity taşıyan sarmalayıcı
  const cs = layer ? getComputedStyle(layer) : null;
  const sr = svg.getBoundingClientRect();
  // Canvas, mountRef'te (sarmalayıcının BİR ÜSTÜ) durur — `closest("div")`
  // sarmalayıcının kendisini verir ve canvas'ı bulamaz.
  const host = layer && layer.parentElement;
  const canvas = host ? host.querySelector("canvas") : null;
  return {
    found: true,
    opacity: cs ? Number(cs.opacity) : null,
    visibility: cs ? cs.visibility : null,
    svgW: Math.round(sr.width),
    svgH: Math.round(sr.height),
    svgVisible: sr.width > 40 && sr.height > 40 && cs && cs.visibility !== "hidden",
    canvas: !!canvas,
    canvasW: canvas ? canvas.width : 0,
  };
};

const fail = [];
const out = (k, v) => console.log("  " + k + ": " + JSON.stringify(v));

// ---- A) normal kip
{
  const p = await browser.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  await p.goto(ORIGIN + "/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 3500));
  const s = await p.evaluate(PROBE);
  console.log("A) NORMAL");
  out("ölçüm", s);
  if (!s.found) {
    fail.push("mühür hiç render edilmedi");
  } else {
    // Başsız (headless) Chrome'da GPU yoktur, bu yüzden WebGL çoğu zaman
    // kurulamaz. O durumda 3B YOLU buradan doğrulanamaz — ama yedek yine de
    // görünür olmalıdır, çünkü kullanıcının gördüğü şey budur.
    const webglAlive = s.canvas && s.canvasW > 0;
    if (webglAlive) {
      console.log("   (3B kuruldu; yedek opacity=" + s.opacity + " olmali)");
      if (s.opacity !== 0) fail.push("3B hazır ama yedek hâlâ görünür (opacity=" + s.opacity + ")");
    } else {
      console.log("   (headless: WebGL yok — 3B yolu bu ortamda doğrulanamıyor)");
      console.log("   (yedek görünür olmalı, opacity=" + s.opacity + ")");
      if (s.opacity !== 1) fail.push("WebGL yokken yedek gizli (opacity=" + s.opacity + ")");
    }
    if (!s.svgVisible) fail.push("yedek SVG görünür değil: " + s.svgW + "x" + s.svgH);
  }
  await p.close();
}

// ---- B) WebGL kapalı
{
  const p = await browser.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  await p.evaluateOnNewDocument(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, ...a) {
      if (String(t).includes("webgl")) return null;
      return orig.call(this, t, ...a);
    };
  });
  await p.goto(ORIGIN + "/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 3000));
  const s = await p.evaluate(PROBE);
  console.log("B) WEBGL KAPALI");
  out("ölçüm", s);
  if (!s.found) fail.push("WebGL yokken mühür hiç render edilmedi");
  else {
    if (!s.svgVisible) fail.push("WebGL yokken yedek SVG görünmüyor: " + s.svgW + "x" + s.svgH);
    if (s.opacity !== 1)
      fail.push("WebGL yokken yedek gizli (opacity=" + s.opacity + ", 1 olmali)");
    if (s.canvas && s.canvasW > 0) fail.push("WebGL kapalıyken canvas kurulmuş");
  }
  await p.close();
}

await browser.close();

console.log("\n" + "=".repeat(46));
if (fail.length) {
  console.log("SONUC: " + fail.length + " SORUN");
  fail.forEach((f, i) => console.log("  " + (i + 1) + ". " + f));
  process.exit(1);
}
console.log("SONUC: 3B + yedek davranisi dogru.");
