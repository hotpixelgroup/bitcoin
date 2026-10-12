// Automated accessibility audit (axe-core) of the landing page and the demo
// at three widths. A clean result here is not a claim of full conformance.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const base = (process.env.VIBES_QA_URL || 'http://127.0.0.1:21880').replace(/\/$/, '');
const axePath = process.env.AXE_MODULE || require.resolve('axe-core/axe.min.js');
const rules = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

(async () => {
  const launch = process.env.VIBES_BROWSER_CHANNEL ? {channel: process.env.VIBES_BROWSER_CHANNEL} : {};
  const browser = await chromium.launch({...launch, headless: true});
  const page = await browser.newPage();
  const results = [];
  try {
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({width, height: 1000});
      for (const path of ['/', '/demo.html']) {
        await page.goto(base + path);
        if (path === '/demo.html') {
          // Audit the page with a finished experiment on it, not just the empty state.
          await page.locator('[data-curated="relay-filter"]').click();
          await page.locator('#prediction-accept').check();
          await page.locator('#predict-run').click();
          await page.locator('#lesson-text').waitFor();
        }
        await page.addScriptTag({path: axePath});
        await page.waitForTimeout(500);
        const audit = await page.evaluate(tags => axe.run(document, {runOnly: {type: 'tag', values: tags}}), rules);
        results.push({width, path, violations: audit.violations.map(violation => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.map(node => ({target: node.target, summary: node.failureSummary})),
        }))});
      }
    }
    fs.writeFileSync('/tmp/vibes-axe-results.json', JSON.stringify(results, null, 2));
    const total = results.reduce((count, result) => count + result.violations.length, 0);
    if (total) console.log(JSON.stringify(results.filter(result => result.violations.length), null, 2));
    assert.equal(total, 0, 'accessibility violations');
    console.log('accessibility audit passed at 3 widths');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
