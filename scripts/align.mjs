/**
 * align.mjs — §5/§6/§9/§10/§11 hiza OLÇÜMÜ.
 * Tahmin yok: her etiketin ve içeriğinin SOL KENARI ile etiket→içerik
 * DİKEY BOŞLUĞU piksel cinsinden ölçülür. Eşit olmayan satır BOZUK'tur.
 */
import puppeteer from "puppeteer-core";
import { existsSync, appendFileSync } from "node:fs";

const ORIGIN = "http://localhost:3000";
const say = (s) => { appendFileSync("align.log", s + String.fromCharCode(10)); console.log(s); };

const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);
const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();

for (const [ad, w, h] of [["mobil 390", 390, 844], ["masaustu 1440", 1440, 900]]) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));

  const c = await page.evaluate(() => {
    const satir = (dt) => {
      const r = dt.getBoundingClientRect();
      const dd = dt.parentElement.querySelector("dd");
      const dr = dd ? dd.getBoundingClientRect() : null;
      const ik = dt.querySelector("svg, span[aria-hidden] > *, span[aria-hidden]");
      return {
        etiket: (dt.textContent || "").trim(),
        dtSol: Math.round(r.left),
        icSol: dr ? Math.round(dr.left) : null,
        bosluk: dr ? Math.round(dr.top - r.bottom) : null,
        ikonW: ik ? Math.round(ik.getBoundingClientRect().width) : 0,
      };
    };
    const dl = document.querySelector("#iletisim dl");
    const c1 = dl ? [...dl.querySelectorAll(":scope > div > dt")].map(satir) : [];

    const f = document.querySelector("footer");
    const ftr = f ? [...f.querySelectorAll("p.label")].map((p) => {
      const box = p.parentElement;
      const son = box.querySelector("p:not(.label), a");
      const r = p.getBoundingClientRect();
      const sr = son ? son.getBoundingClientRect() : null;
      return {
        etiket: (p.textContent || "").trim(),
        dtSol: Math.round(r.left),
        icSol: sr ? Math.round(sr.left) : null,
        bosluk: sr ? Math.round(sr.top - r.bottom) : null,
      };
    }) : [];
    return { c1, ftr };
  });

  say("--- " + ad + " / #iletisim dl ---");
  const sollar = new Set(c.c1.map((r) => r.dtSol));
  const icler = new Set(c.c1.map((r) => r.icSol));
  const boslar = new Set(c.c1.map((r) => r.bosluk));
  for (const r of c.c1) say(`  ${r.etiket.padEnd(10)} dtSol=${r.dtSol} icSol=${r.icSol} bosluk=${r.bosluk} ikon=${r.ikonW}`);
  say(`  SOL esit=${sollar.size === 1}  IC esit=${icler.size === 1}  BOSLUK esit=${boslar.size === 1}`);
  say("--- " + ad + " / footer ---");
  const fsol = new Set(c.ftr.map((r) => r.dtSol));
  const fic = new Set(c.ftr.map((r) => r.icSol));
  const fbos = new Set(c.ftr.map((r) => r.bosluk));
  for (const r of c.ftr) say(`  ${r.etiket.padEnd(10)} dtSol=${r.dtSol} icSol=${r.icSol} bosluk=${r.bosluk}`);
  say(`  SOL esit=${fsol.size === 1}  IC esit=${fic.size === 1}  BOSLUK esit=${fbos.size === 1}`);
}
say("BITTI");
await browser.close();
process.exit(0);
