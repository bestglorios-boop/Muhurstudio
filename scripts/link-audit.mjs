/**
 * link-audit.mjs — §27 TAM BAĞLANTI DENETİMİ (gerçek gezinme).
 *   node scripts/link-audit.mjs [port]
 * href'e bakmak YETMEZ: bağlantıya tıklanır, gidilen adres okunur.
 */
import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";

const BASE = `http://localhost:${process.argv[2] || "3000"}`;

/**
 * Beklenen hedefler.
 *
 * DÜZELTME: "Proje Başlatalım" beklentisi eskiden `mailto:` idi. Bu artık
 * YANLIŞTIR — birincil CTA doğrudan WhatsApp'a açıyor
 * (data/site.ts → social.primaryActionHref). Beklenti güncellenmediği için
 * betik gerçekte DOĞRU olan davranışı hata olarak raporluyordu.
 */
const EXPECT = [
  { l: "logo", s: 'header a[aria-label*="ana sayfa"]', w: "/" },
  { l: "Çalışmalar", t: "Çalışmalar", w: "/work" },
  { l: "Hizmetler", t: "Hizmetler", w: "/#hizmetler" },
  { l: "Yaklaşımımız", t: "Yaklaşımımız", w: "/#yaklasim" },
  { l: "Hakkımızda", t: "Hakkımızda", w: "/about" },
  { l: "Proje Başlatalım", t: "Proje Başlatalım", w: "https://wa.me/905399542171" },
  { l: "Notella", s: 'a[href*="/work/notella"]', w: "/work/notella" },
  { l: "Bursa Sofrası", s: 'a[href*="/work/bursa-sofrasi"]', w: "/work/bursa-sofrasi" },
  { l: "WhatsApp", s: 'a[href*="wa.me"]', w: "https://wa.me/905399542171" },
  { l: "Instagram", s: 'a[href*="instagram.com"]', w: "https://" },
  { l: "LinkedIn", s: 'a[href*="linkedin.com"]', w: "https://" },
  // Yasal bağlantılar — footer'da kendi satırında.
  { l: "Gizlilik Politikası", s: 'a[href="/gizlilik"]', w: "/gizlilik" },
  { l: "KVKK Aydınlatma Metni", s: 'a[href="/kvkk"]', w: "/kvkk" },
  { l: "Çerez Politikası", s: 'a[href="/cerezler"]', w: "/cerezler" },
  { l: "Kullanım Koşulları", s: 'a[href="/kullanim-kosullari"]', w: "/kullanim-kosullari" },
];

const chrome =
  [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].find(existsSync);

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: "new",
  args: ["--no-sandbox"],
});

let bad = 0;
const ok = (c, m) => {
  console.log(`  ${c ? " ok " : "HATA"}  ${m}`);
  if (!c) bad++;
};

const openHome = async () => {
  const p = await browser.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 500));
  return p;
};

for (const spec of EXPECT) {
  const page = await openHome();
  const href = await page.evaluate(
    (s, t) => {
      const a = s
        ? document.querySelector(s)
        : [...document.querySelectorAll("a")].find((e) =>
            (e.textContent || "").trim().startsWith(t),
          );
      return a ? a.getAttribute("href") : null;
    },
    spec.s || null,
    spec.t || null,
  );

  if (!href) {
    ok(false, `${spec.l}: bağlantı bulunamadı`);
    await page.close();
    continue;
  }

  const ext =
    href.startsWith("mailto:") ||
    href.startsWith("https://wa.me") ||
    href.includes("instagram.com") ||
    href.includes("linkedin.com");

  if (ext) {
    // Tıklanmaz (sayfadan ayrılır); hedef + güvenlik nitelikleri doğrulanır.
    const good =
      href.startsWith("mailto:")
        ? href.includes("@") && href.split("@")[1].includes(".")
        : spec.w === "https://"
          ? /^https:\/\/[\w.-]+\.[a-z]{2,}/i.test(href)
          : href === spec.w;
    ok(good, `${spec.l} -> ${href}`);
    const attrs = await page.evaluate((h) => {
      const a = [...document.querySelectorAll("a")].find(
        (e) => e.getAttribute("href") === h,
      );
      return a ? { t: a.target, r: a.rel, l: a.getAttribute("aria-label") } : null;
    }, href);
    if (attrs && attrs.t === "_blank") {
      ok(/noopener/.test(attrs.r || ""), `${spec.l} rel=${attrs.r}`);
    }
    await page.close();
    continue;
  }

  // Dahili → GERÇEKTEN tıkla.
  await page.evaluate(
    (s, t) => {
      const a = s
        ? document.querySelector(s)
        : [...document.querySelectorAll("a")].find((e) =>
            (e.textContent || "").trim().startsWith(t),
          );
      a.click();
    },
    spec.s || null,
    spec.t || null,
  );
  await new Promise((r) => setTimeout(r, 1500));
  const landed = page.url();
  const [path, hash] = landed.split("#");

  if (hash) {
    const exists = await page.evaluate((h) => {
      const el = document.getElementById(h);
      return !!el && el.getBoundingClientRect().height > 0;
    }, hash);
    ok(
      path.replace(BASE, "") === "/" &&
        hash === spec.w.split("#")[1] &&
        exists,
      `${spec.l} -> ${landed.replace(BASE, "")} hedefBolum=${exists}`,
    );
  } else {
    // Ana sayfa "http://localhost:3000/" → yol "/" olur; "/" temizlenince
    // boş string kalıyordu ve doğru davranış "HATA" sanılıyordu.
    const norm = (u) => {
      const p = u.replace(BASE, "").replace(/\/$/, "");
      return p === "" ? "/" : p;
    };
    ok(norm(landed) === spec.w, `${spec.l} -> ${norm(landed)} (beklenen ${spec.w})`);
  }
  await page.close();
}

console.log("\n=== ROTA DURUMLARI ===");
for (const r of ["/", "/work", "/work/notella", "/work/bursa-sofrasi", "/about"]) {
  const res = await fetch(BASE + r).catch(() => null);
  ok(res && res.status === 200, `${r} -> ${res ? res.status : "baglanamadi"}`);
}
const nf = await fetch(BASE + "/yok-boyle-bir-sayfa").catch(() => null);
ok(nf && nf.status === 404, `/yok-boyle-bir-sayfa -> ${nf ? nf.status : "?"} (404 olmali)`);

await browser.close();
console.log(`\nTOPLAM SORUN: ${bad}`);
process.exit(bad > 0 ? 1 : 0);
