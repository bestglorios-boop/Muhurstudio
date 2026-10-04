/**
 * GERÇEK PİKSEL ÖLÇÜM — yeşil glyph'in boyut kutusu, siyah daireye göre.
 *
 * Neden piksel: CSS `translate`/`transform` tarayıcıdan tarayıcıya farklı
 * uygulanabiliyor; getComputedStyle uygulanmış sonucu vermeyebiliyor. Ekran
 * görüntüsündeki GERÇEK yeşil pikselleri saymak tek doğru cevaptır:
 * "ikon gerçekte dairenin merkezinde mi?"
 */
import puppeteer from "puppeteer-core";
import { writeFileSync } from "node:fs";

const PORT = process.argv[2] || "3222";
const BASE = `http://localhost:${PORT}`;

const CASES = [
  { w: 390, h: 844, tag: "mobil-390" },
  { w: 1440, h: 900, tag: "masaustu-1440" },
];

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});

for (const c of CASES) {
  const page = await browser.newPage();
  await page.setViewport({ width: c.w, height: c.h, deviceScaleFactor: 1 });
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));

  const box = await page.evaluate(() => {
    const r = document.querySelector('a[aria-label*="WhatsApp"]').getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });

  // Daireyi 6px fazla payla kırp (1px kenarlık dahil).
  const clip = {
    x: Math.max(0, Math.floor(box.x - 6)),
    y: Math.max(0, Math.floor(box.y - 6)),
    width: Math.ceil(box.w + 12),
    height: Math.ceil(box.h + 12),
  };

  const shot = await page.screenshot({ clip, encoding: "base64" });
  writeFileSync(`audit/wa-center-${c.tag}.png`, Buffer.from(shot, "base64"));

  const stats = await page.evaluate(
    async (b64, clipBox) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();
      const cv = document.createElement("canvas");
      cv.width = img.width;
      cv.height = img.height;
      const ctx = cv.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data;

      let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1, n = 0;
      for (let y = 0; y < cv.height; y++) {
        for (let x = 0; x < cv.width; x++) {
          const i = (y * cv.width + x) * 4;
          const r = d[i], g = d[i + 1], b = d[i + 2];
          if (g > 110 && g > r + 55 && g > b + 25) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            n++;
          }
        }
      }
      if (!n) return { px: 0 };

      const gx0 = clipBox.x + minX, gx1 = clipBox.x + maxX;
      const gy0 = clipBox.y + minY, gy1 = clipBox.y + maxY;
      return {
        px: n,
        glyphW: +(gx1 - gx0 + 1).toFixed(1),
        glyphH: +(gy1 - gy0 + 1).toFixed(1),
        glyphCenter: { x: +((gx0 + gx1 + 1) / 2).toFixed(2), y: +((gy0 + gy1 + 1) / 2).toFixed(2) },
        circleCenter: { x: +(clipBox.x + clipBox.width / 2).toFixed(2), y: +(clipBox.y + clipBox.height / 2).toFixed(2) },
      };
    },
    shot,
    clip
  );

  if (!stats.px) {
    console.log(`### ${c.tag}: YESIL PIKSEL BULUNAMADI`);
  } else {
    const dx = +(stats.glyphCenter.x - stats.circleCenter.x).toFixed(2);
    const dy = +(stats.glyphCenter.y - stats.circleCenter.y).toFixed(2);
    const ok = Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
    console.log(`### ${c.tag}`);
    console.log(`  glyph : ${stats.glyphW}x${stats.glyphH}px  merkez ${JSON.stringify(stats.glyphCenter)}`);
    console.log(`  daire : merkez ${JSON.stringify(stats.circleCenter)}`);
    console.log(`  kayma : dx=${dx}px dy=${dy}px -> ${ok ? "ORTALANMIS" : "KAYIK"}`);
  }
  await page.close();
}

await browser.close();
