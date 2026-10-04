/**
 * gate3b.mjs — iki dogrulama:
 *   1) og:image GERCEK degeri nedir? (localhost sizmasi var mi)
 *   2) 3 canvas nedir? (line-art + 3D muhur) ve rota degisiminde sayi SABIT mi
 */
import puppeteer from "puppeteer-core";
import { existsSync, appendFileSync } from "node:fs";

const ORIGIN = "http://localhost:3000";
const say = (s) => { appendFileSync("gate3b.log", s + String.fromCharCode(10)); console.log(s); };
const chrome = ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"].find(existsSync);
const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
await new Promise((k) => setTimeout(k, 2000));
const og = await page.evaluate(() => {
  const g = (s) => { const e = document.querySelector(s); return e ? e.getAttribute("content") : null; };
  return {
    ogImage: g('meta[property="og:image"]'),
    ogImageAlt: g('meta[property="og:image:alt"]'),
    ogUrl: g('meta[property="og:url"]'),
    ogSite: g('meta[property="og:site_name"]'),
    canonical: (document.querySelector('link[rel="canonical"]') || {}).href || null,
    twitterImg: g('meta[name="twitter:image"]'),
  };
});
say("OG degerleri: " + JSON.stringify(og, null, 1));
say("  localhost sizmasi: " + (/localhost|127\.0\.0\.1/.test(JSON.stringify(og)) ? "VAR <-- SORUN" : "yok"));

const canvaslar = await page.evaluate(() => {
  return [...document.querySelectorAll("canvas")].map((c) => {
    const b = c.getBoundingClientRect();
    const p = c.parentElement;
    return {
      boyut: c.width + "x" + c.height,
      css: Math.round(b.width) + "x" + Math.round(b.height),
      ata: p ? (p.className || "").toString().slice(0, 52) : "?",
      enYakin: (() => { let e = c; while (e && e !== document.body) { const cn = (e.className || "").toString(); if (/seal|muhur|three|line|string|Sait|hero/i.test(cn)) return cn.slice(0, 46); e = e.parentElement; } return "-"; })(),
      gorunur: b.width > 0 && b.height > 0,
      opaklik: getComputedStyle(c).opacity,
    };
  });
});
say("canvaslar:");
canvaslar.forEach((c) => say("  " + JSON.stringify(c)));

const n1 = canvaslar.length;
await page.goto(ORIGIN + "/work", { waitUntil: "load", timeout: 30000 });
await new Promise((k) => setTimeout(k, 1800));
const n2 = await page.evaluate(() => document.querySelectorAll("canvas").length);
await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
await new Promise((k) => setTimeout(k, 3500));
const n3 = await page.evaluate(() => document.querySelectorAll("canvas").length);
await page.goto(ORIGIN + "/about", { waitUntil: "load", timeout: 30000 });
await new Promise((k) => setTimeout(k, 1800));
const n4 = await page.evaluate(() => document.querySelectorAll("canvas").length);
await page.goto(ORIGIN + "/", { waitUntil: "load", timeout: 30000 });
await new Promise((k) => setTimeout(k, 3500));
const n5 = await page.evaluate(() => document.querySelectorAll("canvas").length);
say(`canvas sayisi: /=${n1} -> /work=${n2} -> /=${n3} -> /about=${n4} -> /=${n5}`);
say(`  sizinti: ${n1 === n3 && n3 === n5 ? "YOK (sabit)" : "VAR <-- SORUN"}`);

say("BITTI");
await browser.close();
process.exit(0);
