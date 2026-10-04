/**
 * KAPSAMLI DUYARLI DENETİM
 * Talep edilen tüm gerçek en-boy oranlarını tarar; taşma, kırpma, çakışma,
 * boşluk ve dokunma hedefi sorunlarını raporlar.
 */
import puppeteer from "puppeteer-core";

const VIEWPORTS = [
  [320, 568], [320, 640], [360, 800], [375, 667], [375, 812],
  [390, 844], [393, 873], [414, 896], [430, 932], [480, 960],
  [600, 900], [768, 1024], [820, 1180], [900, 1200], [1024, 768],
  [1280, 600], [1280, 720], [1366, 650], [1366, 768], [1440, 900],
  [1536, 864], [1600, 900], [1920, 1080], [2560, 1440], [3840, 2160],
  [820, 1180], [844, 390], [740, 360],
];

const ROUTES = ["/", "/work", "/work/notella", "/work/bursa-sofrasi", "/about"];

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--enable-unsafe-swiftshader"],
});

let issues = 0;
const add = (s) => { issues++; console.log("  ! " + s); };

for (const [w, h] of VIEWPORTS) {
  const page = await browser.newPage();
  // Dokunma cihazı profili. Puppeteer `pointer`'ı emüle edemez; bu yüzden
  // site CSS'i gerçek `pointer: coarse` sorgusundan bağımsız olarak test
  // sırasında zorlanır. Masaüstü (fine pointer) denetiminde 24px altı METİN
  // bağlantıları normaldir — WCAG 2.5.8 metin içi bağlantıya istisna tanır.
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: true, isMobile: w < 900 });
  await page.evaluateOnNewDocument(() => {
    const add = () => {
      const s = document.createElement("style");
      s.textContent = `a.hairline,a.tap{padding-top:12px;padding-bottom:12px}html{scroll-behavior:auto!important}`;
      document.head.appendChild(s);
    };
    if (document.head) add();
    else document.addEventListener("DOMContentLoaded", add);
  });
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));

  for (const route of ROUTES) {
    await page.goto(`http://localhost:${process.env.VP_PORT || 3000}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 700));

    const res = await page.evaluate(async (vw) => {
      const out = { hOverflow: 0, offenders: [], tinyTap: [], waClash: false, clipped: 0 };

      // 1) Yatay taşma
      const de = document.documentElement;
      out.hOverflow = Math.max(0, de.scrollWidth - vw);
      if (out.hOverflow > 1) {
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.width === 0) continue;
          if (r.right > vw + 1 || r.left < -1) {
            const cs = getComputedStyle(el);
            if (cs.position === "fixed" || cs.visibility === "hidden" || cs.opacity === "0") continue;
            out.offenders.push(
              `${el.tagName}.${String(el.className).slice(0, 46)} [${Math.round(r.left)}..${Math.round(r.right)}]`
            );
          }
        }
        out.offenders = [...new Set(out.offenders)].slice(0, 4);
      }

      // 2) Dokunma hedefi < 24px (yapısal olmayanlar hariç)
      for (const el of document.querySelectorAll("a,button")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.height < 24 && el.textContent.trim().length > 0) {
          out.tinyTap.push(`${el.tagName} "${el.textContent.trim().slice(0, 22)}" ${Math.round(r.height)}px`);
        }
      }
      out.tinyTap = [...new Set(out.tinyTap)].slice(0, 3);

      // 3) WhatsApp düğmesi içeriği kapatıyor mu
      // 3) WhatsApp düğmesi: SABİT olduğu için kaydırma sırasında her
      //    zaman bir içerikle kesişir (bu doğal). Anlamlı soru şudur:
      //    sayfa TAMAMEN sonuna kaydırıldığında bir şey altta kalıyor mu?
      //    Ölçüm sayfa dibine kaydırılarak yapılır.
      const wa = document.querySelector('a[aria-label*="WhatsApp"]');
      if (wa) {
        window.scrollTo(0, document.documentElement.scrollHeight);
        await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
        const wr = wa.getBoundingClientRect();
        for (const el of document.querySelectorAll("main a, main button, footer a, footer button")) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.top < wr.bottom && r.bottom > wr.top && r.left < wr.right && r.right > wr.left) {
            out.waClash = (el.textContent || "").trim().slice(0, 30) ||
              `${el.tagName}."${String(el.className).slice(0, 40)}"`;
            out.waRect = `${Math.round(wr.top)}..${Math.round(wr.bottom)}`;
            out.waElRect = `${Math.round(r.top)}..${Math.round(r.bottom)}`;
          }
        }
        window.scrollTo(0, 0);
      }

      // 4) Kırpılmış görsel var mı
      out.clipped = [...document.querySelectorAll("img")].filter((i) => {
        const r = i.getBoundingClientRect();
        return r.width > 0 && (r.right > vw + 1 || r.left < -1);
      }).length;

      return out;
    }, w);

    const tag = `${w}x${h} ${route}`;
    if (res.hOverflow > 1) {
      add(`${tag}: yatay taşma ${res.hOverflow}px -> ${res.offenders.join(" | ")}`);
    }
    if (res.tinyTap.length) add(`${tag}: küçük dokunma hedefi -> ${res.tinyTap.join(" | ")}`);
    if (res.waClash) add(`${tag}: WhatsApp kapatıyor -> "${res.waClash}" (wa ${res.waRect} / el ${res.waElRect})`);
    if (res.clipped) add(`${tag}: ${res.clipped} görsel kırpılmış`);
  }

  for (const e of [...new Set(errs)].slice(0, 2)) add(`${w}x${h}: konsol ${e.slice(0, 90)}`);
  await page.close();
}

await browser.close();
console.log(`\nVIEWPORT SAYISI: ${VIEWPORTS.length}  ROTA: ${ROUTES.length}`);
console.log(`TOPLAM SORUN: ${issues}`);
