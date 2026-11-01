// Axe checks at desktop and narrow widths, including the prediction dialog,
// finished evidence and the questionnaire. This does not establish full WCAG conformance.
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
  const inspect = async (width, state) => {
    const audit = await page.evaluate(tags => axe.run(document, {runOnly: {type: 'tag', values: tags}}), rules);
    results.push({width, state, violations: audit.violations.map(violation => ({
      id: violation.id, impact: violation.impact,
      nodes: violation.nodes.map(node => ({target: node.target, summary: node.failureSummary})),
    }))});
  };
  try {
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({width, height: 1000});
      await page.goto(base + '/');
      await page.addScriptTag({path: axePath});
      await inspect(width, 'landing');
      await page.goto(base + '/demo.html');
      await page.locator('[data-curated="double-reward"]').click();
      await page.addScriptTag({path: axePath});
      await inspect(width, 'prediction dialog');
      await page.locator('#prediction-loosened').check();
      await page.locator('#predict-run').click();
      await page.locator('#lesson-text').waitFor();
      await inspect(width, 'finished experiment');
      await page.locator('#beliefs-summary').click();
      await inspect(width, 'questionnaire');
    }
    fs.writeFileSync('/tmp/vibes-axe-results.json', JSON.stringify(results, null, 2));
    const total = results.reduce((count, result) => count + result.violations.length, 0);
    if (total) console.log(JSON.stringify(results.filter(result => result.violations.length), null, 2));
    assert.equal(total, 0, 'accessibility violations');
    console.log('accessibility audit passed: 4 states at 3 widths');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
