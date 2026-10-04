/**
 * gate5.mjs — §17: ana iş parçacığını uzun süre bloke eden şey NE?
 *
 * Lighthouse TBT'si bu makinede gürültülü (OneDrive senkronu + arka plan
 * yükü ~%25). Bu yüzden kaynağı doğrudan ölçüyoruz:
 *   PerformanceObserver("longtask") ile sayfa açılışındaki uzun görevler
 *   sayılır ve toplanır — iki koşulda:
 *     A) normal            -> 3D sahnesi rAF döngüsü çalışır
 *     B) prefers-reduced-motion -> yalnızca TEK statik kare çizilir
 *   Fark, 3D döngüsünün maliyetini izole eder.
 *
 * Ayrıca sayfa içi iş yükü CPU kısıtlamasından bağımsız kıyaslanır.
 */
import puppeteer from "puppeteer-core";
import { existsSync, appendFileSync } from "node:fs";

const ORIGIN = "http://localhost:3000";
const say = (s) => { appendFileSync("gate5.log", s + String.fromCharCode(10)); console.log(s); };
const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);

async function olc(etiket, reduced, url) {
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--window-size=1440,900"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  if (reduced) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  const cdp = await page.createCDPSession();
  await cdp.send("Performance.enable");

  await page.evaluateOnNewDocument(() => {
    window.__lt = [];
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__lt.push({ d: Math.round(e.duration), s: Math.round(e.startTime) });
      }).observe({ entryTypes: ["longtask"] });
    } catch { }
  });

  const t0 = Date.now();
  await page.goto(ORIGIN + url, { waitUntil: "load", timeout: 40000 });
  /* Ölçüm penceresi: yükleme sonrası 6 sn (Lighthouse TBT penceresine denk) */
  await new Promise((r) => setTimeout(r, 6000));
  const lt = await page.evaluate(() => window.__lt);
  const yukleme = Date.now() - t0 - 6000;

  const m = await cdp.send("Performance.getMetrics");
  const al = (n) => { const x = m.metrics.find((y) => y.name === n); return x ? x.value : null; };
  const toplamUzun = lt.reduce((a, b) => a + b.d, 0);
  const enUzun = lt.length ? Math.max(...lt.map((x) => x.d)) : 0;
  /* TBT yaklaşımı: her uzun görevin 50 ms üstü kısmı */
  const tbt = lt.reduce((a, b) => a + Math.max(0, b.d - 50), 0);

  say(`${etiket} (${url})`);
  say(`   yukleme=${yukleme}ms  uzunGorevSayisi=${lt.length}  enUzun=${enUzun}ms  toplamUzun=${toplamUzun}ms  TBT~${tbt}ms`);
  say(`   uzun gorevler: ${lt.map((x) => x.d + "ms@" + x.s).slice(0, 12).join(", ")}${lt.length > 12 ? " ..." : ""}`);
  say(`   CDP: JSHeapUsedSize=${Math.round((al("JSHeapUsedSize") || 0) / 1048576)}MB  Nodes=${al("Nodes")}  LayoutCount=${al("LayoutCount")}`);

  await browser.close();
  return { lt: lt.length, toplamUzun, enUzun, tbt };
}

const a = await olc("A) normal (3D rAF dongusu ACIK)", false, "/");
const b = await olc("B) reduced-motion (TEK statik kare)", true, "/");
const c = await olc("C) normal /work (3D sahnesi YOK)", false, "/work");

say("");
say("=== KARSILASTIRMA ===");
say(`  3D dongusunun ekledigi uzun gorev suresi : ${a.toplamUzun - b.toplamUzun}ms`);
say(`  3D dongusunun ekledigi TBT~              : ${a.tbt - b.tbt}ms`);
say(`  /work (3D yok) TBT~                      : ${c.tbt}ms`);
say(`  3D sahnesi ANA TBT kaynagi mi            : ${a.tbt > c.tbt * 3 ? "EVET" : "HAYIR"}`);
say("BITTI");
process.exit(0);
