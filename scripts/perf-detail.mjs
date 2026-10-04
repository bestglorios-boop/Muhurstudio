// scripts/perf-detail.mjs — LCP ögesi ve en büyük kazanç fırsatları.
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const URL = process.argv[2] || "http://localhost:3222/";
const FORM = process.argv[3] || "mobile";

const chrome = await chromeLauncher.launch({ port: 0, chromeFlags: ["--headless=new", "--no-sandbox"] });

const lhr = (
  await lighthouse(URL, {
    port: chrome.port,
    output: "json",
    logLevel: "error",
    formFactor: FORM,
    onlyCategories: ["performance"],
    screenEmulation:
      FORM === "mobile"
        ? { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false }
        : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
  })
).lhr;

const lcp = lhr.audits["largest-contentful-paint-element"];
console.log("LCP element:", JSON.stringify(lcp?.details?.items?.[0]?.items?.[0]?.node?.snippet || lcp?.displayValue || "?"));
const lcpPhase = lhr.audits["lcp-breakdown-insight"] || lhr.audits["largest-contentful-paint-element"];
console.log("LCP phases:", JSON.stringify(lcpPhase?.details?.items || []).slice(0, 400));

console.log("\n--- opportunities (en fazla kazanç) ---");
const opp = Object.values(lhr.audits)
  .filter((a) => a.details?.type === "opportunity" && a.details.overallSavingsMs > 0)
  .sort((a, b) => b.details.overallSavingsMs - a.details.overallSavingsMs)
  .slice(0, 8);
for (const a of opp) {
  console.log(`  ${a.id}: ~${Math.round(a.details.overallSavingsMs)} ms`);
}

console.log("\n--- main-thread / payload ---");
for (const id of ["total-blocking-time", "bootup-time", "mainthread-work-breakdown", "network-requests", "total-byte-weight", "unused-javascript", "render-blocking-resources"]) {
  const a = lhr.audits[id];
  if (a) console.log(`  ${id}: ${a.displayValue || a.numericValue}`);
}

try { await chrome.kill(); } catch {}
process.exit(0);
