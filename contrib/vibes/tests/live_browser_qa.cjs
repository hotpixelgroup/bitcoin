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

    // Only explicitly allowed fields enter a public report, even when status
    // contains local paths, provider details or other private metadata.
    let malformedReportFields = false;
    await page.route('**/api/status', async route => {
      const response = await route.fetch();
      const state = await response.json();
      await route.fulfill({response, json: {...state, branch: 'PRIVATE-BRANCH', private: 'PRIVATE-STATUS',
        ...(malformedReportFields ? {source: '/Users/PRIVATE-SOURCE', chain: 'PRIVATE-CHAIN', node: {...state.node, health: 'PRIVATE-HEALTH'}} : {}),
        sandbox: {...state.sandbox, detail: '/Users/PRIVATE-PATH/wallet.dat', ...(malformedReportFields ? {contained: 'PRIVATE-SANDBOX'} : {})},
        agent: {...state.agent, private: 'PRIVATE-PROVIDER'}}});
    });
    await page.reload();
    await page.locator('#connection').filter({hasText: 'Connected'}).waitFor();
    await page.locator('#learning-view').selectOption('lab');
    await page.locator('#wish').fill('PRIVATE-PROMPT');
    await page.locator('#prepare-report').click();
    const report = await page.locator('#report-context').inputValue();
    assert.match(report, /Mode: Installed local console/);
    assert.match(report, /Source commit: [a-f0-9]{40}/);
    assert.match(report, /Network: regtest/);
    assert.match(report, /Sandbox: Not contained/);
    assert.match(report, /Node health: stopped/);
    assert.doesNotMatch(report, /PRIVATE|wallet\.dat|vibekey|127\.0\.0\.1|https?:/);
    assert.ok(!report.includes(config.key), 'the session access key is excluded');
    malformedReportFields = true;
    await page.reload();
    await page.locator('#connection').filter({hasText: 'Connected'}).waitFor();
    await page.locator('#prepare-report').click();
    const malformed = await page.locator('#report-context').inputValue();
    for (const label of ['Source commit', 'Network', 'Sandbox', 'Node health']) assert.match(malformed, new RegExp(label + ': Unavailable'));
    assert.doesNotMatch(malformed, /PRIVATE/);
    await page.unroute('**/api/status');
    await page.reload();
    await page.locator('#connection').filter({hasText: 'Connected'}).waitFor();
    await page.locator('#wish').fill('');

    // Polling must not repeatedly announce the connected live region while a
    // learner is reading. Observe real DOM mutations across two HTTP polls.
    await page.evaluate(() => {
      window.connectionMutations = 0;
      window.connectionObserver = new MutationObserver(changes => { window.connectionMutations += changes.length; });
      window.connectionObserver.observe(document.getElementById('connection'), {childList: true, characterData: true, subtree: true});
    });
    for (let polls = 0; polls < 2; polls++) {
      const response = await page.waitForResponse(response => new URL(response.url()).pathname === '/api/status', {timeout: 15000});
      await response.finished();
    }
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
    assert.equal(await page.evaluate(() => window.connectionMutations), 0, 'unchanged connection state must not repeat live-region announcements');
    assert.equal(await page.locator('#connection').innerText(), 'Connected to the local console');
    await page.evaluate(() => window.connectionObserver.disconnect());
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
    await page.locator('#learning-view').selectOption('learning');
    assert.equal(await page.locator('#composer').isVisible(), false);
    await page.locator('#refine').click();
    assert.equal(await page.locator('#learning-view').inputValue(), 'lab', 'refining a result reveals its editor');
    assert.equal(await page.locator('#composer').isVisible(), true);
    assert.equal(await page.locator('#wish').inputValue(), 'Browser audit discarded note');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'wish');
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

    // An updated process cannot run more work with its old imported modules.
    // Keep a usable node in the response so these checks exercise the restart
    // guard rather than the fixture's deliberately missing node program.
    let nodeRunning = true;
    await page.route('**/api/status', async route => {
      const response = await route.fetch();
      const state = await response.json();
      await route.fulfill({response, json: {...state, console_restart_required: true, binary: true,
        node: {...state.node, running: nodeRunning, health: nodeRunning ? 'healthy' : 'stopped'}}});
    });
    await page.reload();
    await page.locator('#console-restart-notice').filter({hasText: 'Restart Bitcoin Vibes'}).waitFor();
    assert.match(await page.locator('#console-restart-notice').innerText(), /Reloading this browser page is not enough/);
    await page.locator('#wish').fill('A request prepared for after restart');
    for (const id of ['manifest', 'start-learning', 'build', 'restart', 'mine', 'mine-101', 'maturity',
                      'activate', 'update', 'save-settings', 'reference', 'restore', 'reset-chain', 'external-run']) {
      assert.equal(await page.locator('#' + id).isDisabled(), true, `${id} waits for a new console process`);
    }
    assert.equal(await page.locator('[data-curated]:enabled').count(), 0);
    assert.equal(await page.locator('#node-start').isEnabled(), true, 'an already-running node can still be stopped');
    assert.equal(await page.locator('.history-top button').first().isEnabled(), true, 'history remains readable');
    nodeRunning = false;
    await page.reload();
    await page.locator('#console-restart-notice').waitFor();
    assert.equal(await page.locator('#node-start').isDisabled(), true, 'starting a node needs a new console process');
    await page.unroute('**/api/status');
    await page.reload();
    await page.locator('#connection').filter({hasText: 'Connected'}).waitFor();
    assert.deepEqual(errors, []);
    fixture.kill('SIGTERM');
    await page.locator('#connection').filter({hasText: 'Offline'}).waitFor({timeout: 15000});
    assert.equal(await page.locator('#manifest').isDisabled(), true);
    console.log('live console browser checks passed (review, discard, apply, reload, history, mobile, restart required, offline)');
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
