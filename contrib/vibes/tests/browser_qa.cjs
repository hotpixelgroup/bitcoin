// Browser checks for the static site: the landing page and the demo.
//
//   python3 contrib/vibes/build_site.py --out /tmp/vibes-site
//   python3 -m http.server 21880 --bind 127.0.0.1 --directory /tmp/vibes-site
//   node contrib/vibes/tests/browser_qa.cjs
//
// The demo replays results recorded from real runs of the lab, so these checks
// also confirm that what the demo teaches matches what the lab observed.
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const base = (process.env.VIBES_QA_URL || 'http://127.0.0.1:21880').replace(/\/$/, '');

function token(value) {
  return 'vibe1.' + Buffer.from(JSON.stringify(value)).toString('base64url');
}

(async () => {
  const launch = process.env.VIBES_BROWSER_CHANNEL ? {channel: process.env.VIBES_BROWSER_CHANNEL} : {};
  const browser = await chromium.launch({...launch, headless: true});
  const context = await browser.newContext({viewport: {width: 1440, height: 1100}});
  const page = await context.newPage();
  const errors = [];
  let apiRequests = 0;
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (new URL(request.url()).pathname.includes('/api/')) apiRequests++; });
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);

  try {
    // Landing page.
    await page.goto(base + '/');
    await page.getByRole('heading', {name: 'What shall Bitcoin become?'}).waitFor();
    assert.equal(await overflow(), false, 'landing page overflows at desktop width');

    // The demo says what it is.
    await page.goto(base + '/demo.html');
    await page.getByText('No AI and no node run here').waitFor();
    assert.equal(await page.locator('[data-curated]').count(), 10, 'ten ready-made experiments');
    assert.equal(await page.locator('#curated-grid h3').count(), 3, 'in three groups');
    assert.equal(await page.locator('#manifest').isDisabled(), true, 'the demo must not pretend to write code');

    // A ready-made scene: predict wrongly, see the recorded result, read why.
    await page.locator('[data-curated="relay-filter"]').click();
    await page.getByRole('heading', {name: 'Can a filter keep data out of the chain?'}).waitFor();
    await page.locator('#prediction-reject').check();
    await page.locator('#predict-run').click();
    await page.locator('#verdict-title').filter({hasText: 'Local policy only'}).waitFor();
    assert.match(await page.locator('#prediction-result').innerText(), /Observed instead/);
    const rows = await page.locator('.cmp-row').allInnerTexts();
    assert.equal(rows.length, 3, 'three recorded observations');
    assert.match(rows[0], /refuses to relay it/);
    assert.match(rows[1], /accepted the block/);
    assert.match(await page.locator('#lesson-text').innerText(), /never applied to transactions that are already\s+in a block/);
    await page.locator('#followup-nothing').check();
    await page.locator('#followup-check').click();
    await page.locator('#followup-result').filter({hasText: 'Right.'}).waitFor();
    await page.locator('#learning-summary').filter({hasText: '0 of 1 predictions right, 1 of 1 follow-up'}).waitFor();

    // A ready-made source change: the recorded comparison names the rule.
    await page.locator('[data-curated="double-reward"]').click();
    await page.locator('#prediction-loosened').check();
    await page.locator('#predict-run').click();
    await page.locator('#verdict-title').filter({hasText: 'Loosened'}).waitFor();
    assert.match(await page.locator('#prediction-result').innerText(), /You predicted this/);
    assert.match(await page.locator('#comparison-rows').innerText(), /bad-cb-amount/);
    assert.match(await page.locator('#verdict-mainnet').innerText(), /hard fork/);
    assert.match(await page.locator('#outcome-test').innerText(), /no longer pass/);
    await page.locator('#diff-summary').click();
    assert.match(await page.locator('#diff').innerText(), /100 \* COIN/);
    assert.match(await page.locator('#risk').innerText(), /the block subsidy/);

    assert.equal(await page.locator('#chain-picture .chain-lane').count(), 2, 'the two chains are drawn');
    assert.ok(await page.locator('#chain-picture .blk.refused').count() >= 1, 'the refused block is marked');
    assert.equal(await page.locator('#lesson-sources a').count(), 2, 'the lesson cites its sources');

    // History and the learning record survive a reload.
    await page.reload();
    await page.locator('.history-row').nth(1).waitFor();
    assert.equal(await page.locator('.history-row').count(), 2);
    await page.locator('#learning-summary').filter({hasText: '1 of 2 predictions right'}).waitFor();

    // Mining power: the same scene on both sides of one half.
    for (const [share, option, outcome] of [[30, 'own', 'left on their own chain'], [70, 'strict', 'became the rule for everyone']]) {
      await page.locator('[data-curated="power"]').click();
      await page.locator('#predict-share').fill(String(share));
      assert.equal(await page.locator('#predict-share-value').innerText(), share + '%');
      await page.locator('#prediction-' + option).check();
      await page.locator('#predict-run').click();
      await page.locator('#verdict-title').filter({hasText: `With ${share}% of mining power`}).waitFor();
      assert.match(await page.locator('#verdict-title').innerText(), new RegExp(outcome));
      assert.match(await page.locator('#prediction-result').innerText(), /You predicted this/);
      assert.equal(await page.locator('#try-again').isVisible(), true);
    }
    const lanes = await page.locator('#chain-picture .chain-blocks').all();
    assert.equal(await lanes[0].locator('.blk.changed').count(), 28, 'at 70% the unmodified nodes follow 28 stricter blocks');
    assert.equal(await lanes[0].locator('.blk.stock').count(), 0, 'and none of the other miners\' blocks survive');

    // Keys: the coins outlive the wallet.
    await page.locator('[data-curated="keys"]').click();
    await page.locator('#prediction-gone').check();
    await page.locator('#predict-run').click();
    await page.locator('#verdict-title').filter({hasText: 'The coins were on the chain all along'}).waitFor();
    assert.match(await page.locator('#comparison-rows').innerText(), /restored on node B: 50/);

    // Before and after: answers are hidden until the second round is saved.
    await page.locator('#beliefs-summary').click();
    assert.equal(await page.locator('#beliefs-list fieldset').count(), 10);
    for (const input of await page.locator('#beliefs-list input[value="true"]').all()) await input.check();
    await page.locator('#beliefs-save').click();
    await page.locator('#beliefs-stage').filter({hasText: 'First answers saved'}).waitFor();
    assert.equal(await page.locator('#beliefs-list .pass, #beliefs-list .fail').count(), 0, 'nothing is marked after the first round');
    await page.locator('#beliefs-summary').click();
    for (const input of await page.locator('#beliefs-list input[value="false"]').all()) await input.check();
    await page.locator('#beliefs-save').click();
    await page.locator('#beliefs-stage').filter({hasText: 'Answered before and after'}).waitFor();
    await page.locator('#beliefs-status').filter({hasText: 'Right before: 3 of 10. Right after: 7 of 10.'}).waitFor();

    // A shared request is shown as text and never as markup.
    const hostile = '<img src=x onerror="window.pwned=1"> Raise the subsidy';
    await page.goto(base + '/demo.html#decree=' + token({v: 1, p: hostile, sha: 'abc', ts: 1, c: [], f: []}));
    await page.getByRole('heading', {name: 'A request from someone else'}).waitFor();
    assert.match(await page.locator('#confirm-copy').innerText(), /<img src=x/);
    assert.equal(await page.evaluate(() => window.pwned), undefined, 'markup in a shared request must not run');
    assert.equal(await page.locator('#confirm-copy img').count(), 0);
    await page.locator('#confirm-action').click();
    await page.locator('#imported-note').filter({hasText: 'came from someone else'}).waitFor();
    assert.equal(await page.locator('#mode').inputValue(), 'review');

    // Hidden control characters in a shared request are refused.
    await page.goto(base + '/demo.html');
    await page.locator('summary', {hasText: 'Import or share a request'}).click();
    await page.locator('#import-token').fill(token({v: 1, p: 'safe‮evil'}));
    await page.locator('#import').click();
    await page.locator('#toast').filter({hasText: 'hidden control characters'}).waitFor();

    // Narrow screens.
    for (const width of [768, 390, 320]) {
      await page.setViewportSize({width, height: 900});
      for (const path of ['/', '/demo.html']) {
        await page.goto(base + path);
        await page.waitForTimeout(300);
        assert.equal(await overflow(), false, `${path} overflows at ${width}px`);
      }
    }

    assert.equal(apiRequests, 0, 'the demo must make no API requests');
    assert.deepEqual(errors, [], 'page errors: ' + errors.join(' | '));
    console.log('browser checks passed');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
