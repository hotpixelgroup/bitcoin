// The real HTTP console, real cookies, real git worktrees and mock agent.
// No compiler, real funds, installed lab or paid AI session is involved.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const fixture = spawn(process.env.PYTHON || 'python3', [path.join(__dirname, 'serve_browser_fixture.py')], {stdio: ['ignore', 'pipe', 'pipe']});
  let diagnostics = '';
  fixture.stderr.on('data', chunk => { diagnostics += chunk; });
  const ready = new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error('Console did not start: ' + diagnostics)), 20000);
    fixture.stdout.on('data', chunk => {
      output += chunk;
      if (output.includes('\n')) {
        clearTimeout(timeout);
        try { resolve(JSON.parse(output.split('\n')[0])); } catch (error) { reject(error); }
      }
    });
    fixture.once('exit', code => { clearTimeout(timeout); reject(new Error(`Console exited (${code}): ${diagnostics}`)); });
  });
  let browser;
  try {
    const config = await ready;
    const launch = process.env.VIBES_BROWSER_CHANNEL ? {channel: process.env.VIBES_BROWSER_CHANNEL} : {};
    browser = await chromium.launch({...launch, headless: true});
    const context = await browser.newContext({viewport: {width: 1280, height: 900}, reducedMotion: 'reduce'});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    assert.equal((await context.request.get(config.url + '/api/status')).status(), 403);
    await page.goto(config.url + '/?key=' + config.key);
    await page.locator('#connection').filter({hasText: 'Connected'}).waitFor();
    assert.equal(new URL(page.url()).search, '', 'access key is removed from address bar');
    await page.locator('summary').filter({hasText: 'Build preferences and agent limits'}).click();
    await page.locator('#autobuild').uncheck();

    const propose = async prompt => {
      await page.locator('#wish').fill(prompt);
      await page.locator('#manifest').click();
      await page.locator('#prediction-none').check();
      await page.locator('#predict-run').click();
      await page.locator('#job-state').filter({hasText: 'Waiting for your review'}).waitFor();
      assert.match(await page.locator('#diff').textContent(), new RegExp(prompt));
      assert.ok(!fs.readFileSync(path.join(config.repo, 'doc/vibes.md'), 'utf8').includes(prompt), 'review does not apply source edits');
    };
    await propose('Browser audit discarded note');
    await page.locator('#cancel').click();
    await page.locator('#confirm-action').click();
    await page.locator('#job-state').filter({hasText: 'Cancelled'}).waitFor();
    await propose('Browser audit saved note');
    await page.locator('#apply').click();
    await page.locator('#confirm-action').click();
    await page.locator('#job-state').filter({hasText: 'Finished'}).waitFor();
    assert.match(fs.readFileSync(path.join(config.repo, 'doc/vibes.md'), 'utf8'), /Browser audit saved note/);
    assert.equal(await page.locator('#outcome-build').innerText(), 'Not run');
    assert.equal(await page.locator('#outcome-compare').innerText(), 'Not run');
    await page.reload();
    await page.locator('.history-row').nth(1).waitFor();
    assert.equal(await page.locator('.history-row').count(), 2);
    await page.locator('.history-top button').filter({hasText: 'Browser audit discarded note'}).click();
    await page.locator('#job-state').filter({hasText: 'Cancelled'}).waitFor();
    assert.equal(await page.locator('#apply').isVisible(), false, 'old history cannot be applied');

    for (const width of [768, 390, 320]) {
      await page.setViewportSize({width, height: 900});
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `live console overflow at ${width}px`);
    }
    assert.deepEqual(errors, []);
    fixture.kill('SIGTERM');
    await page.locator('#connection').filter({hasText: 'Offline'}).waitFor({timeout: 15000});
    assert.equal(await page.locator('#manifest').isDisabled(), true);
    console.log('live console browser checks passed (review, discard, apply, reload, history, mobile, offline)');
  } finally {
    if (browser) await browser.close();
    if (fixture.exitCode === null) fixture.kill('SIGTERM');
    await new Promise(resolve => {
      if (fixture.exitCode !== null) return resolve();
      const force = setTimeout(() => { fixture.kill('SIGKILL'); resolve(); }, 5000);
      fixture.once('exit', () => { clearTimeout(force); resolve(); });
    });
  }
})().catch(error => { console.error(error); process.exit(1); });
