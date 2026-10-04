/**
 * _harness.mjs — QA betiklerinin ortak altyapısı.
 *
 * Tek sorumluluk: güvenilir ölçüm yapan, ve ölçüm BİTİNCE kaynaklarını
 * gerçekten bırakmayan bir tarayıcı açmak.
 *
 *   - Chrome/Edge çözümleme (puppeteer-core, yerel kurulu tarayıcı)
 *   - localhost origin + ortak viewport genişlikleri
 *   - hızlı launch varsayılanları (headless, no-sandbox, gpu kapalı)
 *   - wait stratejisi: domcontentloaded; networkidle YASAK (3D sahne
 *     sürekli bağlantı tuttuğu için ağ asla "boş" kalmaz → timeout)
 *   - fonts.ready bekleme + reveal animasyonu payı
 *   - ÜRETİLEN dosyalar için ortak klasörler: shots/, audit/, *.log
 *   - TARAYICI YAŞAM DÖNGÜSÜ: hata/timeout/erken çıkışta bile temizlik
 *
 * Kullanım:
 *   import { withBrowser, settle, ORIGIN, WIDTHS } from "./_harness.mjs";
 *   const sorun = await withBrowser(async (page) => { ...; return issueCount; });
 *   process.exitCode = sorun > 0 ? 1 : 0;
 */
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync } from "node:fs";

const TARIYICILAR = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

/** Kurulu tarayıcıyı bulur; yoksa hata fırlatır (sessiz fallback yok). */
export function findBrowser() {
  const exe = TARIYICILAR.find((p) => existsSync(p));
  if (!exe) throw new Error("Chrome/Edge bulunamadı.");
  return exe;
}

/** QA hedefi: çalışan production/build sunucusu (npm run start, :3000). */
export const ORIGIN = process.env.QA_ORIGIN || "http://localhost:3000";

/** Gerçek cihaz + masaüstü genişlikleri (hızlı tur için alt küme). */
export const WIDTHS = [320, 390, 768, 1024, 1440, 1920];

/** Tam tarama genişlikleri (level tam turu için). */
export const WIDTHS_FULL = [
  320, 360, 375, 390, 414, 430, 480, 600, 640,
  768, 834, 960, 1024, 1152, 1280, 1366, 1440, 1536, 1680, 1920, 2560,
];

/** Ana rotalar (canonik sıra). */
export const ROUTES = ["/", "/work", "/work/notella", "/work/bursa-sofrasi", "/about"];

/** Üretilen dosyalar için ortak klasörler. Script'ler kendi alt yolunu seçer. */

/**
 * Tek sayfalık işi çalıştırır; HER DURUMDA tarayıcıyı kapatır.
 *
 * YAŞAM DÖNGÜSÜ SÖZLEŞMESİ:
 *   - `browser.close()` bir kez, `finally` içinde, her zaman denenir.
 *   - close() başarısız olursa süreç ağacı elle temizlenir (SADECE bu
 *     testin doğduğu PID'ler — geniş isim eşleşmesiyle rastgele süreç
 *     öldürme YOK).
 *   - TEMİZLİK production Next.js sunucusunu ASLA öldürmez: yalnızca
 *     bu testin kaydettiği süreç kimlikleri hedeflenir.
 *   - `work` bir hata fırlatırsa hata YUTULMAZ; önce temizlik, sonra
 *     yeniden fırlatılır. Çağıran `process.exitCode` belirleyebilir.
 *
 * `work`, açık `page` alır ve sorun sayısı döndürür.
 */
export async function withBrowser(work, launchArgs = []) {
  let browser = null;
  let ownedPids = null;

  try {
    browser = await puppeteer.launch({
      executablePath: findBrowser(),
      headless: "new",
      args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars", ...launchArgs],
      // Kapanış yavaşsa zaman aşımına düşmemek için CDP toleransı.
      protocolTimeout: 120000,
    });
    ownedPids = trackBrowserPids(browser);
    const page = await browser.newPage();
    return await work(page);
  } finally {
    await closeBrowser(browser, ownedPids);
  }
}

/**
 * Bu tarayıcıya ait süreç kimliklerini toplar.
 *
 * NEDEN: puppeteer'ın close()'ı CDP bağlantısını kapatır ama Windows'ta
 * bazen alt süreçler (renderer/GPU yardımcıları) hayatta kalır. Yalnızca
 * BU testin doğduğu kimlikleri bilmek, temizliğin güvenli olmasını sağlar.
 */
function trackBrowserPids(browser) {
  const pids = new Set();
  try {
    const proc = browser.process();
    if (proc && typeof proc.pid === "number") pids.add(proc.pid);
  } catch { /* süreç bilgisi yoksa yalnız close() yeter */ }
  return pids.size ? pids : null;
}

/**
 * Tarayıcıyı kapatır; gerekirse YALNIZCA kendi süreçlerini sonlandırır.
 * Hata fırlatmaz — temizlik hatası ölçüm sonucunu BOZMAMALIDIR.
 */
async function closeBrowser(browser, ownedPids) {
  if (browser) {
    try {
      await browser.close();
    } catch { /* aşağıda süreç temizliğine düşüyoruz */ }
  }
  if (!ownedPids || ownedPids.size === 0) return;

  // close() işe yaramadıysa yalnızca kendi ağacımızı temizle.
  // KISA bekleme: kapanış tamamlanmışsa süreç zaten yok sayılır.
  await new Promise((r) => setTimeout(r, 300));
  for (const pid of ownedPids) {
    try {
      process.kill(pid, 0); // hâlâ ayakta mı?
    } catch {
      continue; // süreç yok — temiz.
    }
    try {
      process.kill(pid); // SIGTERM; yalnızca bizim PID'imiz.
    } catch { /* yetki yoksa da sessiz geç */ }
  }
}

/**
 * Lighthouse gibi araçların açtığı CDP örneğini güvenle sonlandırır.
 * `kill` başarısız olsa hata fırlatmaz.
 */
export async function killLauncher(launcher) {
  if (!launcher) return;
  try {
    await launcher.kill();
  } catch { /* temizlik başarısı ölçümü bozmamalı */ }
}

export function ensureDirs(...dirs) {
  for (const d of dirs) mkdirSync(d, { recursive: true });
}

/**
 * Sayfayı açar, font + reveal animasyonlarının bitmesini bekler.
 * Ölçümden önce çağrılır; bekleme stratejisi tek yerdedir.
 */
export async function settle(page, { revealMs = 1000 } = {}) {
  try {
    await page.evaluate(() => document.fonts.ready);
  } catch { /* fonts API yoksa devam */ }
  await new Promise((r) => setTimeout(r, revealMs));
}

/**
 * Bir sayfayı istenen genişlikte açar ve ölçüme hazır hâle getirir.
 * Betiklerin `goto` + `settle` tekrarını kaldırır.
 */
export async function openAt(page, path, { width, height = 900, revealMs = 1000 } = {}) {
  if (width) await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(ORIGIN + path, { waitUntil: "domcontentloaded", timeout: 30000 });
  await settle(page, { revealMs });
}