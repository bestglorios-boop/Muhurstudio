/**
 * cta-tap.mjs — §16/§43: her "Proje Başlatalım" GORUNUR mu ve tiklaninca
 * wa.me aciyor mu? (sadece href degil, GERCEK tiklama)
 *
 * Onceki denemede .find() gizli (sm altindaki) basligi CTA'sini yakalamisti
 * -> kutu 0x0. Burada yalnizca GERCEKTEN CIZILMIS (getClientRects>0) olan
 * baglantilar alinir.
 *
 * 320x568'de FAB'in kapsadiğı köşenin DISINDAN tiklanir: CTA kullanilabilir
 * mi (§20 CTA carpismasi) sorusu burada cevaplanir.
 */
import puppeteer from "puppeteer-core";
import { existsSync, appendFileSync } from "node:fs";

const ORIGIN = "http://localhost:3000";
const say = (s) => { appendFileSync("cta.log", s + String.fromCharCode(10)); console.log(s); };
const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);
const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();

let acilan = [];
page.on("popup", async (p) => { try { acilan.push(p.url()); await p.close(); } catch { /* yoksay */ } });

for (const [ad, w, h] of [["mobil 390", 390, 844], ["dar 320x568", 320, 568], ["masaustu 1440", 1440, 900]]) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 768, hasTouch: w < 768 });
  await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));

  const ctalar = await page.evaluate(() =>
    [...document.querySelectorAll("a")]
      .filter((a) => (a.textContent || "").trim() === "Proje Başlatalım")
      .map((a) => {
        const r = a.getBoundingClientRect();
        return {
          href: a.getAttribute("href"),
          gorunur: a.getClientRects().length > 0 && r.width > 0,
          kutu: Math.round(r.left) + "," + Math.round(r.top) + " " + Math.round(r.width) + "x" + Math.round(r.height),
        };
      })
  );
  say(`${ad}: CTA sayisi=${ctalar.length} gorunur=${ctalar.filter((c) => c.gorunur).length}`);
  for (const c of ctalar) say(`   href=${c.href} gorunur=${c.gorunur} kutu=${c.kutu}`);

  /* gorunur CTA'nin merkezine (FAB ile kesismiyorsa) veya kesisimin disina tikla */
  const hedef = await page.evaluate(() => {
    const fab = document.querySelector("a.wa-fab").getBoundingClientRect();
    const cta = [...document.querySelectorAll("a")].find((a) => (a.textContent || "").trim() === "Proje Başlatalım" && a.getClientRects().length > 0);
    const c = cta.getBoundingClientRect();
    /* tercih: orta; kesisim varsa kesisimin soluna */
    let x = c.left + c.width / 2;
    let y = c.top + c.height / 2;
    const kesisiyor = Math.max(0, Math.min(fab.right, c.right) - Math.max(fab.left, c.left)) > 0 &&
                      Math.max(0, Math.min(fab.bottom, c.bottom) - Math.max(fab.top, c.top)) > 0;
    if (kesisiyor) {
      x = Math.max(c.left + 10, Math.min(c.right - 10, fab.left - 10));
      y = Math.max(c.top + 10, Math.min(c.bottom - 10, fab.top - 10));
    }
    return { x: Math.round(x), y: Math.round(y), kesisiyor };
  });
  acilan = [];
  await page.mouse.click(hedef.x, hedef.y);
  await new Promise((r) => setTimeout(r, 1600));
  const ok = acilan.some((u) => /wa\.me|api\.whatsapp\.com/.test(u));
  say(`   tik (${hedef.x},${hedef.y}) carpisan=${hedef.kesisiyor} -> ${acilan.length ? acilan.join(",") : "SEKME YOK"} ${ok ? "OK" : "HATA"}`);
}
say("BITTI");
await browser.close();
process.exit(0);
