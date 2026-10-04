/**
 * Tarayıcı denetimi: konsol hataları, yatay taşma, dokunma hedefi,
 * erişilebilirlik ve görsel testler.
 *
 * Kullanım: node scripts/audit.mjs [port]
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const PORT = process.argv[2] || "3111";
const BASE = `http://localhost:${PORT}`;
const CHROME =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const VIEWPORTS = [
  { name: "mobil-kucuk", width: 320, height: 640, mobile: true },
  { name: "miphone", width: 390, height: 844, mobile: true },
  { name: "tablet", width: 768, height: 1024, mobile: true },
  { name: "masaustu", width: 1440, height: 900, mobile: false },
  { name: "genis", width: 1920, height: 1080, mobile: false },
];

const PAGES = ["/", "/work", "/work/notella", "/work/bursa-sofrasi", "/about", "/yok"];

mkdirSync("audit", { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});

let problems = 0;
const note = (s) => {
  problems++;
  console.log("  ! " + s);
};

for (const vp of VIEWPORTS) {
  if (vp.name !== "masaustu" && vp.name !== "miphone") {
    // Zaman kazanmak için iki ana genişlikte tam denetim.
    continue;
  }
  console.log(`\n=== ${vp.name} (${vp.width}x${vp.height}) ===`);

  for (const route of PAGES) {
    const page = await browser.newPage();
    await page.setViewport({
      width: vp.width,
      height: vp.height,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
      deviceScaleFactor: 1,
    });

    const errors = [];
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const t = m.text();
      // 404 sayfasının kendi doküman isteği 404 döner; bu beklenen davranıştır.
      if (route === "/yok" && t.includes("404")) return;
      errors.push(t);
    });
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
    page.on("requestfailed", (r) =>
      errors.push(`istek basarisiz: ${r.url()} ${r.failure()?.errorText}`)
    );

    // NOT: `networkidle2` kullanılmaz. Sahnenin sürekli animasyon döngüsü ve
    // canvas çizimi, ağın "boşa düşmesini" engellediği için sayfa hiçbir zaman
    // idle duruma geçmiyor ve timeout oluşuyor.
    const res = await page.goto(BASE + route, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await new Promise((r) => setTimeout(r, 1200));

    const status = res?.status() ?? 0;
    const expected404 = route === "/yok";
    // 304 (Not Modified) geçerli bir yanıttır; hata sayılmaz.
    const ok = status === 200 || status === 304;
    if (!expected404 && !ok) note(`${route} HTTP ${status}`);
    if (expected404 && status !== 404) note(`/yok 404 beklendi, ${status} geldi`);

    // Yatay taşma
    const overflow = await page.evaluate(() => {
      const de = document.documentElement;
      const over = de.scrollWidth - de.clientWidth;
      let worst = null;
      if (over > 1) {
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.width === 0) continue;
          if (r.right > de.clientWidth + 1 || r.left < -1) {
            const tag = el.tagName.toLowerCase();
            const cls = (el.className?.baseVal ?? el.className ?? "")
              .toString()
              .slice(0, 40);
            if (!worst) worst = `${tag}.${cls} right=${Math.round(r.right)}`;
          }
        }
      }
      return { over, worst, sw: de.scrollWidth, cw: de.clientWidth };
    });
    if (overflow.over > 1)
      note(`${route} yatay taşma ${overflow.over}px (${overflow.sw}/${overflow.cw}) -> ${overflow.worst}`);

    // Dokunma hedefleri (yalnızca mobil)
    if (vp.mobile) {
      const small = await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll("a,button")) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.height < 24 || r.width < 24) {
            out.push(
              `${el.tagName.toLowerCase()} "${(el.textContent || "").trim().slice(0, 22)}" ${Math.round(r.width)}x${Math.round(r.height)}`
            );
          }
        }
        return out;
      });
      for (const s of small.slice(0, 5)) note(`${route} kucuk dokunma hedefi: ${s}`);
    }

    // Erişilebilirlik: dil, h1, etiketli bağlantı
    const a11y = await page.evaluate(() => {
      const out = {};
      out.lang = document.documentElement.lang;
      out.h1 = document.querySelectorAll("h1").length;
      out.unnamedLinks = [...document.querySelectorAll("a")].filter(
        (a) => !a.textContent.trim() && !a.getAttribute("aria-label") && !a.querySelector("img[alt]:not([alt=''])")
      ).length;
      out.emptyAlt = [...document.querySelectorAll("img")].filter(
        (i) => i.alt === null || i.getAttribute("alt") === undefined
      ).length;
      out.skip = !!document.querySelector('a[href="#icerik"]');
      return out;
    });
    if (a11y.lang !== "tr") note(`${route} lang="${a11y.lang}" (tr olmali)`);
    if (a11y.h1 !== 1) note(`${route} h1 sayisi ${a11y.h1}`);
    if (a11y.unnamedLinks > 0) note(`${route} isimsiz baglanti: ${a11y.unnamedLinks}`);
    if (a11y.emptyAlt > 0) note(`${route} alt eksik gorsel: ${a11y.emptyAlt}`);
    if (!a11y.skip) note(`${route} atlama baglantisi yok`);

    for (const e of errors.slice(0, 4)) note(`${route} konsol: ${e.slice(0, 140)}`);

    // `fullPage` görüntüsü sayfayı tek seferde yakalar; bu sırada hiçbir
    // kaydırma gerçekleşmediği için whileInView reveal'ları tetiklenmez ve
    // görseller boş görünür. Bu nedenle TÜM genişliklerde önce baştan sona
    // kaydırılır — aksi halde mobil detay sayfalarında içerik açılmamış
    // görünür ve denetim yanlış pozitif üretir.
    await page.evaluate(async () => {
      const step = Math.round(window.innerHeight * 0.7);
      const max = document.body.scrollHeight;
      for (let y = 0; y < max; y += step) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 280));
      }
      window.scrollTo({ top: 0, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 500));
    });

    // Reveal gerçekten açıldı mı? Kırpılmış kalan içerik say.
    const stuck = await page.evaluate(() => {
      let n = 0;
      for (const el of document.querySelectorAll('[style*="clip-path"]')) {
        const cp = getComputedStyle(el).clipPath;
        const m = /inset\(([^)]*)\)/.exec(cp);
        if (!m) continue;
        const parts = m[1].split(/\s+/).map((v) => parseFloat(v) || 0);
        // sağ veya alt kenar %100 -> hâlâ tamamen kapalı
        if (parts[1] >= 99 || parts[2] >= 99) n++;
      }
      return n;
    });
    if (stuck > 0) note(`${route} ${stuck} icerik reveal'a hic acmadi (clip-path kapali)`);

    if (vp.name === "masaustu") {
      await page.screenshot({
        path: `audit/${route === "/" ? "home" : route.replace(/\//g, "_")}.png`,
        fullPage: true,
      });
    }
    if (vp.name === "miphone" && route === "/") {
      await page.screenshot({ path: "audit/home-mobil.png", fullPage: false });
    }

    console.log(`  ${route} → ${status} ✓`);
    await page.close();
  }
}

await browser.close();
console.log(`\nTOPLAM SORUN: ${problems}`);
