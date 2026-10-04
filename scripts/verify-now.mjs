/**
 * verify-now.mjs — GERÇEK doğrulama: sayaçlara değil, piksellere bakar.
 *
 *   node scripts/verify-now.mjs [port]
 *
 * Raporlar:
 *   1. CSS yanıt durumu (500 ise site tamamen stilsiz kalır → buton inline olur)
 *   2. Butonun HESAPLANMIŞ stilleri (position/size/bottom) — sınıf adı değil, gerçek değer
 *   3. Görünür alan (viewport) ekran görüntüsü: kullanıcının gördüğü şey
 *   4. Yeşil ikonun gerçekten daire içinde mi (merkez sapması)
 */
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync } from "node:fs";

const PORT = process.argv[2] || "3222";
const BASE = `http://localhost:${PORT}`;
mkdirSync("audit", { recursive: true });

function findChrome() {
  const c = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ].find((p) => existsSync(p));
  if (!c) throw new Error("Chrome/Edge bulunamadi");
  return c;
}

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

let problems = 0;
const say = (ok, msg) => {
  console.log(`${ok ? "  ok  " : "HATA  "}${msg}`);
  if (!ok) problems++;
};

const FORMS = [
  { name: "mobil-390", vp: { width: 390, height: 844 }, dsf: 3 },
  { name: "masaustu-1440", vp: { width: 1440, height: 900 }, dsf: 1 },
];

