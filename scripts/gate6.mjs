/**
 * gate6.mjs — §17: masaüstünde 3D sahnesinin KARE MALİYETİ.
 *
 * Lighthouse masaüstü TBT'si 2.1 sn, mobil 0.43 sn çıkıyor (ters oran).
 * Sebep: masaüstü geometri bütçesi çok daha ağır (segs 128 vs 56,
 * antialias açık, DPR 2) ve mobilde CPU kısıtlaması kareleri seyreltiyor.
 * Bu yüzden ham kare sürelerini doğrudan ölçüyoruz.
 */
import puppeteer from "puppeteer-core";
import { existsSync, appendFileSync } from "node:fs";

const ORIGIN = "http://localhost:3000";
const say = (s) => { appendFileSync("gate6.log", s + String.fromCharCode(10)); console.log(s); };
const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);

async function kareOlc(etiket, w, h, sure = 5000) {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--no-sandbox", `--window-size=${w},${h}`] });
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 40000 });
  await new Promise((r) => setTimeout(r, 4500)); // idle callback + sahne kurulsun

  const olcum = await page.evaluate(async (ms) => {
    const dizi = [];
    let onceki = performance.now();
    let calisti = true;
    const basla = performance.now();
    const tik = () => {
      const s = performance.now();
      dizi.push(s - onceki);
      onceki = s;
      if (calisti) requestAnimationFrame(tik);
    };
    requestAnimationFrame(tik);
    await new Promise((r) => setTimeout(r, ms));
    calisti = false;
    const gecerli = dizi.slice(1).filter((d) => d > 0);
    gecerli.sort((a, b) => a - b);
    const yuzde = (p) => gecerli.length ? Math.round(gecerli[Math.min(gecerli.length - 1, Math.floor(gecerli.length * p))]) : 0;
    const canvas = document.querySelector("canvas");
    return {
      kare: gecerli.length,
      ort: gecerli.length ? Math.round(gecerli.reduce((a, b) => a + b, 0) / gecerli.length) : 0,
      p50: yuzde(0.5), p95: yuzde(0.95), enUzun: yuzde(0.999),
      elliUstu: gecerli.filter((d) => d > 50).length,
      fps: gecerli.length ? Math.round(1000 / (gecerli.reduce((a, b) => a + b, 0) / gecerli.length)) : 0,
      canvasCss: canvas ? Math.round(canvas.getBoundingClientRect().width) + "x" + Math.round(canvas.getBoundingClientRect().height) : "yok",
      canvasHam: canvas ? canvas.width + "x" + canvas.height : "yok",
      toplam: Math.round(performance.now() - basla),
    };
  }, sure);

  say(`${etiket} ${w}x${h}`);
  say(`   pencere=${olcum.toplam}ms  kare=${olcum.kare}  fps~${olcum.fps}`);
  say(`   kare suresi: ort=${olcum.ort}ms  p50=${olcum.p50}ms  p95=${olcum.p95}ms  enUzun=${olcum.enUzun}ms`);
  say(`   50ms UZERI kare sayisi=${olcum.elliUstu}  (bunlarin her biri bir uzun gorev = TBT)`);
  say(`   canvas css=${olcum.canvasCss} ham=${olcum.canvasHam}`);
  await browser.close();
  return olcum;
}

const m = await kareOlc("MOBIL", 390, 844);
const d = await kareOlc("MASAUSTU", 1440, 900);
say("");
say("=== YORUM ===");
say(`  masaustu/mobil kare maliyeti orani: ${m.ort ? (d.ort / m.ort).toFixed(2) : "?"}x`);
say(`  masaustunde 50ms ustu kare: ${d.elliUstu} / ${d.kare}  -> TBT kaynagi`);
say("BITTI");
process.exit(0);
