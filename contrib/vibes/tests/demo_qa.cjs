// Fast regression checks for the replay and learning API, without a browser.
// Uses the shipped lessons and recordings, so slider coverage cannot drift.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {webcrypto} = require('node:crypto');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const lessons = JSON.parse(execFileSync(process.env.PYTHON || 'python3', ['-c',
  'import json,sys;sys.path.insert(0,sys.argv[1]);from vibeslib import lessons;print(json.dumps(lessons.payload()))', root], {encoding: 'utf8'}));
const fixtureContext = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'web/demo-data.js'), 'utf8'), fixtureContext);
const fixtures = fixtureContext.window.VibesDemoData;
const source = fs.readFileSync(path.join(root, 'web/demo.js'), 'utf8');
function demo(saved, writeFails = false, recordings = fixtures, earlier = null) {
  let value = saved;
  const context = {window: {VibesLessons: structuredClone(lessons), VibesDemoData: structuredClone(recordings)}, URL, crypto: webcrypto,
    localStorage: {getItem(key) { return key === 'vibes-browser-demo-v3' ? JSON.stringify(earlier) : value; }, setItem(key, next) { if (writeFails) throw new Error('storage full'); value = next; }}};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'web/study.js'), 'utf8'), context);
  vm.runInNewContext(source, context);
  return {api: context.window.VibesDemo.api, saved: () => value};
}
(async () => {
  const d = demo();
  assert.equal((await d.api('/api/status')).node.running, false, 'demo must never claim a running node');
  let runs = 0;
  for (const item of lessons.curated) {
    const shares = item.slider ? Array.from({length: (item.slider.max - item.slider.min) / item.slider.step + 1}, (_, i) => item.slider.min + i * item.slider.step) : [null];
    for (const share of shares) {
      const fixture = fixtures[share === null ? item.id : `${item.id}@${share}`];
      assert.ok(fixture, `missing exact recording for ${item.id} ${share}`);
      const expected = item.kind === 'scene' ? fixture.compare.observed_answer : fixture.compare.verdict;
      assert.ok(expected && (item.kind === 'scene' ? item.options : lessons.prediction.options).some(option => option.id === expected), `${item.id} needs a scoreable observed outcome`);
      const {job} = await d.api('/api/curated', {id: item.id, share, prediction: expected});
      if (share !== null) assert.equal(job.compare.share, share, 'requested share must be the recorded share');
      const answer = {experiment: item.id, job: job.id, stage: 'prediction', choice: expected};
      assert.equal((await d.api('/api/learning', answer)).correct, true);
      await d.api('/api/learning', answer);
      const followup = {experiment: item.id, job: job.id, stage: 'followup', choice: item.followup.answer};
      assert.equal((await d.api('/api/learning', followup)).correct, true);
      await d.api('/api/learning', followup);
      runs++;
    }
  }
  const summary = await d.api('/api/learning');
  const round = (await d.api('/api/study')).round;
  const practice = {stage: 'practice', experiment: 'utxos', question: 'utxo-sum-1', choice: '0', round};
  assert.equal((await d.api('/api/study', practice)).entry.correct, false);
  assert.equal((await d.api('/api/study', {...practice, choice: '2'})).entry.choice, '0', 'the first daily practice answer is immutable');
  assert.equal((await d.api('/api/study')).entries.length, 1);
  const resumed = demo(d.saved());
  assert.equal((await resumed.api('/api/study')).entries[0].choice, '0');
  assert.equal((await resumed.api('/api/learning')).summary.followup.answered, runs, 'new practice storage preserves original scores');
  await assert.rejects(d.api('/api/study', {...practice, round: round - 1}), /new review day/);
  await assert.rejects(d.api('/api/study', {...practice, choice: {}}), /answers/);
  await assert.rejects(d.api('/api/study', {stage: 'reflection', experiment: 'utxos', job: 'missing', note: ''}), /matching/);
  assert.equal(summary.summary.prediction.answered, runs, 'repeated renders cannot duplicate prediction scores');
  assert.equal(summary.summary.followup.answered, runs, 'follow-up scores are idempotent per job');
  await assert.rejects(d.api('/api/curated', {id: 'power', share: 64}), /slider/);
  await assert.rejects(d.api('/api/learning', {experiment: 'keys', job: 'missing', stage: 'prediction', choice: 'chain'}), /matching/);
  await assert.rejects(d.api('/api/learning', {experiment: 'keys', stage: 'invented', choice: 'chain'}), /stage/);
  const no65 = structuredClone(fixtures);
  delete no65['power@65'];
  await assert.rejects(demo(null, false, no65).api('/api/curated', {id: 'power', share: 65}), /exact setting/);
  const inconclusive = structuredClone(fixtures);
  inconclusive.keys.compare.observed_answer = null;
  const unknown = demo(null, false, inconclusive);
  const {job} = await unknown.api('/api/curated', {id: 'keys', prediction: 'chain'});
  await assert.rejects(unknown.api('/api/learning', {experiment: 'keys', job: job.id, stage: 'prediction', choice: 'chain'}), /cannot be scored/);

  const beliefs = demo();
  const answers = lessons.beliefs.map(belief => ({experiment: belief.id, choice: String(belief.truth)}));
  await assert.rejects(beliefs.api('/api/learning', {stage: 'after', answers}), /first answers/);
  await assert.rejects(beliefs.api('/api/learning', {stage: 'before', answers: [...answers.slice(0, -1), {experiment: 'unknown', choice: 'true'}]}), /Unknown statement/);
  assert.equal((await beliefs.api('/api/learning')).entries.length, 0, 'a bad batch must save no partial answers');
  await beliefs.api('/api/learning', {stage: 'before', answers});
  await beliefs.api('/api/learning', {stage: 'before', answers});
  assert.equal((await beliefs.api('/api/learning')).entries.length, 10);
  await beliefs.api('/api/learning', {stage: 'after', answers});
  assert.equal((await beliefs.api('/api/learning')).summary.after.correct, 10);
  assert.equal((await demo(d.saved()).api('/api/learning')).summary.prediction.answered, runs, 'valid history survives reload');
  for (const saved of ['{', '[]', '{"records":[],"experiments":[],"learning":[]}', '{"records":{},"experiments":[null],"learning":[]}']) {
    assert.equal((await demo(saved).api('/api/status')).experiments.length, 0, 'damaged history must not break the demo');
  }
  const temporary = demo(null, true);
  await temporary.api('/api/curated', {id: 'keys'});
  assert.equal((await temporary.api('/api/status')).storage_available, false, 'storage failure must be visible');
  const earlier = {experiments: [{prompt: 'An earlier experiment'}], learning: []};
  assert.equal((await demo(null, false, fixtures, earlier).api('/api/earlier-record')).experiments[0].prompt, 'An earlier experiment', 'previous-version data remains exportable');
  console.log(`demo checks passed: ${runs} exact recordings, validated answers, atomic saves, retries and damaged storage`);
})().catch(error => { console.error(error); process.exit(1); });
