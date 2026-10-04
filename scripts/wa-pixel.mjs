import puppeteer from "puppeteer-core";
import { existsSync, appendFileSync } from "node:fs";
import zlib from "node:zlib";

const ORIGIN = "http://localhost:3000";
const MODE = (process.argv.find((a) => a.startsWith("--fix=")) || "--fix=none").split("=")[1];
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "--only=all").split("=")[1];
const SELFTEST = process.argv.includes("--selftest");
const OUT = SELFTEST ? "wa-selftest.log" : "wa-out.log";
const NL = String.fromCharCode(10);
const say = (s) => appendFileSync(OUT, s + NL);
say("=== kosu " + new Date().toISOString() + " MODE=" + MODE + " ONLY=" + ONLY + " ===");

/* ---------- 8-bit non-interlaced PNG -> ham piksel ---------- */
function decodePNG(buf) {
  let off = 8, w = 0, h = 0, bd = 8, ct = 6;
  const idat = [];
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    if (type === "IHDR") {
      w = buf.readUInt32BE(off + 8); h = buf.readUInt32BE(off + 12);
      bd = buf[off + 16]; ct = buf[off + 17];
    } else if (type === "IDAT") idat.push(buf.subarray(off + 8, off + 8 + len));
    else if (type === "IEND") break;
    off += 12 + len;
  }
  const channels = ct === 6 ? 4 : ct === 2 ? 3 : ct === 0 ? 1 : ct === 4 ? 2 : 0;
  if (!channels) throw new Error("PNG colorType " + ct + " desteklenmiyor");
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = Math.max(1, Math.round((channels * bd) / 8));
  const stride = Math.ceil((w * channels * bd) / 8);
  const out = Buffer.alloc(h * stride);
  let pos = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[pos++];
    const line = raw.subarray(pos, pos + stride);
    pos += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (filter === 1) v = (v + a) & 255;
      else if (filter === 2) v = (v + b) & 255;
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 255;
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      } else if (filter !== 0) throw new Error("bilinmeyen filter " + filter);
      cur[x] = v;
    }
  }
  return { w, h, channels, stride, data: out };
}
const px = (im, x, y) => {
  const i = y * im.stride + x * im.channels;
  return [im.data[i], im.data[i + 1], im.data[i + 2]];
};
const lum = ([r, g, b]) => {
  const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const l1 = Math.max(lum(a), lum(b)), l2 = Math.min(lum(a), lum(b));
  return (l1 + 0.05) / (l2 + 0.05);
};

/* ---------- DevTools Device Mode'un gerçek profilleri ---------- */
const DEV = [
  ["iPhone SE", 375, 667, 2],
  ["iPhone 12/13", 390, 844, 3],
  ["iPhone 14 Pro", 393, 852, 3],
  ["iPhone 15/16", 393, 852, 3],
  ["iPhone 15 Pro Max", 430, 932, 3],
  ["Pixel 7/8", 412, 915, 2.6],
  ["Galaxy S8+", 360, 740, 3],
  ["Galaxy S9+", 320, 653, 3],
];
const WIDTHS = [320, 360, 375, 390, 414, 430].map((w) => ["genislik " + w, w, 800, 2]);
const LAND = [
  ["SE yatay", 667, 375, 2],
  ["14 Pro yatay", 852, 393, 3],
  ["Pixel yatay", 915, 412, 2.6],
  ["430 yatay", 932, 430, 3],
];
const MATRIX = ONLY === "dev" ? DEV : ONLY === "width" ? WIDTHS : ONLY === "land" ? LAND : [...DEV, ...WIDTHS, ...LAND];

const OVERRIDES = {
  none: "",
  overflow: "body{overflow-x:visible!important;overflow-y:visible!important}",
  hidden: "body{overflow-x:hidden!important;overflow-y:visible!important}",
};

const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);
const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();
page.setDefaultTimeout(30000);

let bad = 0;
let total = 0;

