/**
 * Lighthouse denetimi — GERÇEK ölçüm, tahmin yok.
 *
 * Kullanım:  node scripts/lighthouse-audit.mjs [port|tam-url]
 * Varsayılan: http://localhost:3000
 *
 * DİKKAT: Varsayılan port daha önce 3222'ydi ve o portta HİÇBİR ŞEY
 * dinlemiyordu. Lighthouse sessizce Chrome'un "site'e ulaşılamıyor"
 * interstitial'ini denetliyor ve HER hedef için 0 puan + "ölçü YOK"
 * döndürüyordu — yani denetim çalışmış GÖRÜNÜYORDU. Gerçek port artık
 * 3000 ve port/tam-url ikisi de kabul edilir.
 */
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const arg = process.argv[2];
const BASE = arg
  ? arg.startsWith("http")
    ? arg.replace(/\/$/, "")
    : `http://localhost:${arg}`
  : "http://localhost:3000";

const TARGETS = [
  { label: "Ana sayfa (mobil)", path: "/", form: "mobile" },
  { label: "/work (mobil)", path: "/work", form: "mobile" },
  { label: "/work/notella (mobil)", path: "/work/notella", form: "mobile" },
  { label: "/work/bursa-sofrasi (mobil)", path: "/work/bursa-sofrasi", form: "mobile" },
  { label: "Ana sayfa (masaüstü)", path: "/", form: "desktop" },
];

const METRICS = [
  ["FCP", "first-contentful-paint"],
  ["LCP", "largest-contentful-paint"],
  ["TBT", "total-blocking-time"],
  ["CLS", "cumulative-layout-shift"],
  ["Speed Index", "speed-index"],
  ["TTI", "interactive"],
];

const ms = (n) => `${Math.round(n)} ms`;

async function run(url, form, port) {
  const flags = {
    port,
    output: "json",
    logLevel: "error",
    formFactor: form,
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    screenEmulation:
      form === "mobile"
        ? { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false }
        : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
  };
  const res = await lighthouse(url, flags);
  return res.lhr;
}

// port:0  → rastgele boş port (sabit 9222 çakışması/erişilemezlik yaşatıyor).
// kill() Windows'ta EPERM verebiliyor; bu yüzden yutulur ve süreç normal çıkışla
// kapanır. Chrome zaten kapatılırsa süreç de biter.
//
// `--no-sandbox` TEK BAŞINA yetmiyor: bu makinede Lighthouse'ın açtığı Chrome
// hata sayfası (interstitial) gösteriyor ve her hedef 0 puan/ölçü YOK ile
// dönüyordu. Profil ilk kurulum balonu, ağ arka plan istekleri ve GPU
// başlatma bu bayraksız Windows kurulumunda interstitiale yol açıyor.
const chrome = await chromeLauncher.launch({
  port: 0,
  chromeFlags: [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-proxy-server",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-sync",
    "--metrics-recording-only",
    "--disable-features=Translate,MediaRouter,OptimizationHints,InterestFeedContentSuggestions",
  ],
});

try {
  for (const t of TARGETS) {
    const lhr = await run(BASE + t.path, t.form, chrome.port);
    const c = lhr.categories;
    const scores = [
      `Perf ${Math.round(c.performance.score * 100)}`,
      `A11y ${Math.round(c.accessibility.score * 100)}`,
      `BP ${Math.round(c["best-practices"].score * 100)}`,
      `SEO ${Math.round(c.seo.score * 100)}`,
    ].join(" | ");

    const vals = [];
    for (const [name, id] of METRICS) {
      const a = lhr.audits[id];
      if (!a) continue;
      // Denetim hata verdiğinde `numericValue` YOKTUR (ör. CLS ölçülemedi).
      // Önceden `undefined.toFixed()` çağrısı tüm raporu çökertiyordu.
      if (typeof a.numericValue !== "number") {
        vals.push(`${name} YOK`);
        continue;
      }
      vals.push(
        id === "cumulative-layout-shift"
          ? `${name} ${a.numericValue.toFixed(3)}`
          : `${name} ${ms(a.numericValue)}`,
      );
    }

    console.log(`\n### ${t.label} — ${t.path}`);
    console.log(scores);
    console.log(vals.join(" | "));

    const errs = (lhr.runtimeError && lhr.runtimeError.code) || null;
    if (errs) console.log("RUNTIME_ERROR:", errs);
  }
} finally {
  try {
    await chrome.kill();
  } catch {
    /* Windows EPERM: yoksayılır. */
  }
}
process.exit(0);
