/**
 * gate2.mjs — §13 yapısal erişilebilirlik + §10 eksik genişlikler + anchor.
 *   - her rotada: h1 sayısı, başlık sırası atlaması, landmark'lar,
 *     nav aria-label'ları, img alt, dokunma hedefi < 44px, yatay taşma
 *   - /#hizmetler ve /#yaklasim DOĞRUDAN yüklenince doğru yere kaydırıyor mu
 *   - 834px (tablet) ve 2560px (geniş masaüstü)
 */
import puppeteer from "puppeteer-core";
import { existsSync, appendFileSync } from "node:fs";

const ORIGIN = "http://localhost:3000";
const say = (s) => { appendFileSync("gate2.log", s + String.fromCharCode(10)); console.log(s); };
const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);
const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();

const ROTALAR = ["/", "/work", "/work/notella", "/work/bursa-sofrasi", "/about"];
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

for (const r of ROTALAR) {
  await page.goto(ORIGIN + r, { waitUntil: "load", timeout: 30000 });
  await new Promise((k) => setTimeout(k, 1000));
  const y = await page.evaluate(() => {
    const h = [...document.querySelectorAll("h1,h2,h3,h4")];
    const seviye = h.map((e) => Number(e.tagName[1]));
    let atlama = 0;
    for (let i = 1; i < seviye.length; i++) if (seviye[i] - seviye[i - 1] > 1) atlama++;
    const hedefler = [...document.querySelectorAll("a, button")].filter((el) => {
      const b = el.getBoundingClientRect();
      if (b.width < 1 || b.height < 1) return false;
      if (el.closest("#mobil-menu")) return false;
      return true;
    });
    const kucuk = hedefler.filter((el) => {
      const b = el.getBoundingClientRect();
      return b.height < 44 || b.width < 24;
    }).map((el) => (el.textContent || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 26));
    return {
      h1: document.querySelectorAll("h1").length,
      h2: document.querySelectorAll("h2").length,
      atlama,
      header: document.querySelectorAll("header").length,
      main: document.querySelectorAll("main").length,
      footer: document.querySelectorAll("footer").length,
      navlar: [...document.querySelectorAll("nav")].map((n) => n.getAttribute("aria-label") || "(labelsiz)"),
      navLabelsiz: [...document.querySelectorAll("nav")].filter((n) => !n.getAttribute("aria-label")).length,
      altsizImg: [...document.querySelectorAll("img")].filter((i) => i.getAttribute("alt") === null).length,
      linkToplam: document.querySelectorAll("a").length,
      htmlLang: document.documentElement.lang,
      kucukHedef: kucuk,
      yatayTasma: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  say(`${r} -> h1=${y.h1} h2=${y.h2} baslikAtlamasi=${y.atlama} header/main/footer=${y.header}/${y.main}/${y.footer} labelsizNav=${y.navLabelsiz} altsizImg=${y.altsizImg} lang=${y.htmlLang} yatayTasma=${y.yatayTasma}px`);
  say(`   navlar: ${y.navlar.join(" | ")}`);
  if (y.kucukHedef.length) say(`   44px ALTI hedefler(${y.kucukHedef.length}): ${y.kucukHedef.join(", ")}`);
}

/* --- anchor doğrudan yükleme --- */
for (const a of ["/#hizmetler", "/#yaklasim"]) {
  await page.goto(ORIGIN + a, { waitUntil: "load", timeout: 30000 });
  await new Promise((k) => setTimeout(k, 1600));
  const s = await page.evaluate((sec) => {
    const el = document.querySelector(sec);
    if (!el) return { var: false };
    const r = el.getBoundingClientRect();
    const hh = getComputedStyle(document.documentElement).getPropertyValue("--header-h");
    return { var: true, scrollY: Math.round(window.scrollY), ust: Math.round(r.top), headerH: hh.trim(), gizli: r.top < -4 };
  }, a.split("#")[1] ? "#" + a.split("#")[1] : "");
  say(`anchor ${a} -> hedef=${s.var} scrollY=${s.scrollY} hedefUst=${s.ust} header-h=${s.headerH} baslikAltiGizli=${s.gizli}`);
}

/* --- eksik genişlikler --- */
for (const w of [834, 2560]) {
  for (const r of ["/", "/work"]) {
    await page.setViewport({ width: w, height: 1000, deviceScaleFactor: 1 });
    await page.goto(ORIGIN + r, { waitUntil: "load", timeout: 30000 });
    await new Promise((k) => setTimeout(k, 1200));
    const y = await page.evaluate(() => {
      const fab = document.querySelector("a.wa-fab");
      const b = fab ? fab.getBoundingClientRect() : null;
      const kesik = [...document.querySelectorAll("h1,h2,p,a")].filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1).length;
      return {
        tasma: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        disariTasan: kesik,
        fab: b ? Math.round(b.width) + "x" + Math.round(b.height) : "YOK",
        fabGorunur: !!fab && b.width > 0 && b.right <= window.innerWidth + 0.5,
      };
    });
    say(`genislik ${w} ${r} -> yatayTasma=${y.tasma}px ekranDisiOge=${y.disariTasan} fab=${y.fab} gorunur=${y.fabGorunur}`);
  }
}

say("BITTI");
await browser.close();
process.exit(0);
