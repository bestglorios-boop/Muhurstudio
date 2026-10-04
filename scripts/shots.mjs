/**
 * shots.mjs — hedef sayfanın bölüm bölüm ekran görüntülerini alır.
 *
 *   node scripts/shots.mjs [port]
 *
 * Her `.on-paper` bölümünü (kâğıt zeminli) ve hero/footer'ı,
 * kullanıcının gördüğü kırpmasız hâliyle kaydeder.
 */
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";

const PORT = process.argv[2] || "3000";
const BASE = `http://localhost:${PORT}`;
mkdirSync("audit", { recursive: true });

// Önceki çıktıları temizle ki eski bir kare "yeni sonuç" sanılmasın.
for (const f of readdirSync("audit")) {
  if (f.startsWith("sec-") && f.endsWith(".png")) unlinkSync(`audit/${f}`);
}

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

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2000));

// Hero (ilk ekran)
await page.screenshot({ path: "audit/sec-0-hero.png" });

// Her `.on-paper` bölümünü tek tek, bölüm kutusuna göre kırparak al.
const sections = await page.evaluate(() => {
  const els = [...document.querySelectorAll(".on-paper")];
  return els.map((el, i) => {
    const r = el.getBoundingClientRect();
    return { i, top: r.top + scrollY, height: r.height, w: r.width };
  });
});

console.log(`.on-paper bolum sayisi: ${sections.length}`);

for (const s of sections) {
  const y = Math.round(s.top);
  const file = `audit/sec-${s.i + 1}-paper-${y}.png`;
  // Sticky header bölüm tepesini örter; üst kenar çizgisini görmek için
  // 90px yukarı kaydırırız (header yüksekliği ~88px).
  await page.evaluate((yy) => window.scrollTo(0, yy), Math.max(0, y - 90));
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  -> ${file}  (bolum top=${y} h=${Math.round(s.height)})`);
}

// Footer / sayfa sonu
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: "audit/sec-99-footer.png" });

await browser.close();
console.log("bitti");
