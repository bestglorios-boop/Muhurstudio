/**
 * final-check.mjs — §1I/§22/§31/§36/§40 davranis denetimi.
 *
 *  A. eksik alt= yok (null alt ile BOSS alt ayristirilir)
 *  B. FAB tiklanir → yeni sekme wa.me acar (gerçek tiklama, sadece href degil)
 *  C. 320x568'de FAB'in CAPSADIĞI köşenin DISINDAN CTA'ya tiklanir → wa.me
 *  D. klavye: Tab odağa goturur, focus-visible halkasi cizilir
 *  E. prefers-reduced-motion: icerik GIZLENMEZ (Reveal animasyonu beklemez)
 *  F. favicon + logo gercek boyut (0x0 ise logo sessizce yok demektir)
 *  G. 3D canvas var ve sifir degil
 */
import puppeteer from "puppeteer-core";
import { existsSync, appendFileSync } from "node:fs";

const ORIGIN = "http://localhost:3000";
const say = (s) => { appendFileSync("final.log", s + String.fromCharCode(10)); console.log(s); };
const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);
const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();

/* A — eksik alt */
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
for (const p of ["/", "/work", "/work/notella", "/work/bursa-sofrasi", "/about"]) {
  await page.goto(ORIGIN + p, { waitUntil: "load", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 700));
  const r = await page.evaluate(() => {
    const hepsi = [...document.querySelectorAll("img")];
    return {
      toplam: hepsi.length,
      nullAlt: hepsi.filter((i) => i.getAttribute("alt") === null).map((i) => (i.currentSrc || i.src || "?").slice(-60)),
      bosAlt: hepsi.filter((i) => i.getAttribute("alt") === "").length,
      dekoratifYayin: hepsi.filter((i) => i.getAttribute("alt") === "" && i.getAttribute("aria-hidden") === null && (i.currentSrc || "").includes("logo")).length,
    };
  });
  say(`alt ${p} -> toplam=${r.toplam} eksik(null)=${r.nullAlt.length}${r.nullAlt.length ? " " + r.nullAlt.join(",") : ""} dekoratif(bos)=${r.bosAlt}`);
}

/* B — FAB gercek tiklama */
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
await new Promise((r) => setTimeout(r, 1200));
const yeniSekme = [];
page.on("popup", async (p) => { try { yeniSekme.push(p.url()); await p.close(); } catch { /* kapali */ } });
await page.tap("a.wa-fab");
await new Promise((r) => setTimeout(r, 1500));
say("FAB tiklama -> acilan sekme: " + (yeniSekme.length ? yeniSekme.join(",") : "YOK (HATA)"));

/* C — 320x568, FAB kapsaminin disindan CTA */
await page.setViewport({ width: 320, height: 568, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
await new Promise((r) => setTimeout(r, 1200));
const nokta = await page.evaluate(() => {
  const fab = document.querySelector("a.wa-fab").getBoundingClientRect();
  const cta = [...document.querySelectorAll("a")].find((a) => (a.textContent || "").trim() === "Proje Başlatalım");
  const c = cta.getBoundingClientRect();
  const x = Math.max(c.left + 8, Math.min(c.right - 8, fab.left - 6));
  const y = Math.max(c.top + 8, Math.min(c.bottom - 8, fab.top - 6));
  return { x: Math.round(x), y: Math.round(y), ctaSol: Math.round(c.left), ctaSag: Math.round(c.right), fabSol: Math.round(fab.left) };
});
say("  CTA tik noktasi: " + JSON.stringify(nokta));
const yeniSekme2 = [];
page.on("popup", async (p) => { try { yeniSekme2.push(p.url()); await p.close(); } catch { /* kapali */ } });
await page.mouse.click(nokta.x, nokta.y);
await new Promise((r) => setTimeout(r, 1500));

/* D — klavye: GERÇEK Tab tuşuyla gezinme + odak halkası */
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
await new Promise((r) => setTimeout(r, 900));
await page.evaluate(() => { document.body.tabIndex = -1; document.body.focus(); });
const sira = [];
let ilkOdak = "";
for (let i = 0; i < 6; i++) {
  await page.keyboard.press("Tab");
  const o = await page.evaluate(() => {
    const a = document.activeElement;
    if (!a || a === document.body) return { ad: "(govde)", outline: "-" };
    const cs = getComputedStyle(a);
    return {
      ad: (a.getAttribute("aria-label") || a.textContent || a.tagName).trim().slice(0, 30),
      outline: `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}`,
    };
  });
  if (i === 0) ilkOdak = o.outline;
  sira.push(o.ad);
}
say("TAB gezinme: " + sira.join(" > "));
say("ilk odak halkasi -> " + ilkOdak);

/* E — reduced-motion: icerik gizlenmemeli */
await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
await new Promise((r) => setTimeout(r, 1500));
const rm = await page.evaluate(() => {
  const gizli = [...document.querySelectorAll("section, h1, h2, p")].filter((el) => {
    const cs = getComputedStyle(el);
    return cs.opacity === "0" || cs.visibility === "hidden" || cs.display === "none";
  });
  const canvas = document.querySelector("canvas");
  return { gizli: gizli.length, canvas: canvas ? Math.round(canvas.width) + "x" + Math.round(canvas.height) : "YOK" };
});
say("reduced-motion -> gizlenmis icerik=" + rm.gizli + " canvas=" + rm.canvas);

/* F — favicon + logo boyutu */
const medya = await page.evaluate(() => {
  const fav = document.querySelector('link[rel~="icon"]');
  const logo = document.querySelector('header img, header svg');
  const logoImg = document.querySelector('header img');
  return {
    favicon: fav ? fav.getAttribute("href") : "YOK",
    logoTip: logo ? logo.tagName : "YOK",
    logoBoyut: logoImg ? logoImg.naturalWidth + "x" + logoImg.naturalHeight : "img-degil/svg",
  };
});
say("favicon=" + medya.favicon + " logo=" + medya.logoTip + " " + medya.logoBoyut);
if (medya.favicon && medya.favicon !== "YOK") {
  const st = await page.evaluate(async (h) => {
    try { const r = await fetch(h); return r.status; } catch { return "HATA"; }
  }, medya.favicon);
  say("favicon durum -> " + st);
}

/* G — 3D */
const u = await page.evaluate(() => {
  const c = document.querySelector("canvas");
  return c ? { w: c.width, h: c.height, cs: getComputedStyle(c).width + "x" + getComputedStyle(c).height } : null;
});
say("3D canvas -> " + (u ? `${u.w}x${u.h} (css ${u.cs})` : "BULUNAMADI"));

say("BITTI");
await browser.close();
process.exit(0);

say("CTA tiklama (FAB disindan) -> acilan sekme: " + (yeniSekme2.length ? yeniSekme2.join(",") : "YOK (HATA)"));
