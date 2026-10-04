// scripts/logo-compare.mjs
// Mevcut logo.svg + app/icon.svg dosyalarını PNG'ye çevirip görsel doğrulama için
// diske yazar. Gerçek logo geometrisi gözle karşılaştırılabilsin diye.
import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const files = [
  ["public/icons/logo.svg", "audit/logo-current-256.png", 256],
  ["app/icon.svg", "audit/favicon-current-64.png", 64],
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

const page = await browser.newPage();
await page.setViewport({ width: 300, height: 300, deviceScaleFactor: 1 });

for (const [src, out, size] of files) {
  const svg = readFileSync(src, "utf8");
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await page.setContent(
    `<html><body style="margin:0;background:#080808;width:${size}px;height:${size}px;display:grid;place-items:center">${svg
      .replace(/width="\d+"/, `width="${size}"`)
      .replace(/height="\d+"/, `height="${size}"`)}</body></html>`
  );
  await page.screenshot({ path: out, omitBackground: false });
  console.log("yazildi:", out, `(${size}px)`);
}

await browser.close();
