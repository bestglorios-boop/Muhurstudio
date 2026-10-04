/**
 * GÖRSEL DOĞRULAMA — WhatsApp düğmesi + logo, gerçek render.
 * Kırpmasız ekran görüntüsü alır ve düğmenin içeriği kapatıp kapatmadığını
 * ölçer. Konsol/hata günlüğü de toplanır.
 */
import puppeteer from "puppeteer-core";

const PORT = process.argv[2] || "3222";
const BASE = `http://localhost:${PORT}`;
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const CASES = [
  { w: 390, h: 844, tag: "mobil-390" },
  { w: 1440, h: 900, tag: "masaustu-1440" },
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--enable-unsafe-swiftshader"],
});

let problems = 0;

for (const c of CASES) {
  const page = await browser.newPage();
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push("pageerror: " + e.message));

  await page.setViewport({ width: c.w, height: c.h, deviceScaleFactor: 1 });
  // networkidle2 3D döngüsü yüzünden güvenilmez; domcontentloaded + sabit bekleme.
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2500));

  // 1) Düğmenin gerçek ölçüsü + şekli
  const btn = await page.evaluate(() => {
    const a = document.querySelector('a[aria-label*="WhatsApp"]');
    if (!a) return null;
    const r = a.getBoundingClientRect();
    const cs = getComputedStyle(a);
    const svg = a.querySelector("svg").getBoundingClientRect();
    return {
      w: Math.round(r.width), h: Math.round(r.height),
      radius: cs.borderRadius,
      bottomGap: Math.round(window.innerHeight - r.bottom),
      svg: Math.round(svg.width),
      label: a.getAttribute("aria-label"),
      href: a.getAttribute("href"),
    };
  });

  // 2) Düğme CTA / link'lerin ÜSTÜNE biniyor mu (gerçek dikdörtgen çakışma)
  const clash = await page.evaluate(() => {
    const a = document.querySelector('a[aria-label*="WhatsApp"]');
    const r = a.getBoundingClientRect();
    const hit = [];
    document.querySelectorAll("a,button").forEach((el) => {
      if (el === a) return;
      const q = el.getBoundingClientRect();
      if (q.width === 0 || q.height === 0) return;
      const ox = Math.max(0, Math.min(r.right, q.right) - Math.max(r.left, q.left));
      const oy = Math.max(0, Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top));
      if (ox > 0 && oy > 0) {
        hit.push(`${el.tagName}"${(el.textContent || "").trim().slice(0, 26)}" ${Math.round(ox)}x${Math.round(oy)}px`);
      }
    });
    return hit;
  });

  // 3) Yatay taşma
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );

  console.log(`\n### ${c.tag} (${c.w}x${c.h})`);
  console.log("  dugme:", JSON.stringify(btn));
  console.log("  cakisma:", clash.length ? clash.join(" | ") : "yok");
  console.log("  yatay tasma:", overflow, "px");
  console.log("  konsol hatasi:", errs.length ? errs.slice(0, 3).join(" | ") : "yok");

  if (errs.length || clash.length || overflow > 0 || !btn) problems++;

  await page.screenshot({ path: `audit/wa-${c.tag}.png` });
  await page.close();
}

console.log(`\nTOPLAM SORUN: ${problems}`);
await browser.close();
