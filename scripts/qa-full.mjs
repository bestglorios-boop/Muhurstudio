/**
 * qa-full.mjs — kapsamlı üretim denetimi.
 *   node scripts/qa-full.mjs [port]
 *
 * Kapsam: her rota, yükleme ekranı, konsol hataları, başarısız istekler,
 * yatay taşma, duyarlı davranış, klavye, indirgemiş hareket.
 */
import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

const PORT = process.argv[2] || "3000";
const ORIGIN = `http://localhost:${PORT}`;

function chromePath() {
  const c = [
    `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ];
  return c.find((p) => p && existsSync(p)) || null;
}

const exec = chromePath();
if (!exec) {
  console.error("HATA: Chrome/Edge bulunamadi. Olcum yapilmadan geciliyor.");
  process.exit(2);
}

const ROUTES = [
  "/",
  "/about",
  "/work",
  "/work/notella",
  "/work/bursa-sofrasi",
  "/gizlilik",
  "/kvkk",
  "/cerezler",
  "/kullanim-kosullari",
];

const problems = [];
const note = (m) => console.log("  " + m);
const bad = (m) => {
  problems.push(m);
  console.log("  x " + m);
};

const browser = await puppeteer.launch({
  executablePath: exec,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader"],
});

async function newPage(w, h) {
  const p = await browser.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  return p;
}

/** Konsol + ağ hatalarını toplayan dinleyicileri kurar. */
function watch(page, sink) {
  page.on("console", (m) => {
    if (m.type() === "error") sink.push("konsol: " + m.text().slice(0, 160));
  });
  page.on("pageerror", (e) => sink.push("sayfa hatasi: " + String(e).slice(0, 160)));
  page.on("requestfailed", (r) => {
    const u = r.url();
    if (u.startsWith(ORIGIN)) sink.push("istek basarisiz: " + u.replace(ORIGIN, ""));
  });
  page.on("response", (r) => {
    if (r.status() >= 400 && r.url().startsWith(ORIGIN))
      sink.push("HTTP " + r.status() + ": " + r.url().replace(ORIGIN, ""));
  });
}

console.log("=== 1) ROTA DURUMU ===");
for (const r of ROUTES) {
  const p = await newPage(1280, 900);
  const errs = [];
  watch(p, errs);
  let code = 0;
  try {
    const res = await p.goto(ORIGIN + r, { waitUntil: "networkidle2", timeout: 30000 });
    code = res.status();
  } catch (e) {
    bad(r + " yuklenemedi: " + String(e).slice(0, 90));
    await p.close();
    continue;
  }
  const real = errs.filter((e) => !/favicon/.test(e));
  const title = await p.title();
  if (code !== 200) bad(r + " -> " + code);
  else if (!title.trim()) bad(r + " -> bos <title>");
  else if (real.length) bad(r + " -> hata: " + real[0]);
  else note(r + " -> 200  " + title.slice(0, 52));
  await p.close();
}

{
  const p = await newPage(1280, 900);
  const res = await p.goto(ORIGIN + "/boyle-bir-sayfa-yok", { waitUntil: "load" });
  if (res.status() !== 404) bad("bilinmeyen rota 404 vermedi: " + res.status());
  else note("bilinmeyen rota -> 404 OK");
  await p.close();
}

console.log("=== 2) 3B SAHNE / YEDEK ===");
{
  const p = await newPage(1280, 900);
  await p.goto(ORIGIN + "/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2500));

  const three = await p.evaluate(() => {
    const c = document.querySelector("canvas");
    if (!c) return { canvas: false };
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    return { canvas: true, w: c.width, h: c.height, glAlive: !!gl && !gl.isContextLost() };
  });
  note("canvas=" + three.canvas + " gl=" + three.glAlive + " boyut=" + three.w + "x" + three.h);
  if (!three.canvas) bad("3B canvas yok");
  else if (!three.glAlive) note("WebGL baglami kayip (yedege gecilmis olabilir)");
  await p.close();
}

console.log("=== 3) WEBGL KAPALI -> YEDEK ===");
{
  const p = await browser.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  await p.evaluateOnNewDocument(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, ...a) {
      if (String(t).includes("webgl")) return null;
      return orig.call(this, t, ...a);
    };
  });
  const errs = [];
  watch(p, errs);
  await p.goto(ORIGIN + "/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2200));
  const st = await p.evaluate(() => ({
    bodyH: document.body.scrollHeight,
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  }));
  note("WebGL yok: icerik uzunlugu=" + st.bodyH + " tasma=" + st.overflow);
  if (st.bodyH < 400) bad("WebGL yokken sayfa neredeyse bos");
  if (st.overflow) bad("WebGL yokken yatay tasma var");
  const real = errs.filter((e) => !/favicon/.test(e));
  if (real.length) note("(beklenen) " + real[0].slice(0, 80));
  await p.close();
}

console.log("=== 4) CTA + YASAL BAGLANTILAR ===");
{
  const p = await newPage(1280, 900);
  await p.goto(ORIGIN + "/", { waitUntil: "networkidle2", timeout: 30000 });

  const cta = await p.evaluate(() => {
    const a = [...document.querySelectorAll("a,button")].find(
      (e) => (e.textContent || "").trim().replace(/\s+/g, " ") === "Proje Başlatalım"
    );
    if (!a) return { found: false };
    const r = a.getBoundingClientRect();
    return {
      found: true,
      tag: a.tagName,
      href: a.getAttribute("href") || "",
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  });
  if (!cta.found) bad('"Proje Başlatalım" bulunamadi');
  else {
    note("CTA: <" + cta.tag + '> href="' + cta.href + '" ' + cta.w + "x" + cta.h + "px");
    if (!/^https:\/\/wa\.me\/\d{8,}/.test(cta.href)) bad("CTA WhatsApp degil: " + cta.href);
    if (cta.w < 44 || cta.h < 44) bad("CTA dokunma hedefi kucuk: " + cta.w + "x" + cta.h);
  }

  for (const slug of ["gizlilik", "kvkk", "cerezler", "kullanim-kosullari"]) {
    const ok = await p.evaluate((s) => {
      const a = document.querySelector('a[href="/' + s + '"]');
      if (!a) return false;
      const r = a.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }, slug);
    if (!ok) bad("footer'da /" + slug + " baglantisi yok veya gorunmez");
    else note("/footer: /" + slug + " OK");
  }
  await p.close();
}

console.log("=== 5) YATAY TASMA (duyarli) ===");
for (const w of [320, 390, 480, 768, 1024, 1440, 1920]) {
  const p = await newPage(w, 900);
  for (const r of ["/", "/work", "/gizlilik", "/about"]) {
    await p.goto(ORIGIN + r, { waitUntil: "networkidle2", timeout: 30000 });
    const o = await p.evaluate(() => {
      const over = document.documentElement.scrollWidth - window.innerWidth;
      let worst = null;
      if (over > 1) {
        worst = [...document.querySelectorAll("body *")]
          .map((e) => {
            const b = e.getBoundingClientRect();
            return {
              sel: e.tagName + "." + (e.className || "").toString().slice(0, 40),
              r: Math.round(b.right),
            };
          })
          .filter((x) => x.r > window.innerWidth + 1)
          .sort((a, b) => b.r - a.r)[0];
      }
      return { over, worst };
    });
    if (o.over > 1) {
      bad(
        r + " @" + w + "px -> " + o.over + "px tasma" +
        (o.worst ? " (" + o.worst.sel + " right=" + o.worst.r + ")" : "")
      );
    }
  }
  note(w + "px kontrol edildi");
  await p.close();
}

console.log("=== 6) KLAVYE GEZINME ===");
{
  const p = await newPage(1280, 900);
  await p.goto(ORIGIN + "/", { waitUntil: "networkidle2", timeout: 30000 });
  const res = await p.evaluate(() => {
    const sel =
      'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
    const vis = (e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden";
    };
    const all = [...document.querySelectorAll(sel)].filter(vis);
    const noName = all.filter(
      (e) => !(e.textContent || "").trim() && !e.getAttribute("aria-label") && !e.getAttribute("title")
    );
    const first = all[0];
    return {
      total: all.length,
      noName: noName.length,
      first: first
        ? (first.textContent || first.getAttribute("aria-label") || "").trim().slice(0, 30)
        : "(yok)",
    };
  });
  note("odaklanabilir: " + res.total + ", adi olmayan: " + res.noName);
  if (res.noName > 0) bad(res.noName + " odaklanabilir ogenin erisilebilir adi yok");
  note('ilk odak: "' + res.first + '"');
  await p.close();
}

console.log("=== 7) INDIRGEMIS HAREKET ===");
{
  const p = await browser.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  const errs = [];
  watch(p, errs);
  await p.goto(ORIGIN + "/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));
  const st = await p.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    visible: document.body.innerText.trim().length > 100,
  }));
  note("tasma=" + st.overflow + " icerikVar=" + st.visible);
  if (st.overflow) bad("indirgemis harekette yatay tasma var");
  if (!st.visible) bad("indirgemis harekette icerik gizli");
  const real = errs.filter((e) => !/favicon/.test(e));
  if (real.length) bad("indirgemis harekette hata: " + real[0]);
  await p.close();
}

await browser.close();

console.log("\n" + "=".repeat(46));
if (problems.length) {
  console.log("SONUC: " + problems.length + " SORUN");
  problems.forEach((x, i) => console.log("  " + (i + 1) + ". " + x));
  process.exit(1);
}
console.log("SONUC: temiz — belirtilen denetimlerde sorun yok.");
