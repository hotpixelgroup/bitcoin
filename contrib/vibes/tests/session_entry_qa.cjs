// Exercise real navigation and Strict-cookie rules in both browser engines.
// The disposable console uses no node, compiler, installed lab or paid agent.
const assert = require('node:assert/strict');
const path = require('node:path');
const {spawn} = require('node:child_process');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const fixture = spawn(process.env.PYTHON || 'python3', [path.join(__dirname, 'serve_browser_fixture.py')], {stdio: ['ignore', 'pipe', 'pipe']});
  let diagnostics = '';
  fixture.stderr.on('data', chunk => { diagnostics += chunk; });
  let browser;
  try {
    const config = await new Promise((resolve, reject) => {
      let output = '';
      const timer = setTimeout(() => reject(new Error('Entry fixture did not start: ' + diagnostics)), 20000);
      fixture.stdout.on('data', chunk => {
        output += chunk;
        if (output.includes('\n')) {
          clearTimeout(timer);
          try { resolve(JSON.parse(output.split('\n')[0])); } catch (error) { reject(error); }
        }
      });
      fixture.once('error', error => { clearTimeout(timer); reject(error); });
      fixture.once('exit', code => { clearTimeout(timer); reject(new Error(`Entry fixture exited (${code}): ${diagnostics}`)); });
    });
    for (const engine of ['chromium', 'webkit']) {
      const launch = engine === 'chromium' && process.env.VIBES_BROWSER_CHANNEL ? {channel: process.env.VIBES_BROWSER_CHANNEL} : {};
      browser = await playwright[engine].launch({...launch, headless: true});
      for (const mode of ['direct', 'cross-site', 'script-unavailable', 'cookies-blocked']) {
        const context = await browser.newContext({viewport: {width: 390, height: 844}});
        try {
          const page = await context.newPage();
          const errors = [];
          page.on('pageerror', error => errors.push(error.message));
          if (mode === 'script-unavailable') await page.route('**/web/session.js', route => route.abort());
          if (mode === 'cookies-blocked') await page.route(config.url + '/?*', async route => {
            const response = await route.fetch();
            const headers = {...response.headers()};
            delete headers['set-cookie'];
            // route.fetch shares the browser context's cookie jar.
            await context.clearCookies();
            await route.fulfill({response, headers});
          });
          const access = config.url + '/?key=' + config.key + '#curated';
          if (mode === 'direct' || mode === 'cookies-blocked') {
            await page.goto(access);
          } else {
            const origin = 'https://entry.example.test/';
            await page.route(origin, route => route.fulfill({contentType: 'text/html', body: '<!doctype html><html lang="en"><title>Entry test</title><a id="lab">Open local lab</a></html>'}));
            await page.goto(origin);
            await page.locator('#lab').evaluate((link, url) => { link.href = url; }, access);
            await page.locator('#lab').click();
          }
          if (mode === 'script-unavailable') {
            await page.locator('#session-open').waitFor();
            assert.equal((await context.cookies(config.url)).some(cookie => cookie.httpOnly && cookie.sameSite === 'Strict'), true);
            await page.locator('#session-open').click();
          }
          if (mode === 'cookies-blocked') {
            await page.getByRole('heading', {name: 'Open your lab with its access link'}).waitFor();
            assert.match(await page.locator('main').innerText(), /allow cookies/);
          } else {
            await page.locator('#connection').filter({hasText: 'Connected'}).waitFor();
            assert.equal(new URL(page.url()).search, '', `${engine}/${mode}: key removed`);
            if (mode !== 'script-unavailable') assert.equal(new URL(page.url()).hash, '#curated');
            const cookie = (await context.cookies(config.url)).find(cookie => cookie.name.startsWith('vibekey_'));
            assert.equal(cookie.httpOnly, true);
            assert.equal(cookie.sameSite, 'Strict');
            assert.equal(await page.evaluate(() => document.cookie), '', 'key is unavailable to page JavaScript');
            assert.equal((await context.request.get(config.url + '/api/status')).status(), 200);
          }
          assert.deepEqual(errors, [], `${engine}/${mode}: no script errors`);
        } finally { await context.close(); }
      }
      const denied = await browser.newContext();
      try {
        const page = await denied.newPage();
        const response = await page.goto(config.url + '/?key=wrong');
        assert.equal(response.status(), 403);
        await page.getByRole('heading', {name: 'Open your lab with its access link'}).waitFor();
        assert.equal((await denied.cookies()).length, 0);
        assert.equal((await denied.request.get(config.url + '/api/status')).status(), 403);
        assert.equal((await denied.request.post(config.url + '/api/node', {data: {action: 'start'}, headers: {'X-Vibe-Key': config.key, Origin: 'https://entry.example.test'}})).status(), 403);
        const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
        assert.equal(fits, true, 'access help fits the viewport');
      } finally { await denied.close(); }
      await browser.close(); browser = null;
      process.stdout.write(`${engine}: direct and cross-site entry, fallback, blocked cookies, wrong key and origin protection pass\n`);
    }
  } finally {
    if (browser) await browser.close();
    fixture.kill('SIGTERM');
    const force = setTimeout(() => { if (fixture.exitCode === null) fixture.kill('SIGKILL'); }, 3000);
    force.unref();
    if (fixture.pid && fixture.exitCode === null && fixture.signalCode === null) {
      await new Promise(resolve => fixture.once('exit', resolve));
    }
    clearTimeout(force);
  }
})().catch(error => { process.stderr.write(String(error.stack || error) + '\n'); process.exitCode = 1; });
