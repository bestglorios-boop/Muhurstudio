/**
 * check-crop.mjs — RevealCrop içerikleri gerçekten görünür mü?
 *
 * GARANTİ: her `.overflow-hidden` sarmalayıcı için, animasyon
 * tamamlandıktan SONRA ölçüm alınır ve iki şey raporlanır:
 *   1) yatay taşma (scrollWidth - clientWidth)
 *   2) içerik `clip-path` ile tamamen görünmez mi (`inset(0 100% 0 0)`)
 *
 * NEDEN animasyon bekleniyor: `closed` = `inset(0 100% 0 0)` → görsel
 * TAMAMEN görünmez; `open` = `inset(0 0% 0 0)` → tamamen görünür.
 * Animasyon bitmeden ölçmek yanlış sonuç verir (her şey kapalı görünür).
 *
 * Sahiplik: tarayıcıyı `withBrowser` AÇAR ve `finally` içinde KAPATIR.
 * Bu script hiçbir zaman CDP handle'ını dışarıda tutmaz; Chrome zorla
 * sonlandırılsa bile sonraki kod bloğu çalışmaz, süreç temizlenir.
 *
 * Kullanım: node scripts/check-crop.mjs
 */
import { withBrowser, ORIGIN } from "./_harness.mjs";

const ciz = (s) => console.log(s);

/* Her .overflow-hidden sarmalayıcıyı görünür alana sokup ÖLÇÜMÜ TEK TEK
   yapar — toplu ölçüm yanıltıcıydı. */
const TEK = async (i) => {
  const e = document.querySelectorAll(".overflow-hidden")[i];
  if (!e) return null;
  e.scrollIntoView({ block: "center", behavior: "instant" });
  /* 1.4s: 0.9s süre + 0.06*i gecikme + güvenlik payı */
  await new Promise((r) => setTimeout(r, 1400));
  const ic = e.querySelector("div");
  const cs = ic ? getComputedStyle(ic) : null;
  return {
    sinif: (e.getAttribute("class") || "").slice(0, 34),
    sw: e.scrollWidth,
    cw: e.clientWidth,
    tasma: e.scrollWidth - e.clientWidth,
    clip: cs ? cs.clipPath : "yok",
    scale: cs ? cs.transform : "yok",
  };
};

let sorun = 0;

await withBrowser(async (page) => {
  for (const w of [1440]) {
    await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
    await page.goto(ORIGIN + "/work/notella", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await new Promise((k) => setTimeout(k, 800));

    const adet = await page.evaluate(
      () => document.querySelectorAll(".overflow-hidden").length
    );
    ciz("=== " + w + "px — " + adet + " adet .overflow-hidden ===");

    for (let i = 0; i < adet; i++) {
      const r = await page.evaluate(TEK, i);
      if (!r) continue;
      /* clip-path tamamen kapalı mı? */
      const kapali = /inset\(\s*0(?:px)?\s+100%/.test(r.clip || "");
      if (kapali) {
        ciz("  [" + i + "] " + r.sinif + "  <<< TAMAMEN KIRPILMIS (INVISIBLE)");
        sorun++;
      }
      if (r.tasma > 0) {
        ciz("  [" + i + "] " + r.sinif + "  <<< YATAY TASMA " + r.tasma + "px");
        sorun++;
      }
      ciz(
        "  [" + i + "] " + r.sinif +
          "\n      tasma=" + r.tasma + " (" + r.sw + ">" + r.cw + ")" +
          "\n      clip-path=" + r.clip +
          "\n      transform=" + r.scale
      );
    }
  }
});

process.exitCode = sorun > 0 ? 1 : 0;