/**
 * wa-rootcause.mjs — mobil WhatsApp GÖRÜNMEZLİĞİNİN GERÇEK NEDENİNİ arar.
 *
 *   node scripts/wa-rootcause.mjs [port]
 *
 * Sayaçlara güvenmez. Her genişlikte şunları ÖLÇER:
 *   - buton dikdörtgeni gerçekten viewport içinde mi (taşma/kırpma)
 *   - butonun MERKEZİNDE üstte hangi eleman var (elementFromPoint)
 *   - butonu kapsayan atalar arasında transform/filter/contain var mı
 *     (bunlar `position: fixed` için containing block oluşturur → kırpma)
 *   - zinkir: butonu öreren elemanın z-index'i
 *   - butonun arkasındaki GERÇEK piksel rengi → kontrast
 */
import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";

const PORT = process.argv[2] || "3000";
const BASE = `http://localhost:${PORT}`;

const WIDTHS = [
  // dar telefonlar (dikey)
  { w: 320, h: 568, label: "iPhone SE 1" },
  { w: 360, h: 800, label: "Galaxy" },
  { w: 375, h: 667, label: "iPhone 8" },
  { w: 390, h: 844, label: "iPhone 14" },
  { w: 414, h: 896, label: "iPhone XR" },
  { w: 430, h: 932, label: "iPhone 15 Max" },
  // YATAY — çentikli cihazlarda safe-area-inset-RIGHT burada buyur.
  { w: 568, h: 320, label: "SE yatay" },
  { w: 659, h: 393, label: "iPhone 15P yatay" },
  { w: 844, h: 390, label: "iPhone 14 yatay" },
  { w: 932, h: 430, label: "15 Max yatay" },
  { w: 480, h: 800, label: "genis mobil" },
  { w: 600, h: 900, label: "kucuk tablet" },
  { w: 768, h: 1024, label: "tablet" },
  { w: 1024, h: 768, label: "tablet yatay" },
  { w: 1440, h: 900, label: "masaustu" },
];

function findChrome() {
  const c = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ].find((p) => existsSync(p));
  if (!c) throw new Error("Chrome/Edge bulunamadi");
  return c;
}

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

console.log(
  "VIEWPORT      | olcu     rect                          zemin        kontrast  durum",
);
console.log(
  "--------------+---------+-----------------------------+------------+---------+----------------",
);

