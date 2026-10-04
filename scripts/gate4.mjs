/**
 * gate4.mjs — §13: `<br>` içeren görsel başlıklarda ekran okuyucuya giden
 * HESAPLANMIŞ AD (computed accessible name) nedir? Kelimeler birleşiyor mu?
 *
 * textContent `<br>`'ı görmez. Doğru yol: CDP DOM.querySelector ile düğümü
 * bulup Accessibility.getPartialAXTree ile adını almaktır.
 */
import puppeteer from "puppeteer-core";
import { existsSync, appendFileSync } from "node:fs";

const ORIGIN = "http://localhost:3000";
const say = (s) => { appendFileSync("gate4.log", s + String.fromCharCode(10)); console.log(s); };
const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);
const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const cdp = await page.createCDPSession();
await cdp.send("DOM.enable");
await cdp.send("Accessibility.enable");

for (const r of ["/", "/work", "/work/notella", "/about"]) {
  await page.goto(ORIGIN + r, { waitUntil: "load", timeout: 30000 });
  await new Promise((k) => setTimeout(k, 800));

  const brliler = await page.evaluate(() => {
    const list = [...document.querySelectorAll("h1,h2,h3,p,a")].filter((e) => e.querySelector("br"));
    list.forEach((e, i) => e.setAttribute("data-br", String(i)));
    return list.map((e, i) => ({
      i,
      etiket: e.tagName,
      textContent: e.textContent.replace(/\s+/g, " ").trim(),
    }));
  });

  if (!brliler.length) continue;
  const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
  say(`--- ${r} ---`);
  for (const b of brliler) {
    const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector: `[data-br="${b.i}"]` });
    if (!nodeId) continue;
    const { nodes } = await cdp.send("Accessibility.getPartialAXTree", { nodeId, fetchRelatives: false });
    const kendisi = nodes[0];
    const ad = kendisi && kendisi.name ? String(kendisi.name.value) : "(ad yok)";
    const temiz = ad.replace(/\s+/g, " ").trim();
    const birlesik = temiz !== b.textContent;
    say(`  ${b.etiket}  rol=${kendisi && kendisi.role ? kendisi.role.value : "?"}`);
    say(`     DOM textContent  : "${b.textContent}"`);
    say(`     ERISILEBILIR AD  : "${temiz}"`);
    say(`     -> ${birlesik ? "FARKLI (ekran okuyucu farkli okuyor)" : "AYNI (kelimeler dogru ayriliyor)"}`);
    await page.evaluate((i) => document.querySelector(`[data-br="${i}"]`)?.removeAttribute("data-br"), b.i);
  }
}
say("BITTI");
await browser.close();
process.exit(0);
