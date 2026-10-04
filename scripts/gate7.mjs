/**
 * gate7.mjs — §17: masaüstü ana sayfa TBT'si 2.1 sn GERÇEK Mİ, yoksa
 * paylaşılan tarayıcıdan mı geliyor?
 *
 * lighthouse-audit.mjs beş hedefi TEK Chrome örneğinde ve sırayla koşar;
 * masaüstü EN SON gelir. Önceki sayfalar kapanmadan kalıyorsa, animasyon
 * döngüleri CPU'yu doldurur ve son hedefin görevleri uzar.
 *
 * Burada YALNIZCA masaüstü ana sayfa, TEMİZ bir tarayıcıda ölçülür.
 * Kullanım: node scripts/gate7.mjs
 */
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const URL_ = "http://localhost:3000/";
const chrome = await chromeLauncher.launch({
  port: 0,
  chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
});

try {
  const res = await lighthouse(URL_, {
    port: chrome.port,
    output: "json",
    logLevel: "error",
    formFactor: "desktop",
    onlyCategories: ["performance"],
    screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
  });
  const l = res.lhr;
  const a = l.audits;
  console.log("=== MASAUSTU / (TEMIZ TARAYICI) ===");
  console.log(`Perf ${Math.round(l.categories.performance.score * 100)}`);
  for (const k of ["first-contentful-paint", "largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index", "interactive"]) {
    console.log(`  ${k}: ${a[k].displayValue}`);
  }
  console.log("--- TBT'ye katki yapan en uzun gorevler ---");
  const d = a["long-tasks"]?.details?.items || [];
  d.slice(0, 8).forEach((t) => console.log(`  ${Math.round(t.duration)}ms  ${t.url ? t.url.replace("http://localhost:3000", "").slice(0, 70) : "(bilinmiyor)"}`));
  console.log("--- ana is parcacigi isi (bootup) ---");
  (a["bootup-time"]?.details?.items || []).slice(0, 6).forEach((b) => console.log(`  ${Math.round(b.total)}ms  ${String(b.url).replace("http://localhost:3000", "").slice(0, 70)}`));
} finally {
  try { await chrome.kill(); } catch { }
}
process.exit(0);
