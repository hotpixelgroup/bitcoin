// Browser checks for the static site: the landing page and the demo.
//
//   python3 contrib/vibes/build_site.py --out /tmp/vibes-site
//   python3 -m http.server 21880 --bind 127.0.0.1 --directory /tmp/vibes-site
//   node contrib/vibes/tests/browser_qa.cjs
//
// The demo replays results recorded from real runs of the lab, so these checks
// also confirm that what the demo teaches matches what the lab observed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const base = (process.env.VIBES_QA_URL || 'http://127.0.0.1:21880').replace(/\/$/, '');
const screenshotDir = process.env.VIBES_SCREENSHOT_DIR;
if (screenshotDir) fs.mkdirSync(screenshotDir, {recursive: true});

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
  const capture = async name => { if (screenshotDir) await page.screenshot({path: path.join(screenshotDir, name)}); };

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
    assert.equal(await page.locator('#node-controls').isVisible(), false, 'no fake running node in the demo');
    assert.equal(await page.locator('#playground').isVisible(), false, 'install-only operations are hidden');
    assert.equal(await page.locator('#settings-section').isVisible(), false);
    assert.ok((await page.locator('#start-learning').boundingBox()).y < 1100, 'a clear starting action is visible');
    await capture('demo-desktop.png');
    await page.locator('#start-learning').click();
    await page.locator('#predict-dialog').waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#predict-dialog').isVisible(), false, 'the prediction dialog closes with Escape');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'start-learning', 'keyboard focus returns to the opener');
    await page.locator('#beliefs-summary').click();
    await page.locator('#beliefs-list input[value="true"]').first().check();

    // A ready-made scene: predict wrongly, see the recorded result, read why.
    await page.locator('[data-curated="relay-filter"]').click();
    await page.getByRole('heading', {name: 'Can a filter keep data out of the chain?'}).waitFor();
    await page.locator('#prediction-reject').check();
    await page.locator('#predict-run').click();
    await page.locator('#verdict-title').filter({hasText: /filtering node accepted|policy/i}).waitFor();
    assert.match(await page.locator('#prediction-result').innerText(), /Observed instead/);
    const rows = await page.locator('.cmp-row').allInnerTexts();
    assert.equal(rows.length, 3, 'three recorded observations');
    assert.match(rows[0], /refuses to relay it/);
    assert.match(rows[1], /accepted the block/);
    assert.match(await page.locator('#lesson-text').innerText(), /policy|relay/i);
    await page.locator('#followup-nothing').check();
    await page.locator('#followup-check').click();
    await page.locator('#followup-result').filter({hasText: 'Right.'}).waitFor();
    await page.locator('#learning-summary').filter({hasText: '0 of 1 predictions right, 1 of 1 follow-up'}).waitFor();
    assert.equal(await page.locator('#beliefs-list input[value="true"]').first().isChecked(), true, 'learning refresh preserves unsaved quiz answers');
    assert.equal(await page.locator('#next-experiment').isVisible(), true, 'a completed lesson has a next step');

    // A saved answer returns even when the learning record loads after the result.
    const delayedContext = await browser.newContext({storageState: await context.storageState()});
    await delayedContext.addInitScript(() => {
      let demo;
      Object.defineProperty(window, 'VibesDemo', {configurable: true, get() { return demo; }, set(value) {
        demo = value;
        const original = value.api;
        value.api = async (path, body) => {
          if (path === '/api/learning' && !body) await new Promise(resolve => setTimeout(resolve, 600));
          return original(path, body);
        };
      }});
    });
    const delayedPage = await delayedContext.newPage();
    await delayedPage.goto(base + '/demo.html');
    await delayedPage.locator('#followup-result').filter({hasText: 'Right.'}).waitFor();
    assert.equal(await delayedPage.locator('#followup-check').isDisabled(), true, 'the saved first answer is restored');
    await delayedContext.close();

    // A ready-made source change: the recorded comparison names the rule.
    await page.locator('[data-curated="double-reward"]').click();
    await page.locator('#prediction-loosened').check();
    await page.locator('#predict-run').click();
    await page.locator('#verdict-title').filter({hasText: 'Loosened'}).waitFor();
    assert.match(await page.locator('#prediction-result').innerText(), /You predicted this/);
    assert.match(await page.locator('#comparison-rows').innerText(), /bad-cb-amount/);
    assert.match(await page.locator('#verdict-mainnet').innerText(), /hard fork/);
    assert.match(await page.locator('#outcome-test').innerText(), /Not run|no longer pass/);
    await capture('experiment-result.png');
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
    for (const share of [30, 50, 55, 65, 70, 85]) {
      const {option, headline} = await page.evaluate(share => ({option: window.VibesDemoData[`power@${share}`].compare.observed_answer, headline: window.VibesDemoData[`power@${share}`].compare.headline}), share);
      await page.locator('[data-curated="power"]').click();
      await page.locator('#predict-share').fill(String(share));
      assert.equal(await page.locator('#predict-share-value').innerText(), share + '%');
      await page.locator('#prediction-' + option).check();
      await page.locator('#predict-run').click();
      await page.locator('#verdict-title').filter({hasText: headline}).waitFor();
      assert.equal(await page.locator('#verdict-title').innerText(), headline);
      assert.match(await page.locator('#prediction-result').innerText(), /You predicted this/);
      assert.equal(await page.locator('#try-again').isVisible(), true);
    }
    const lanes = await page.locator('#chain-picture .chain-blocks').all();
    assert.equal(await lanes[0].locator('.blk.changed').count(), 34, 'at 85% the unmodified node follows the 34 stricter discoveries');
    assert.equal(await lanes[0].locator('.blk.stock').count(), 0, 'and none of the other miners\' blocks survive');

    // Keys: the coins outlive the wallet.
    await page.locator('[data-curated="keys"]').click();
    await page.locator('#prediction-gone').check();
    await page.locator('#predict-run').click();
    await page.locator('#verdict-title').filter({hasText: 'The coins were on the chain all along'}).waitFor();
    assert.match(await page.locator('#comparison-rows').innerText(), /restored on node B: 50/);

    // A transient scoring failure is retried on the next render, not marked saved early.
    const attemptsBefore = await page.evaluate(async () => (await window.VibesDemo.api('/api/learning')).summary.prediction.answered);
    await page.evaluate(() => {
      const original = window.VibesDemo.api;
      let fail = true;
      window.VibesDemo.api = async (path, body) => {
        if (fail && path === '/api/learning' && body?.stage === 'prediction') {
          fail = false;
          throw new Error('transient test failure');
        }
        return original(path, body);
      };
    });
    await page.locator('[data-curated="keys"]').click();
    await page.locator('#prediction-chain').check();
    await page.locator('#predict-run').click();
    await page.waitForFunction(async count => (await window.VibesDemo.api('/api/learning')).summary.prediction.answered === count + 1, attemptsBefore);

    // Before and after: answers are hidden until the second round is saved.
    if (await page.locator('#beliefs-details').getAttribute('open') === null) await page.locator('#beliefs-summary').click();
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
    await page.locator('#toast').filter({hasText: 'invisible or control characters'}).waitFor();

    // So are the other kinds a reader cannot see: zero-width, tag and variation characters.
    for (const unseen of ['\u200b', '\u{E0041}', '\ufe0f']) {
      await page.goto(base + '/demo.html');
      await page.locator('summary', {hasText: 'Import or share a request'}).click();
      await page.locator('#import-token').fill(token({v: 1, p: 'safe' + unseen + 'evil'}));
      await page.locator('#import').click();
      await page.locator('#toast').filter({hasText: 'invisible or control characters'}).waitFor();
      assert.ok(!(await page.locator('#wish').inputValue()).includes('safe'), 'a refused request must not reach the draft');
    }

    // A token whose extra fields are malformed cannot break the page, now or after a reload.
    await page.goto(base + '/demo.html#decree=' + token({v: 1, p: 'Raise the subsidy', sha: 5, ts: 'soon', c: 'nope',
                                                        f: [null, 7, ['src/a.cpp', 1, 1], [null, 1, 1]]}));
    await page.getByRole('heading', {name: 'A request from someone else'}).waitFor();
    await page.locator('#confirm-action').click();
    await page.locator('#imported-note').filter({hasText: 'On their machine it changed: src/a.cpp.'}).waitFor();
    await page.goto(base + '/demo.html');
    await page.locator('#imported-note').filter({hasText: 'came from someone else'}).waitFor();
    assert.equal(await page.locator('#wish').inputValue(), 'Raise the subsidy');
    await page.locator('#curated-grid button').first().waitFor();

    // A new sharing hash cannot overwrite an unrelated confirmation already open.
    await page.locator('#reset-demo').click();
    await page.locator('#confirm-title').filter({hasText: 'Reset the browser demo?'}).waitFor();
    await page.evaluate(value => { location.hash = '#decree=' + value; }, token({v: 1, p: 'A second imported request'}));
    await page.locator('#toast').filter({hasText: 'Finish or close the open dialog'}).waitFor();
    assert.equal(await page.locator('#confirm-title').innerText(), 'Reset the browser demo?');
    await page.locator('#confirm-dialog button[value="cancel"]').click();

    // Narrow screens.
    for (const width of [768, 390, 320]) {
      await page.setViewportSize({width, height: 900});
      for (const path of ['/', '/demo.html']) {
        await page.goto(base + path);
        await page.waitForTimeout(300);
        assert.equal(await overflow(), false, `${path} overflows at ${width}px`);
        if (path === '/demo.html') {
          const start = await page.locator('#start-learning').boundingBox();
          assert.ok(start && start.y >= 0 && start.y < 900, `the starting action is visible at ${width}px`);
        }
        if (width === 390 && path === '/demo.html') await capture('demo-mobile.png');
      }
    }

    assert.equal(apiRequests, 0, 'the demo must make no API requests');
    assert.deepEqual(errors, [], 'page errors: ' + errors.join(' | '));

    // Missing lessons get a specific recovery message instead of an empty catalogue.
    const missingContext = await browser.newContext();
    const missingPage = await missingContext.newPage();
    await missingPage.route('**/web/lessons.js', route => route.fulfill({status: 200, contentType: 'text/javascript', body: ''}));
    await missingPage.goto(base + '/demo.html');
    await missingPage.locator('#blocker').filter({hasText: 'lessons did not load'}).waitFor();
    assert.equal(await missingPage.locator('#start-learning').isDisabled(), true);
    await missingContext.close();
    console.log('browser checks passed');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
