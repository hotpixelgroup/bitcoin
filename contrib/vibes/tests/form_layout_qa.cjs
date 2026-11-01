// Geometry and interaction checks for native form controls. The 200%-equivalent
// reflow cases halve the CSS viewport and double output pixel density. These
// verify enlarged layouts, rather than exercising a browser's own zoom UI.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = (process.env.VIBES_QA_URL || 'http://127.0.0.1:21880').replace(/\/$/, '');
const engines = (process.env.VIBES_FORM_ENGINES || 'chromium,webkit').split(',');
const output = process.env.VIBES_FORM_SCREENSHOT_DIR;
if (output) fs.mkdirSync(output, {recursive: true});
const sizes = [
  {name: 'desktop', width: 1440, height: 1100},
  {name: 'tablet', width: 768, height: 1024},
  {name: 'mobile', width: 390, height: 900},
  {name: 'narrow', width: 320, height: 900},
  {name: 'desktop-200', width: 720, height: 550, scale: 2},
  {name: 'mobile-200', width: 195, height: 450, scale: 2},
];
const failures = [];
let checked = 0;
let maximumDelta = 0;

async function measure(page, selector, name, settings = false) {
  const rows = await page.locator(selector).evaluateAll((labels, settings) => labels.map(label => {
    const input = settings ? document.getElementById(label.htmlFor) : label.querySelector('input');
    if (!input || !label.getClientRects().length) return null;
    const text = label.querySelector('span') || label;
    const walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode()) && !node.textContent.trim()) {}
    if (!node) return null;
    const offset = node.textContent.search(/\S/);
    const range = document.createRange();
    range.setStart(node, offset);
    range.setEnd(node, offset + 1);
    const rect = element => { const r = element.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}; };
    return {id:input.id,label:rect(label),input:rect(input),text:rect(range),textValue:label.innerText.slice(0,100)};
  }).filter(Boolean), settings);
  assert.ok(rows.length, name + ': no form controls found');
  for (const row of rows) {
    checked++;
    const center = box => box.y + box.height / 2;
    const delta = Math.abs(center(row.input) - center(row.text));
    maximumDelta = Math.max(maximumDelta,delta);
    if (delta > 3) failures.push(`${name} ${row.id}: control center differs from first text line by ${delta.toFixed(2)}px`);
    if (row.input.height < 14 || row.input.height > 24 || row.input.width < 14 || row.input.width > 24) failures.push(`${name} ${row.id}: native control box is ${row.input.width}×${row.input.height}px`);
    if (!settings && row.text.x < row.input.right + 3) failures.push(`${name} ${row.id}: answer text does not share the control's row`);
    if (row.label.height < 43.5) failures.push(`${name} ${row.id}: label target is only ${row.label.height.toFixed(1)}px high`);
  }
}
async function fieldsFit(page, name) {
  const overflow = await page.locator('fieldset.question:visible').evaluateAll(fields => fields.filter(field => {
    const rect=field.getBoundingClientRect();
    const parent=field.parentElement.getBoundingClientRect();
    return rect.right > parent.right + 1 || rect.left < parent.left - 1 || field.scrollWidth > field.clientWidth + 1;
  }).map(field => field.id || field.querySelector('legend')?.textContent.slice(0,50)));
  if (overflow.length) failures.push(`${name}: overflowing fieldsets: ${overflow.join(', ')}`);
  const dialogFits=await page.evaluate(()=>{
    const dialog=document.querySelector('dialog[open]');
    if(!dialog)return true;
    const rect=dialog.getBoundingClientRect();
    return rect.left>=-1 && rect.top>=-1 && rect.right<=innerWidth+1 && rect.bottom<=innerHeight+1;
  });
  if(!dialogFits)failures.push(`${name}: the dialog extends outside the viewport`);
}
async function capture(page, name) {
  if (output) await page.screenshot({path:path.join(output,name+'.png'),animations:'disabled'});
}
async function fixtureServer() {
  const proc=spawn(process.env.PYTHON || 'python3',[path.join(__dirname,'serve_browser_fixture.py')],{stdio:['ignore','pipe','pipe']});
  let diagnostics=''; proc.stderr.on('data',chunk=>{diagnostics+=chunk;});
  const config=await new Promise((resolve,reject)=>{
    let stdout='';
    const stop=()=>{
      proc.kill('SIGTERM');
      const force=setTimeout(()=>{if(proc.exitCode===null)proc.kill('SIGKILL');},1000);
      force.unref();
      proc.once('exit',()=>clearTimeout(force));
    };
    const timer=setTimeout(()=>{stop();reject(new Error('Form fixture did not start: '+diagnostics));},20000);
    proc.stdout.on('data',chunk=>{
      stdout+=chunk;
      if(stdout.includes('\n')){clearTimeout(timer);try{resolve(JSON.parse(stdout.split('\n')[0]));}catch(error){stop();reject(error);}}
    });
    proc.once('error',error=>{clearTimeout(timer);stop();reject(error);});
    proc.once('exit',code=>{clearTimeout(timer);reject(new Error(`Form fixture exited (${code}): ${diagnostics}`));});
  });
  return {proc,config};
}
(async()=>{
  let fixture;
  try {
    fixture=await fixtureServer();
    for(const engine of engines){
      assert.ok(playwright[engine],`Unknown browser engine: ${engine}`);
      const launch=engine==='chromium' && process.env.VIBES_BROWSER_CHANNEL ? {channel:process.env.VIBES_BROWSER_CHANNEL}:{};
      const browser=await playwright[engine].launch({...launch,headless:true});
      try {
        for(const size of sizes){
          const context=await browser.newContext({viewport:{width:size.width,height:size.height},deviceScaleFactor:size.scale||1,reducedMotion:'reduce'});
          try {
            const page=await context.newPage();
            const errors=[];page.on('pageerror',error=>errors.push(error.message));
            await page.goto(base+'/demo.html');
            const ids=await page.locator('[data-curated]').evaluateAll(buttons=>buttons.map(button=>button.dataset.curated));
            for(const id of ids){
              await page.locator(`[data-curated="${id}"]`).click();
              await measure(page,'#predict-options .choice',`${engine}/${size.name}/predict/${id}`);
              await fieldsFit(page,`${engine}/${size.name}/predict/${id}`);
              if(id==='keys'){
                await capture(page,`${engine}-${size.name}-prediction`);
                // Use the modal's native initial focus. In Safari, programmatic
                // focus after a pointer click intentionally keeps pointer-mode
                // focus heuristics, so that is not a keyboard-navigation test.
                await page.keyboard.press('ArrowDown');
                assert.equal(await page.locator('#prediction-chain').isChecked(),true,'arrow keys move to the next radio');
                assert.equal(await page.locator('#prediction-chain').evaluate(input=>input.matches(':focus') && getComputedStyle(input).outlineStyle!=='none' && parseFloat(getComputedStyle(input).outlineWidth)>=2),true,'keyboard focus stays visible');
                await page.locator('#predict-options .choice').first().locator('span').click();
                assert.equal(await page.locator('#prediction-gone').isChecked(),true,'clicking answer text selects its radio');
              }
              await page.keyboard.press('Escape');
            }
            await page.locator('[data-curated="keys"]').click();
            await page.locator('#prediction-chain').check();
            await page.locator('#predict-run').click();
            await page.locator('#lesson-text').waitFor();
            await measure(page,'#followup-options .choice',`${engine}/${size.name}/followup`);
            await page.locator('#beliefs-summary').click();
            await measure(page,'#beliefs-list .choice',`${engine}/${size.name}/questionnaire`);
            await fieldsFit(page,`${engine}/${size.name}/questionnaire`);
            assert.deepEqual(errors,[]);

            // The real console's preference and settings forms, without an AI
            // session, compiler or running node. No form is submitted.
            await page.route('**/api/status',async route=>{
              const response=await route.fetch();const state=await response.json();
              await route.fulfill({response,json:{...state,binary:true,variants:{'double-reward':true}}});
            });
            await page.goto(fixture.config.url+'/?key='+fixture.config.key);
            await page.locator('#connection').filter({hasText:'Connected'}).waitFor();
            await page.keyboard.press('Tab');
            await page.locator('summary').filter({hasText:'Build preferences and agent limits'}).press('Enter');
            await measure(page,'.checks label',`${engine}/${size.name}/preferences`);
            const checkbox=page.locator('#autobuild');
            await checkbox.press('Space');
            assert.equal(await checkbox.isChecked(),false,'Space toggles the checkbox');
            assert.equal(await checkbox.evaluate(input=>input.matches(':focus') && getComputedStyle(input).outlineStyle!=='none' && parseFloat(getComputedStyle(input).outlineWidth)>=2),true,'checkbox keyboard focus stays visible');
            await checkbox.locator('..').click();
            assert.equal(await checkbox.isChecked(),true,'checkbox label click toggles the preference');
            await page.locator('[data-curated="double-reward"]').click();
            await measure(page,'#predict-options .choice, #predict-compile-row',`${engine}/${size.name}/compile-choice`);
            await page.locator('#predict-compile').focus();
            await page.locator('#predict-compile').press('Space');
            assert.equal(await page.locator('#predict-compile').isChecked(),true,'compile checkbox keyboard works');
            await page.locator('#predict-compile-row span').click();
            assert.equal(await page.locator('#predict-compile').isChecked(),false,'compile checkbox label works');
            await capture(page,`${engine}-${size.name}-compile-choice`);
            await page.keyboard.press('Escape');
            await page.locator('#load-settings').click();
            await page.locator('#settings-fields input[type="checkbox"]').first().waitFor();
            await measure(page,'.setting:has(> input[type="checkbox"]) label',`${engine}/${size.name}/settings`,true);
            assert.deepEqual(errors,[]);
          } finally { await context.close(); }
        }
      } finally { await browser.close(); }
    }
    assert.equal(failures.length,0,failures.slice(0,30).join('\n')+(failures.length>30?`\n... ${failures.length} total failures`:''));
    console.log(`form layout checks passed: ${checked} control layouts, max first-line offset ${maximumDelta.toFixed(2)}px, ${engines.join('+')}, desktop/mobile/200%-equivalent reflow; label, keyboard and focus interactions`);
  } finally {
    if(fixture && fixture.proc.exitCode===null){
      fixture.proc.kill('SIGTERM');
      await new Promise(resolve=>{
        const timeout=setTimeout(()=>{fixture.proc.kill('SIGKILL');resolve();},5000);
        fixture.proc.once('exit',()=>{clearTimeout(timeout);resolve();});
      });
    }
  }
})().catch(error=>{console.error(error);process.exit(1);});
