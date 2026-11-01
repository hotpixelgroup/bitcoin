// First-launch guidance with real console assets/cookies and a disposable repo.
// Status responses model preparation outcomes; no node, build or AI is started.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const engines = (process.env.VIBES_FORM_ENGINES || 'chromium,webkit').split(',');
const output = process.env.VIBES_FIRST_LAUNCH_SCREENSHOT_DIR;
if (output) fs.mkdirSync(output, {recursive: true});

(async () => {
  const fixture = spawn(process.env.PYTHON || 'python3', [path.join(__dirname, 'serve_browser_fixture.py')], {stdio: ['ignore', 'pipe', 'pipe']});
  let diagnostics = '';
  fixture.stderr.on('data', chunk => { diagnostics += chunk; });
  try {
    const config = await new Promise((resolve, reject) => {
      let stdout = '';
      const timeout = setTimeout(() => reject(new Error('Console did not start: ' + diagnostics)), 20000);
      fixture.stdout.on('data', chunk => {
        stdout += chunk;
        if (stdout.includes('\n')) {
          clearTimeout(timeout);
          try { resolve(JSON.parse(stdout.split('\n')[0])); } catch (error) { reject(error); }
        }
      });
      fixture.once('error', error => { clearTimeout(timeout); reject(error); });
      fixture.once('exit', code => { clearTimeout(timeout); reject(new Error(`Console exited (${code}): ${diagnostics}`)); });
    });
    for (const engine of engines) {
      const launch = engine === 'chromium' && process.env.VIBES_BROWSER_CHANNEL ? {channel: process.env.VIBES_BROWSER_CHANNEL} : {};
      const browser = await playwright[engine].launch({...launch, headless: true});
      try {
        const page = await browser.newPage({viewport: {width: 390, height: 900}, reducedMotion: 'reduce'});
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const capture = async name => { if (output) await page.screenshot({path: path.join(output, engine + '-' + name + '.png'), animations: 'disabled'}); };
        let stage = 'loading';
        let release;
        const gate = new Promise(resolve => { release = resolve; });
        const job = {id: 'preparation-fixture', kind: 'setup', state: 'running', prompt: 'Prepare your node', time: 1,
          build_status: 'not run', test_status: 'not run'};
        await page.route('**/api/status', async route => {
          if (stage === 'loading') await gate;
          if (stage === 'offline') return route.fulfill({status: 503, json: {error: 'Simulated unavailable console'}});
          const response = await route.fetch();
          const state = await response.json();
          if (stage === 'working' || stage === 'failed') state.job = {...job, state: stage === 'failed' ? 'error' : 'running'};
          if (stage === 'ready') Object.assign(state, {binary: true, engine: 'claude', engine_ready: {ok: false, detail: 'Sign in to Claude Code to write custom requests.'}});
          await route.fulfill({response, json: state});
        });
        await page.route('**/api/experiment?id=preparation-fixture', route => route.fulfill({json: {
          summary: {...job, state: stage === 'failed' ? 'error' : 'running', error: stage === 'failed' ? 'Preparation could not finish. Check the activity details.' : ''},
          events: [{t: 'phase', name: 'build', detail: 'Preparing the node program'}],
        }}));
        await page.route('**/api/stream?*', route => route.fulfill({contentType: 'text/event-stream', body: ''}));
        await page.goto(config.url + '/?key=' + config.key);
        await page.locator('#readiness-title').filter({hasText: 'Connecting to your lab'}).waitFor();
        assert.equal(await page.locator('#readiness-action').isVisible(), false);
        assert.equal(await page.locator('#start-learning').isDisabled(), true);
        stage = 'missing'; release();
        await page.locator('#readiness-title').filter({hasText: 'Prepare a node'}).waitFor();
        assert.match(await page.locator('#readiness-copy').innerText(), /no node program is available/);
        await capture('missing-node');
        await page.locator('#readiness-action').click();
        assert.equal(await page.evaluate(() => document.activeElement.id), 'node-controls', 'setup guidance moves keyboard focus to node setup');
        assert.equal(await page.locator('#build').isEnabled(), true, 'setup has an available build action');

        for (const value of ['working', 'failed']) {
          stage = value;
          await page.reload();
          await page.locator('#readiness-title').filter({hasText: value === 'working' ? 'Preparing your lab' : 'Preparation needs attention'}).waitFor();
          assert.equal(await page.locator('#start-learning').isDisabled(), true);
          await capture(value === 'working' ? 'preparing' : 'preparation-failed');
          await page.locator('#readiness-action').click();
          assert.equal(await page.evaluate(() => document.activeElement.id), 'current', 'preparation guidance opens the actual activity');
          if (value === 'failed') {
            await page.evaluate(() => {
              window.preparationAnnouncements = 0;
              window.preparationObserver = new MutationObserver(() => { window.preparationAnnouncements++; });
              window.preparationObserver.observe(document.getElementById('job-error'), {childList: true, characterData: true, subtree: true});
            });
            for (let count = 0; count < 2; count++) await (await page.waitForResponse(response => new URL(response.url()).pathname === '/api/status')).finished();
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
            assert.equal(await page.evaluate(() => window.preparationAnnouncements), 0, 'unchanged preparation error is not repeatedly announced');
            await page.evaluate(() => window.preparationObserver.disconnect());
          }
        }

        stage = 'ready';
        await page.reload();
        await page.locator('#connection').filter({hasText: 'Connected'}).waitFor();
        assert.equal(await page.locator('#lab-readiness').isVisible(), false);
        assert.equal(await page.locator('#start-learning').isEnabled(), true, 'ready-made lessons work without an AI sign-in');
        await page.locator('#wish').fill('A custom request');
        assert.equal(await page.locator('#manifest').isDisabled(), true);
        assert.match(await page.locator('#composer-status').innerText(), /Claude Code/);
        await page.locator('#start-learning').click();
        await page.locator('#prediction-chain').waitFor();
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
        await capture('ready-without-ai');

        // All unchanged live regions stay quiet through two actual status polls.
        await page.evaluate(() => {
          window.repeatedAnnouncements = [];
          window.liveObservers = ['connection', 'journey-progress', 'composer-status', 'draft-status', 'node-alerts'].map(id => {
            const observer = new MutationObserver(() => window.repeatedAnnouncements.push(id));
            observer.observe(document.getElementById(id), {childList: true, characterData: true, subtree: true});
            return observer;
          });
        });
        for (let count = 0; count < 2; count++) await (await page.waitForResponse(response => new URL(response.url()).pathname === '/api/status')).finished();
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
        assert.deepEqual(await page.evaluate(() => window.repeatedAnnouncements), [], 'unchanged status is not repeatedly announced');
        await page.evaluate(() => window.liveObservers.forEach(observer => observer.disconnect()));
        stage = 'offline';
        await page.locator('#reconnect').waitFor();
        assert.match(await page.locator('#blocker').innerText(), /Cannot reach/);
        assert.equal(await page.locator('#start-learning').isDisabled(), true);
        stage = 'ready';
        await page.locator('#reconnect').click();
        await page.locator('#connection').filter({hasText: 'Connected'}).waitFor();
        assert.equal(await page.locator('#reconnect').isVisible(), false);
        assert.deepEqual(errors, []);
        console.log(engine + ': loading, missing program, preparation, failed preparation, ready without AI, quiet polling and offline retry passed');
      } finally { await browser.close(); }
    }
  } finally {
    fixture.kill('SIGTERM');
    const force = setTimeout(() => { if (fixture.exitCode === null) fixture.kill('SIGKILL'); }, 1000);
    force.unref();
    fixture.once('exit', () => clearTimeout(force));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