for (const { w, h, label } of WIDTHS) {
  const page = await browser.newPage();
  await page.setViewport({
    width: w,
    height: h,
    deviceScaleFactor: 2,
    isMobile: w < 768,
    hasTouch: w < 1024,
  });
  await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 900));

  const r = await page.evaluate(() => {
    const a = [...document.querySelectorAll("a[href*='wa.me']")].find(
      (el) => getComputedStyle(el).position === "fixed",
    );
    if (!a) return { missing: true };

    const rect = a.getBoundingClientRect();
    const cs = getComputedStyle(a);

    // Butonun merkezinde üstte ne var? (kendi <svg> çocuğu "üstte" sayılmaz)
    const hit = document.elementFromPoint(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
    );
    const covered = !!hit && hit !== a && !a.contains(hit);
    const hitDesc = !hit
      ? "YOK"
      : hit === a || a.contains(hit)
        ? "BUTONUN KENDISI"
        : `${hit.tagName.toLowerCase()}${hit.id ? "#" + hit.id : ""}` +
          (hit.className && typeof hit.className === "string"
            ? "." + hit.className.split(" ").slice(0, 3).join(".")
            : "");

    // Butonun DIŞINI kapsayan zemin rengi (en yakın gövde/bölüm).
    const outer = document.elementFromPoint(
      Math.min(innerWidth - 1, rect.right + 6),
      rect.y + rect.height / 2,
    );
    let behind = "rgba(0, 0, 0, 0)";
    let node = outer;
    while (node) {
      const bg = getComputedStyle(node).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        behind = bg;
        break;
      }
      node = node.parentElement;
    }

    const lum = (rgb) => {
      const m = rgb.match(/\d+(\.\d+)?/g);
      if (!m) return 0;
      const [r, g, b] = m.slice(0, 3).map(Number);
      const f = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const l1 = lum(cs.backgroundColor);
    const l2 = lum(behind);
    const contrast =
      (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    // fixed için containing block olusturan atalari bul
    const traps = [];
    let el = a.parentElement;
    while (el && el !== document.documentElement) {
      const s = getComputedStyle(el);
      const why = [];
      if (s.transform !== "none") why.push("transform=" + s.transform);
      if (s.filter !== "none") why.push("filter");
      if (s.perspective !== "none") why.push("perspective");
      if (s.backdropFilter && s.backdropFilter !== "none") why.push("backdrop-filter");
      if (s.willChange && s.willChange !== "auto") willChange(s, why);
      if (s.contain && s.contain !== "none") why.push("contain=" + s.contain);
      if (["hidden", "scroll", "auto"].includes(s.overflowX)) why.push("overflow-x=" + s.overflowX);
      if (why.length) {
        traps.push(
          `${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : ""}: ${why.join(",")}`,
        );
      }
      el = el.parentElement;
    }
    function willChange(s, why) {
      if (/transform|filter|perspective/.test(s.willChange)) why.push("will-change=" + s.willChange);
    }

    // Görünür alan disinda mi / kirpiliyor mu?
    const vw = innerWidth;
    const vh = innerHeight;
    const issues = [];
    if (rect.width === 0 || rect.height === 0) issues.push("SIFIR BOYUT");
    if (rect.right > vw + 0.5) issues.push(`SAGDAN TASMA +${Math.round(rect.right - vw)}px`);
    if (rect.left < -0.5) issues.push(`SOLDAN TASMA ${Math.round(rect.left)}px`);
    if (rect.bottom > vh + 0.5) issues.push(`ALTDAN TASMA +${Math.round(rect.bottom - vh)}px`);
    if (rect.top < -0.5) issues.push(`USTTEN TASMA ${Math.round(rect.top)}px`);
    if (cs.visibility === "hidden") issues.push("visibility:hidden");
    if (cs.display === "none") issues.push("display:none");
    if (Number(cs.opacity) === 0) issues.push("opacity:0");
    if (cs.pointerEvents === "none") issues.push("pointer-events:none");
    if (hit && covered) issues.push("USTUNDE BASKA ELEMAN VAR");
    if (traps.length) issues.push("FIXED TUZAGI");
    // Kontrast: koyu zeminde #141414 gövde neredeyse görünmez.
    const contrastBad = contrast < 1.8;

    return {
      position: cs.position,
      size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
      rect: `x=${Math.round(rect.left)},y=${Math.round(rect.top)},r=${Math.round(rect.right)},b=${Math.round(rect.bottom)}`,
      hitDesc,
      traps,
      issues,
      behind,
      fill: cs.backgroundColor,
      contrast: contrast.toFixed(2),
      contrastBad,
      safeBottom: cs.bottom,
      safeRight: cs.right,
      z: cs.zIndex,
    };
  });

  if (r.missing) {
    console.log(`${`${w}x${h}`.padEnd(14)} | SABIT BUTON YOK`);
    await page.close();
    continue;
  }

  const badge = r.issues.length
    ? "SORUN: " + r.issues.join(" | ")
    : "temiz";
  const kon = `${r.contrast}:1${r.contrastBad ? " DUSUK" : ""}`;
  console.log(
    `${`${w}x${h}`.padEnd(14)} | ${r.size.padEnd(9)} ${r.rect.padEnd(29)} ${r.fill
      .replace(/[^0-9,]/g, "")
      .slice(0, 11)
      .padEnd(12)} ${kon.padEnd(9)} ${badge}  [${label}]`,
  );
  if (r.traps.length) console.log(`         tuzaklar: ${r.traps.join(" ; ")}`);

  await page.close();
}

await browser.close();
