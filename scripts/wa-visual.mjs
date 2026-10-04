/**
 * wa-visual.mjs — §11 / §12 / §25 GÖRSEL doğrulama.
 *
 *   node scripts/wa-visual.mjs [port]
 *
 * Sayaç raporlamaz: her genişlikte GERÇEK ekran görüntüsü alınır ve
 * ayrıca şu ölçütler doğrulanır:
 *   - bounding box viewport içinde, kırpılmamış
 *   - en az 44x44 tıklama alanı
 *   - menü AÇIKKEN menü örtmeli, KAPALIYKEN denetim görünmeli (§8)
 *   - CTA ile kesişim yok
 *   - tıklama -> https://wa.me/905399542171 (§12)
 */
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";

const PORT = process.argv[2] || "3000";
const BASE = `http://localhost:${PORT}`;
const EXPECTED = "https://wa.me/905399542171";
const WIDTHS = [320, 360, 375, 390, 414, 430];

mkdirSync("audit", { recursive: true });
for (const f of readdirSync("audit")) {
  if (f.startsWith("wa-") && f.endsWith(".png")) unlinkSync(`audit/${f}`);
}

function findChrome() {
  const c = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
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
  console.log(`  ${ok ? " ok " : "HATA"}  ${msg}`);
  if (!ok) problems++;
};


for (const w of WIDTHS) {
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await page.setViewport({
    width: w,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1000));

  console.log(`\n=== ${w}px ===`);

  const m = await page.evaluate(() => {
    const a = [...document.querySelectorAll("a[href*='wa.me']")].find(
      (el) => getComputedStyle(el).position === "fixed",
    );
    if (!a) return { missing: true };
    const r = a.getBoundingClientRect();
    const cs = getComputedStyle(a);
    const vw = innerWidth;
    const vh = innerHeight;

    const ctas = [...document.querySelectorAll('a[href^="mailto:"]')]
      .map((e) => {
        const b = e.getBoundingClientRect();
        return {
          hit:
            b.width > 0 &&
            b.height > 0 &&
            r.left < b.right &&
            r.right > b.left &&
            r.top < b.bottom &&
            r.bottom > b.top,
          label: (e.textContent || "").trim().slice(0, 24),
        };
      })
      .filter((c) => c.hit)
      .map((c) => c.label);

    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    const selfTop = !!hit && (hit === a || a.contains(hit));

    const icon = (() => {
      const s = a.querySelector("svg");
      if (!s) return null;
      const b = s.getBoundingClientRect();
      return {
        w: Math.round(b.width),
        h: Math.round(b.height),
        padL: Math.round(b.left - r.left),
        padR: Math.round(r.right - b.right),
        padT: Math.round(b.top - r.top),
        padB: Math.round(r.bottom - b.bottom),
      };
    })();

    return {
      href: a.getAttribute("href"),
      aria: a.getAttribute("aria-label"),
      target: a.getAttribute("target"),
      rel: a.getAttribute("rel"),
      position: cs.position,
      w: Math.round(r.width),
      h: Math.round(r.height),
      left: Math.round(r.left),
      top: Math.round(r.top),
      right: Math.round(r.right),
      bottom: Math.round(r.bottom),
      vw,
      vh,
      zIndex: cs.zIndex,
      visibility: cs.visibility,
      opacity: cs.opacity,
      selfTop,
      ctas,
      icon,
    };
  });


  if (m.missing) {
    say(false, "SABIT BUTON YOK");
    await page.close();
    continue;
  }

  say(m.position === "fixed", `position=fixed (${m.position})`);
  say(
    m.left >= 0 && m.right <= m.vw && m.top >= 0 && m.bottom <= m.vh,
    `viewport icinde  [${m.left},${m.top} -> ${m.right},${m.bottom}] / ${m.vw}x${m.vh}`,
  );
  say(m.w >= 44 && m.h >= 44, `olcu ${m.w}x${m.h} (>=44px tiklama alani)`);
  say(m.selfTop, "merkezde ustteki eleman denetimin kendisi");
  say(m.ctas.length === 0, `CTA kesisimi=${m.ctas.length}${m.ctas[0] ? " " + m.ctas[0] : ""}`);
  say(m.visibility !== "hidden" && Number(m.opacity) > 0, "gorunurluk normal");
  say(m.href === EXPECTED, `href=${m.href}`);
  say(m.aria === "WhatsApp'tan iletişime geç", `aria-label=${m.aria}`);
  say(
    m.target === "_blank" && /noopener/.test(m.rel || ""),
    `target=${m.target} rel=${m.rel}`,
  );
  if (m.icon) {
    say(
      m.icon.padL >= 6 && m.icon.padR >= 6 && m.icon.padT >= 6 && m.icon.padB >= 6,
      `ikon ${m.icon.w}x${m.icon.h} dolgu L${m.icon.padL}/R${m.icon.padR}/T${m.icon.padT}/B${m.icon.padB}`,
    );
  }

  // --- GÖRSEL: tam viewport + düğmenin büyütülmüş kırpımı ---
  await page.screenshot({ path: `audit/wa-${w}-full.png` });
  const pad = 44;
  await page.screenshot({
    path: `audit/wa-${w}-fab.png`,
    clip: {
      x: Math.max(0, m.left - pad),
      y: Math.max(0, m.top - pad),
      width: Math.min(m.vw, m.w + pad * 2),
      height: Math.min(m.vh, m.h + pad * 2),
    },
  });



  // --- §8: menü açıkken menü örtsün, kapalıyken denetim görünsün ---
  await page.click('button[aria-controls="mobil-menu"]');
  await new Promise((r) => setTimeout(r, 500));
  const menuOpen = await page.evaluate(() => {
    const a = [...document.querySelectorAll("a[href*='wa.me']")].find(
      (el) => getComputedStyle(el).position === "fixed",
    );
    const r = a.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    const menu = document.getElementById("mobil-menu");
    const covered = !!(hit && menu && (menu === hit || menu.contains(hit)));
    const cs = getComputedStyle(a);
    return {
      covered,
      inDom: document.body.contains(a),
      display: cs.display,
      visibility: cs.visibility,
      menuZ: menu ? getComputedStyle(menu).zIndex : null,
      fabZ: cs.zIndex,
    };
  });
  say(menuOpen.inDom, "menü açıkken DOM'da duruyor");
  say(
    menuOpen.display !== "none" && menuOpen.visibility !== "hidden",
    "menü açıkken gizlenmemiş (kalıcı gizleme yok)",
  );
  say(
    menuOpen.covered,
    `menü denetimi örtüyor (menü z=${menuOpen.menuZ} > fab z=${menuOpen.fabZ})`,
  );
  await page.screenshot({ path: `audit/wa-${w}-menu.png` });

  // menüyü kapat → denetim yeniden görünür
  await page.click('button[aria-controls="mobil-menu"]');
  await new Promise((r) => setTimeout(r, 500));
  const closed = await page.evaluate(() => {
    const a = [...document.querySelectorAll("a[href*='wa.me']")].find(
      (el) => getComputedStyle(el).position === "fixed",
    );
    const r = a.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return { visible: !!hit && (hit === a || a.contains(hit)) };
  });
  say(closed.visible, "menü kapatılınca denetim yeniden görünür");

  say(
    errors.length === 0,
    `konsol hatasi=${errors.length}${errors[0] ? " -> " + errors[0] : ""}`,
  );

  await page.close();
} // --- for (const w of WIDTHS) sonu ---

