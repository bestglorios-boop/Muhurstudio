/**
 * qa-loading.mjs — rota geçişi yükleme ekranının GERÇEKTEN göründüğünü doğrular.
 *   node scripts/qa-loading.mjs [port]
 *
 * Yöntem: belge istekleri kasıtlı olarak geciktirilir, böylece Next.js'in
 * segment geçişinde `app/loading.tsx` devreye girer. Yükleme ekranı
 * DOM'da görünür mü, yoksa boş bir an mı geçiyor — ölçülür.
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
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const p = await browser.newPage();
await p.setViewport({ width: 1280, height: 900 });

// İki yavaşlatma birlikte: CPU ve ağ. loading.tsx'in var olma nedeni
// tam olarak budur — yavaş cihaz / yavaş bağlantı. Sadece belge isteğini
// geciktirmek YETMEZ: istemci tarafı geçişte belge isteği hiç olmaz.
const cdp = await p.createCDPSession();
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 20 });
await cdp.send("Network.enable");
await cdp.send("Network.emulateNetworkConditions", {
  offline: false,
  latency: 400,
  downloadThroughput: (300 * 1024) / 8,
  uploadThroughput: (300 * 1024) / 8,
});

let sawLoader = false;
let loaderInfo = null;
const t0 = Date.now();

// SoĞUK YÜKLEME: doğrudan rotaya git. Yükleme ekranı ilk boyamada görünür.
const nav = p
  .goto(ORIGIN + "/gizlilik", { waitUntil: "domcontentloaded", timeout: 60000 })
  .catch(() => {});

while (Date.now() - t0 < 45000) {
  const s = await p
    .evaluate(() => {
      const el = document.querySelector(".seal-loader");
      if (!el) return null;
      const root = el.closest("div[class]") || el.parentElement;
      const r = root.getBoundingClientRect();
      const ring = el.getBoundingClientRect();
      return {
        cls: (root.className || "").toString().slice(0, 60),
        w: Math.round(r.width),
        h: Math.round(r.height),
        ringW: Math.round(ring.width),
        anim: getComputedStyle(el).animationName,
        svg: !!root.querySelector("svg"),
        text: (root.textContent || "").trim().replace(/\s+/g, " ").slice(0, 30),
      };
    })
    .catch(() => null);
  if (s) {
    sawLoader = true;
    loaderInfo = s;
    // İLK KARE YETERSİZ: yükleme ekranı CSS uygulanmadan önce boyanabilir
    // (20x CPU yavaşlatmada stil dosyası henüz işlenmemiş olur). Bu yüzden
    // görüldükten sonra kısa bekleyip ÖLÇÜMÜ YENİLE.
    await new Promise((r) => setTimeout(r, 700));
    loaderInfo = await p
      .evaluate(() => {
        const el = document.querySelector(".seal-loader");
        if (!el) return null;
        const root = el.closest("div[class]") || el.parentElement;
        const r = root.getBoundingClientRect();
        const ring = el.getBoundingClientRect();
        return {
          cls: (root.className || "").toString().slice(0, 60),
          w: Math.round(r.width),
          h: Math.round(r.height),
          ringW: Math.round(ring.width),
          anim: getComputedStyle(el).animationName,
          dur: getComputedStyle(el).animationDuration,
          svg: !!root.querySelector("svg"),
          text: (root.textContent || "").trim().replace(/\s+/g, " ").slice(0, 30),
        };
      })
      .catch(() => loaderInfo);
    break;
  }
  if (Date.now() - t0 > 8000 && !sawLoader) break;
  await new Promise((r) => setTimeout(r, 40));
}

await nav;
await p.waitForSelector(".seal-loader", { hidden: true, timeout: 30000 }).catch(() => {});
const after = await p.evaluate(() => location.pathname).catch(() => "(bilinmiyor)");
const h1 = await p
  .evaluate(() => {
    const e = document.querySelector("h1");
    return e ? e.textContent.trim() : "";
  })
  .catch(() => "");

await p.close();
await browser.close();

console.log("bitis rota     : " + after);
console.log("sayfa h1       : " + h1);
console.log("yukleme ekrani : " + (sawLoader ? "GORULDU" : "gorulmedi"));
if (loaderInfo) console.log("  ayrinti      : " + JSON.stringify(loaderInfo));

const fail = [];
if (!sawLoader) fail.push("yavas baglantida yukleme ekrani hic gorunmedi");
if (after !== "/gizlilik") fail.push("gecis tamamlanmadi, rota = " + after);
if (!h1) fail.push("hedef sayfa icerigi yuklenmedi");

console.log("\n" + "=".repeat(46));
if (fail.length) {
  console.log("SONUC: " + fail.length + " SORUN");
  fail.forEach((f, i) => console.log("  " + (i + 1) + ". " + f));
  process.exit(1);
}
console.log("SONUC: yukleme ekrani yavas baglantida gorunuyor.");
