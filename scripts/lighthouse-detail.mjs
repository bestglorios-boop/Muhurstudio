// scripts/lighthouse-detail.mjs
// Başarısız denetimleri (kategori puanı < 1) ayrıntılarıyla yazar.
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const BASE = process.argv[2] || "http://localhost:3222";
const URLS = [
  ["/", "mobile"],
  ["/work/notella", "mobile"],
];

const chrome = await chromeLauncher.launch({ port: 0, chromeFlags: ["--headless=new", "--no-sandbox"] });

for (const [path, form] of URLS) {
  const lhr = (
    await lighthouse(BASE + path, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      formFactor: form,
      onlyCategories: ["accessibility", "seo"],
      screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
    })
  ).lhr;

  console.log(`\n===== ${path} =====`);
  for (const [catName, cat] of Object.entries(lhr.categories)) {
    if (cat.score === 1) continue;
    console.log(`[${catName}] score=${Math.round(cat.score * 100)}`);
    for (const ref of cat.auditRefs) {
      const a = lhr.audits[ref.id];
      if (!a || a.score === null || a.score >= 1) continue;
      console.log(`  ✗ ${ref.id}: ${a.title}`);
      const items = a.details?.items || [];
      for (const it of items.slice(0, 6)) {
        const node = it.node;
        if (node) {
          console.log(`     ${node.snippet}`);
          console.log(`     -> ${node.explanation || node.selector || ""}`);
        } else {
          console.log(`     ${JSON.stringify(it).slice(0, 220)}`);
        }
      }
    }
  }
}

try {
  await chrome.kill();
} catch {}
process.exit(0);
