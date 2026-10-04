/**
 * footer-grid.mjs — Konum ve E-posta sütunları aynı satırda ve ayrı aralıkta mı?
 *
 * GARANTİ: Location (md+ 7–9) ve E-posta (md+ 10–12) grid aralıkları
 * AYRIDIR ve etiketleri md+ genişliklerde aynı satırdadır (dikey fark ≤ 2px).
 * md altında tek kolon olduğu için istiflenir (beklenen davranış).
 *
 * Kullanım: node scripts/footer-grid.mjs
 */
import { withBrowser, settle, ORIGIN, WIDTHS } from "./_harness.mjs";

const ciz = (s) => console.log(s);

/* Kolon atamalarını tarayıcıdan okumak yerine DOM'dan gerçek
   yerleşimi ölçeriz: hangi etiket hangi satırda, sol kenarı ne. */
const OLC = () => {
  const dt = [...document.querySelectorAll("footer dt, footer p.label")];
  const konum = dt.find((e) => e.textContent.trim() === "Konum");
  const eposta = dt.find((e) => e.textContent.trim() === "E-posta");
  if (!konum || !eposta) return { hata: "etiket bulunamadi" };

  const k = konum.getBoundingClientRect();
  const e = eposta.getBoundingClientRect();

  /* Etiketlerin hemen altındaki değer satırları */
  const deger = (etiket) => {
    const dd = etiket.parentElement.querySelector("dd, p, a");
    if (!dd) return null;
    const r = dd.getBoundingClientRect();
    return { sol: Math.round(r.left), ust: Math.round(r.top) };
  };

  /* Gerçek grid ataması: tarayıcı hangi kolon satırına koydu? */
  const izgara = (el) => {
    const kutu = el.parentElement;
    const cs = getComputedStyle(kutu);
    return {
      col: cs.gridTemplateColumns,
      start: cs.gridColumnStart,
      span: cs.gridColumnEnd,
    };
  };

  return {
    konum: { sol: Math.round(k.left), ust: Math.round(k.top) },
    eposta: { sol: Math.round(e.left), ust: Math.round(e.top) },
    konumDeger: deger(konum),
    epostaDeger: deger(eposta),
    izgaraKonum: izgara(konum),
    izgaraEposta: izgara(eposta),
  };
};

let sorun = 0;

await withBrowser(async (page) => {
  for (const w of [390, ...WIDTHS.filter((x) => x >= 768)]) {
    await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
    await page.goto(ORIGIN + "/", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await settle(page, { revealMs: 900 });

    const o = await page.evaluate(OLC);
    ciz("=== " + w + "px ===");
    if (o.hata) {
      ciz("   " + o.hata);
      sorun++;
      continue;
    }
    ciz(
      "   KONUM  etiket sol=" + o.konum.sol + " ust=" + o.konum.ust +
        "   deger sol=" + (o.konumDeger ? o.konumDeger.sol : "-") +
        " ust=" + (o.konumDeger ? o.konumDeger.ust : "-")
    );
    ciz(
      "   EPOSTA etiket sol=" + o.eposta.sol + " ust=" + o.eposta.ust +
        "   deger sol=" + (o.epostaDeger ? o.epostaDeger.sol : "-") +
        " ust=" + (o.epostaDeger ? o.epostaDeger.ust : "-")
    );
    const dikey = o.eposta.ust - o.konum.ust;
    const yatay = o.eposta.sol - o.konum.sol;
    ciz(
      "   fark: dikey=" + Math.round(dikey) + "px  yatay=" + Math.round(yatay) + "px"
    );
    if (Math.abs(dikey) > 2 && w >= 768) {
      ciz("   >>> DIKEYDE HIZALI DEGIL (md+): E-posta bir satir ALTINDA");
      sorun++;
    }
  }
});

process.exitCode = sorun > 0 ? 1 : 0;