for (const [name, w, h, dpr] of MATRIX) {
  for (const sf of [0, 0.5, 1]) {
    const tag = (name + " @" + sf).padEnd(22);
    try {
      await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
      await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
      if (OVERRIDES[MODE]) {
        await page.addStyleTag({ content: OVERRIDES[MODE] });
        await new Promise((r) => setTimeout(r, 150));
      }
      await new Promise((r) => setTimeout(r, 1200));
      const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
      if (sf > 0) {
        await page.evaluate((y) => window.scrollTo(0, y), Math.round(maxScroll * sf));
        await new Promise((r) => setTimeout(r, 350));
      }

      const info = await page.evaluate(() => {
        const links = [...document.querySelectorAll("a")].filter((e) => /wa\.me/.test(e.href));
        const a = links.find((e) => getComputedStyle(e).position === "fixed");
        if (!a) return { yok: true, n: links.length };
        const r = a.getBoundingClientRect();
        const cs = getComputedStyle(a);
        return {
          x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height,
          vw: innerWidth, vh: innerHeight,
          zIndex: cs.zIndex, opacity: cs.opacity, visibility: cs.visibility, display: cs.display,
          transform: cs.transform, clipPath: cs.clipPath, pointerEvents: cs.pointerEvents,
          parent: a.parentElement ? a.parentElement.tagName : "?",
          bodyOv: getComputedStyle(document.body).overflowX + "/" + getComputedStyle(document.body).overflowY,
          hit: (() => {
            const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            if (!el) return "NULL";
            // FAB kendisi VEYA onun İÇÖĞESİ (svg/path) => tıklanabilir.
            if (el === a || a.contains(el)) return "FAB:" + el.tagName;
            return el.tagName + "." + String(el.className).slice(0, 18);
          })(),
        };
      });

      if (info.yok) {
        bad++; total++;
        say("  BOZUK " + tag + " FAB DOM'DA YOK (a[wa.me]=" + info.n + ")");
        continue;
      }

      /*
       * NEGATİF KONTROL (--selftest).
       * Eşiği gevşetirken en büyük risk: testin artık HİÇBİR şeyi
       * yakalayamaması. Bu modda düğme bilinçli olarak SİLİNİR
       * (gövde = zemin, kenar yok, glif yok) ve ölçümden hemen önce
       * uygulanır. Doğru sonuç: hâlâ BOZUK çıkması.
       */
      if (SELFTEST) {
        await page.addStyleTag({
          content: ".wa-fab,.wa-fab *{background:transparent!important;border-color:transparent!important;color:transparent!important;box-shadow:none!important;}",
        });
        await new Promise((r) => setTimeout(r, 150));
      }

      const im = decodePNG(await page.screenshot({ type: "png" }));
      const d = (v) => Math.round(v * dpr);
      const x0 = Math.max(0, d(info.x));
      const y0 = Math.max(0, d(info.y));
      const x1 = Math.min(im.w - 1, d(info.right));
      const y1 = Math.min(im.h - 1, d(info.bottom));

      /* Zemin örneği: denetimin hemen sağ-altındaki piksel (sayfanın kendisi). */
      const bg = px(im, Math.min(im.w - 1, x1 + 4), Math.min(im.h - 1, y1 + 4));

      /*
       * PALETTEN BAĞIMSIZ ALGI ÖLÇÜMÜ.
       * Eskiden "yeşil piksel say" diye bakılıyordu; rengi bilinçli
       * değiştirdiğimiz anda bu anlamsızlaşırdı. Gerçek soru renk değil:
       * "kutu içindeki kaç piksel zeminden AYRIŞIYOR". Renk adı bilmeye
       * gerek yok — kullanıcı o alanda bir şey görüyor mu, bunun piksel
       * düzeyindeki karşılığı budur.
       */
      let ayrisan = 0;
      let alan = 0;
      /*
       * EN GÜÇLÜ SİNYAL: kutu içindeki zemine karşı EN YÜKSEK KONTRAST.
       *
       * Bir bileşeni gözün tanıması için DOLGUNUN zeminden ayrılması gerekmez;
       * SINIRI (kenar) veya İŞARETİ (glif) zeminden ayrılmalıdır — WCAG 1.4.11
       * "non-text contrast" tam olarak bunu ister (≥3:1).
       *
       * §1G gereği gövde KOYU ve zemin KOYU. Dolgu/gövde kontrastı bu yüzden
       * 1.05–1.11:1'de kalır ve bu bir KUSUR DEĞİLDİR; tasarımı böyle taşıyan
       * iki şey vardır: 1px sıcak-beyaz HALKA ve WhatsApp yeşili GLİF.
       * Bu döngü ikisini birden yakalar, yani paletten bağımsızdır.
       */
      let enGuc = 0;
      for (let yy = y0; yy <= y1; yy++) {
        for (let xx = x0; xx <= x1; xx++) {
          const [r, g, b] = px(im, xx, yy);
          alan++;
          const dr = r - bg[0];
          const dg = g - bg[1];
          const db = b - bg[2];
          if (Math.sqrt(dr * dr + dg * dg + db * db) > 60) ayrisan++;
          const c = ratio([r, g, b], bg);
          if (c > enGuc) enGuc = c;
        }
      }
      const oran = alan ? ayrisan / alan : 0;

      const cx = Math.round((x0 + x1) / 2);
      const cy = Math.round((y0 + y1) / 2);
      const off = Math.round((y1 - y0) * 0.4);
      const fill = px(im, Math.min(im.w - 1, Math.max(0, cx)), Math.min(im.h - 1, Math.max(0, cy - off)));
      const cFill = ratio(fill, bg);
      const gapR = Math.round(info.vw - info.right);
      const gapB = Math.round(info.vh - info.bottom);

      const fails = [];
      /*
       * ALGI KAPISI — eski iki eşik bu tedavi için ÖLÇÜ YANLIŞI veriyordu:
       *   eski: ayrisan ≥ %40  VE  gövde/zemin ≥ 1.5:1
       *   sorun: ikisi de "dolgu zeminden ayrılsın" varsayar. §1G zaten buna
       *          izin vermiyor (koyu gövde / koyu zemin). Sonuç: 14 ekran
       *          görüntüsünde net görünen düğme 54/54 "ALGILANAMIYOR" oluyordu.
       *   yeni: zemine karşı EN GÜÇLÜ sinyal ≥3:1 (WCAG 1.4.11) VEYA güçlü
       *          piksel oranı ≥%40. Halka (~17:1) ve glif (~7:1) bu kapıdan
       *          geçer; silinmiş bir düğme (gövde=zemin, kenar yok, glif yok)
       *          hâlâ GEÇEMEZ → test boş kalır mı diye --selftest ile ayrıca
       *          doğrulandı.
       */
      if (!(enGuc >= 3.0 || oran >= 0.4)) {
        fails.push("ALGILANAMIYOR enGuc=" + enGuc.toFixed(2) + ":1 ayrisan=" + Math.round(oran * 100) + "%");
      }
      if (info.right > info.vw + 0.5 || info.bottom > info.vh + 0.5 || info.x < -0.5 || info.y < -0.5) fails.push("GORUNUM DISINDA");
      if (info.width < 44 || info.height < 44) fails.push("44px ALTI " + info.width + "x" + info.height);
      if (gapR < 6 || gapB < 6) fails.push("KENAR KESIK gap=" + gapR + "/" + gapB);
      if (info.pointerEvents === "none") fails.push("pointer-events:none");
      if (String(info.hit).indexOf("FAB:") !== 0) fails.push("USTTE:" + info.hit);

      bad += fails.length ? 1 : 0;
      total++;
      say((fails.length ? "  BOZUK " : "  ok    ") + tag +
        " ayrisan=" + Math.round(oran * 100) + "%" +
        " enGuc=" + enGuc.toFixed(1) +
        " boy=" + info.width + "x" + info.height +
        " gap=" + gapR + "/" + gapB +
        " z=" + info.zIndex +
        " govde/zemin=" + cFill.toFixed(2) +
        " bodyOv=" + info.bodyOv +
        " ust=" + info.hit +
        (fails.length ? "   <-- " + fails.join(" | ") : ""));
    } catch (e) {
      bad++; total++;
      say("  HATA  " + tag + " " + String(e.message).slice(0, 110));
    }
  }
}

say("TOPLAM " + total + " olcum, " + bad + " bozuk  (MODE=" + MODE + " ONLY=" + ONLY + ")");
await browser.close();
process.exit(0);

