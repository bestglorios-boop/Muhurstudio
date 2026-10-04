/** Logo <img> öğesinin tarayıcıda GERÇEKTEN yüklenip yüklenmediğini ölçer. */
import puppeteer from "puppeteer-core";

const BASE = `http://localhost:${process.argv[2] || "3222"}`;
const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage();

const failed = [];
page.on("requestfailed", (r) => failed.push(`FAILED ${r.url()} :: ${r.failure()?.errorText}`));
page.on("response", (r) => {
  if (r.status() >= 400) failed.push(`HTTP${r.status()} ${r.url()}`);
});

await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));

const info = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll("img")];
  return imgs.map((i) => ({
    src: (i.currentSrc || i.src || "").slice(0, 120),
    complete: i.complete,
    natural: `${i.naturalWidth}x${i.naturalHeight}`,
    box: (() => { const r = i.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; })(),
    alt: i.getAttribute("alt"),
  }));
});

console.log("IMAGES:", JSON.stringify(info, null, 2));
console.log("NETWORK ISSUES:", failed.length ? failed.join("\n  ") : "yok");

await browser.close();