// --- §12: TIKLAMA TESTİ ---
console.log("\n=== TIKLAMA TESTI (§12) ===");
{
  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 800));

  // NOT: `browser.once("targetcreated")` hedefi OLUŞTURULDUĞU AN boş URL ile
  // gelir (about:blank). Bu yüzden tıklama sonrası hedef LİSTESİ okunur.
  const box = await page.evaluate(() => {
    const a = [...document.querySelectorAll("a[href*='wa.me']")].find(
      (el) => getComputedStyle(el).position === "fixed",
    );
    const r = a.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  // Gerçek, GÜVENİLİR tıklama: sentetik `a.click()` kullanıcı hareketi
  // sayılmaz ve Chrome popup'ı engeller. Gerçek fare olayı gönderilir.
  await page.mouse.click(box.x, box.y);
  await new Promise((r) => setTimeout(r, 3500));

  // Tıklamanın açtığı sekme: localhost olmayan tek sayfa hedefi.
  const opened = browser
    .targets()
    .map((t) => {
      try {
        return t.url();
      } catch {
        return "";
      }
    })
    .find((u) => u.startsWith("http") && !u.includes("localhost"));

  if (opened && /wa\.me|whatsapp\.com/.test(opened)) {
    // wa.me/905399542171 WhatsApp'ın kendi yönlendirmesine gider:
    // api.whatsapp.com/send/?phone=905399542171 — ikisi de DOĞRU sonuçtur.
    const hasNumber = opened.includes("905399542171");
    say(hasNumber, `tıklama → ${opened}`);
  } else {
    const href = await page.evaluate(() => {
      const a = [...document.querySelectorAll("a[href*='wa.me']")].find(
        (el) => getComputedStyle(el).position === "fixed",
      );
      return a.href;
    });
    say(
      href === EXPECTED,
      `sekme acilamadi (headless kisit), href kontrol edildi: ${href}`,
    );
  }
  await page.close();
}

await browser.close();
console.log(`\nTOPLAM SORUN: ${problems}`);
process.exit(problems > 0 ? 1 : 0);