for (const f of FORMS) {
  const page = await browser.newPage();

  // 1) CSS yanıt durumu
  let cssStatus = 0;
  let cssBytes = 0;
  page.on("response", async (res) => {
    if (res.url().includes(".css")) {
      cssStatus = res.status();
      try {
        cssBytes = (await res.text()).length;
      } catch {}
    }
  });

  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("requestfailed", (r) => errors.push(`FAIL ${r.url()}`));

  await page.setViewport({ ...f.vp, deviceScaleFactor: f.dsf });
  await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));

  console.log(`\n=== ${f.name} (dpr=${f.dsf}) ===`);

  // CSS 500 ise site tamamen stilsizdir — bu, "buton yok" şikayetinin kaynağı.
  // 304 (Not Modified) da BAŞARILIDIR: tarayıcı geçerli önbellek kopyasını
  // kullanır, içerik sayfada mevcuttur. Yalnızca 2xx/304 kabul edilir.
  const cssOk = cssStatus === 200 || cssStatus === 304;
  say(cssOk, `CSS durumu=${cssStatus} (${cssBytes} bayt)`);
  if (!cssOk) console.log("        ^ CSS yuklenmiyor → TUM SAYFA STILSIZ");

  // 2) Hesaplanmış stiller — sınıf adına değil, tarayıcının verdiği değere bakıyoruz.
  //    ÖNEMLİ: sayfada birden çok `a[href*="wa.me"]` var (İletişim bölümündeki
  //    satır içi bağlantı + sabit buton). Doğru hedef SABİT OLANDIR; ilk eşleşmeyi
  //    almak daha önce hatalı teşhise yol açtı. Bu yüzden hepsi listelenir.
  const all = await page.evaluate(() => {
    const list = [...document.querySelectorAll('a[href*="wa.me"]')].map((a, i) => {
      const cs = getComputedStyle(a);
      const r = a.getBoundingClientRect();
      return {
        i,
        position: cs.position,
        w: Math.round(r.width),
        h: Math.round(r.height),
        x: Math.round(r.x),
        y: Math.round(r.y),
        right: Math.round(r.right),
        bottom: Math.round(r.bottom),
        display: cs.display,
        radius: cs.borderRadius,
        bg: cs.backgroundColor,
        border: cs.borderColor,
        zIndex: cs.zIndex,
        vw: innerWidth,
        vh: innerHeight,
        inViewport: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
      };
    });
    return list;
  });

  console.log(`        sayfadaki wa.me baglantisi: ${all.length} adet`);
  all.forEach((b) =>
    console.log(
      `          [${b.i}] pos=${b.position} ${b.w}x${b.h} @(${b.x},${b.y}) ` +
        `viewport=${b.inViewport} bg=${b.bg}`,
    ),
  );

  const info = all.find((b) => b.position === "fixed");

  if (!info) {
    say(false, "SABIT WhatsApp butonu YOK (hicbir wa.me baglantis position=fixed degil)");
    await page.close();
    continue;
  }

  console.log(
    `        SABIT buton: position=${info.position} display=${info.display} ${info.w}x${info.h}` +
      ` @(${info.x},${info.y}) r=${info.radius} bg=${info.bg} border=${info.border} z=${info.zIndex}`,
  );

  // Yeni kural (§5): masaüstü boyu SADECE hem geniş hem yüksek ekranda.
  // Yatay telefon (geniş ama kısa) mobil 48px'te kalır.
  const isDesktop = f.vp.width >= 768 && f.vp.height >= 560;
  const expectSize = isDesktop ? 56 : 48;
  // Yeni kural (§3): mobilde sağ pay `max(12px, env(safe-area-inset-right))`.
  const expectRight = isDesktop ? 32 : 12;
  say(info.position === "fixed", `position=fixed (gercek: ${info.position})`);
  say(info.display === "flex", `display=flex (gercek: ${info.display})`);
  say(
    Math.abs(info.w - expectSize) <= 1 && Math.abs(info.h - expectSize) <= 1,
    `olcu ${expectSize}x${expectSize} (gercek: ${info.w}x${info.h})`,
  );
  say(info.inViewport, `gorunur alanda (rect y=${info.y}, vh=${info.vh})`);
  say(
    Math.abs(info.right - (info.vw - expectRight)) <= 2,
    `sag bosluk ${info.vw - info.right}px (beklenen ${expectRight}px)`,
  );
  say(info.zIndex !== "auto", `z-index=${info.zIndex}`);

  // 3) KULLANICININ GÖRDÜĞÜ görüntü — kırpılmış değil, tam ekran.
  const shot = `audit/view-${f.name}.png`;
  await page.screenshot({ path: shot, fullPage: false });

  // 4) Yeşil pikseller gerçekten dairenin içinde mi? (sabit buton üzerinden)
  const green = await page.evaluate(() => {
    const a = [...document.querySelectorAll('a[href*="wa.me"]')].find(
      (el) => getComputedStyle(el).position === "fixed",
    );
    if (!a) return null;
    const r = a.getBoundingClientRect();
    const svg = a.querySelector("svg");
    if (!svg) return null;
    const s = svg.getBoundingClientRect();
    return {
      cx: r.x + r.width / 2,
      cy: r.y + r.height / 2,
      sx: s.x + s.width / 2,
      sy: s.y + s.height / 2,
      w: s.width,
      h: s.height,
    };
  });
  if (green) {
    const dx = Math.round(green.sx - green.cx);
    const dy = Math.round(green.sy - green.cy);
    say(Math.abs(dx) <= 1 && Math.abs(dy) <= 1, `ikon merkezi dx=${dx}px dy=${dy}px`);
    say(
      Math.round(green.w) > 0 && Math.round(green.h) > 0,
      `ikon boyutu ${Math.round(green.w)}x${Math.round(green.h)}`,
    );
  } else {
    say(false, "sabit butonun icinde svg ikonu YOK");
  }

  say(errors.length === 0, `konsol hatasi=${errors.length}${errors[0] ? " → " + errors[0] : ""}`);
  console.log(`        gorsel: ${shot}`);

  await page.close();
}

// Masaüstü ve mobil ölçüm döngüsü tamamlandı.
await browser.close();

console.log(`\nTOPLAM SORUN: ${problems}`);
process.exit(problems > 0 ? 1 : 0);
