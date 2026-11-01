'use strict';
// A local replay of recorded node observations. No node, AI or API requests.
(() => {
const key = 'vibes-browser-demo-v4';
const lessons = window.VibesLessons || {curated: [], beliefs: []};
const recorded = window.VibesDemoData || {};
const clone = value => JSON.parse(JSON.stringify(value));
const initial = () => ({experiments: [], records: {}, job: null, learning: []});
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const strings = value => Array.isArray(value) && value.every(item => typeof item === 'string');
function validRecord(record) {
  if (!isObject(record) || !isObject(record.summary) || !Array.isArray(record.events)) return false;
  const job = record.summary;
  if (typeof job.id !== 'string' || typeof job.prompt !== 'string' || !Number.isFinite(job.time) || job.state !== 'done') return false;
  if (!isObject(job.compare) || typeof job.compare.verdict !== 'string' || typeof job.compare.headline !== 'string' || !Array.isArray(job.compare.rows)) return false;
  if (!job.compare.rows.every(row => isObject(row) && ['title', 'plain', 'status'].every(field => typeof row[field] === 'string'))) return false;
  const picture = job.compare.picture;
  if (picture && (!isObject(picture) || !Array.isArray(picture.lanes) || !picture.lanes.every(lane =>
    isObject(lane) && Array.isArray(lane.blocks) && lane.blocks.every(block =>
      isObject(block) && typeof block.kind === 'string' && typeof block.state === 'string')))) return false;
  return Array.isArray(job.files) && job.files.every(file => isObject(file) && typeof file.path === 'string') &&
    strings(job.risk) && strings(job.sensitive) && strings(job.unit_failures) && Array.isArray(job.evidence) && job.evidence.every(isObject) && record.events.every(isObject);
}
let data;
let earlierRecord = null;
try {
  const previous = JSON.parse(localStorage.getItem('vibes-browser-demo-v3') || 'null');
  if (isObject(previous)) earlierRecord = previous;
} catch { /* An unreadable earlier version does not affect the current visit. */ }
try {
  const saved = JSON.parse(localStorage.getItem(key) || 'null');
  if (isObject(saved) && isObject(saved.records) && Array.isArray(saved.experiments) && Array.isArray(saved.learning) &&
      Object.values(saved.records).every(validRecord) && saved.experiments.every(job => isObject(job) && typeof job.id === 'string' && Object.hasOwn(saved.records, job.id)) &&
      saved.learning.every(entry => isObject(entry) && typeof entry.experiment === 'string' && typeof entry.choice === 'string' && typeof entry.correct === 'boolean' && ['prediction', 'followup', 'before', 'after'].includes(entry.stage))) data = saved;
} catch { /* Damaged or inaccessible storage starts a usable, empty visit. */ }
if (!data) data = initial();
if (!data.job || !Object.hasOwn(data.records, data.job.id)) data.job = data.experiments[0] || null;
let storageAvailable = true;
function persist() {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    storageAvailable = true;
  } catch { storageAvailable = false; }
}

function status() {
  return {
    chain: 'regtest', branch: 'recorded demo', source: null, dirty: false, engine: 'demo',
    chain_note: lessons.networks?.regtest || '', engine_ready: {ok: true}, binary: false,
    agent: {model: 'none', turns: 0, minutes: 0},
    node: {running: false, health: 'stopped', alerts: []}, build: {}, baseline: {},
    sandbox: {kind: 'demo', contained: false, label: 'No code runs in the demo', detail: ''},
    reference: {ready: false}, variants: {}, activation_block: '', upstream: {}, update: {known: false},
    storage_available: storageAvailable,
    job: data.job, experiments: data.experiments, vibes: [],
  };
}

function runCurated(body = {}) {
  const item = lessons.curated.find(entry => entry.id === body.id);
  if (!item) throw new Error('Unknown experiment.');
  let result = recorded[item.id];
  if (item.slider) {
    const share = Number(body.share ?? item.slider.value);
    if (!Number.isInteger(share) || share < item.slider.min || share > item.slider.max || (share - item.slider.min) % item.slider.step) throw new Error('Choose a share on the slider.');
    result = recorded[`${item.id}@${share}`];
  }
  if (!result) throw new Error('There is no recording for this exact setting. Choose another share or install the lab to run it.');
  const options = item.kind === 'scene' ? item.options : lessons.prediction.options;
  if (body.prediction && body.prediction !== 'unsure' && !options.some(option => option.id === body.prediction)) throw new Error('Unknown prediction.');
  const id = Math.floor(Date.now() / 1000) + '-' + Array.from(crypto.getRandomValues(new Uint8Array(3)), n => n.toString(16).padStart(2, '0')).join('');
  const scene = item.kind === 'scene';
  const tested = Array.isArray(result.unit_failures);
  const ready = !!result.ready_made;
  const job = {
    id, time: Date.now() / 1000, kind: scene ? 'scene' : 'ready', prompt: item.title, state: 'done',
    curated: item.id, prediction: body.prediction || null, origin: 'curated',
    build_status: result.build_status || (scene || ready ? 'not run' : 'passed'),
    test_status: result.test_status || (scene || !tested ? 'not run' : result.unit_failures.length ? 'findings' : 'passed'),
    ready_made: ready,
    unit_failures: result.unit_failures || [], activation: 'not activated',
    compare: clone(result.compare), compare_verdict: result.compare.headline,
    explanation: item.summary, patch: result.patch || '', files: result.files || [],
    risk: result.risk || [], sensitive: result.sensitive || [],
    evidence: scene ? [] : [
      {name: ready ? 'Ready-made node' : 'Compiled', status: 'passed', detail: ready ? 'The recorded run used a node built from the change shown below.' : 'Recorded from a real run; no build runs in your browser.'},
      {name: 'Bitcoin Core unit tests', status: !tested ? 'skipped' : result.unit_failures.length ? 'failed' : 'passed',
       detail: !tested ? 'Not recorded.' : result.unit_failures.length ? `${result.unit_failures.length} no longer pass: ${result.unit_failures.join(', ')}` : 'Recorded from a real run.'},
      {name: 'Compared with an unmodified node', status: result.compare.verdict === 'inconclusive' ? 'skipped' : 'passed', detail: result.compare.headline},
    ],
  };
  const events = [
    {t: 'phase', name: 'test', detail: 'Showing observations recorded from a real run of the lab', seq: 1, ts: job.time},
    {t: 'log', line: 'Recorded with two real nodes on a throwaway private chain. No node runs in this browser.', seq: 2, ts: job.time},
    {t: 'phase', name: 'done', seq: 3, ts: job.time},
  ];
  data.records[id] = {summary: job, events};
  data.experiments.unshift({id, time: job.time, kind: job.kind, prompt: job.prompt, state: 'done', curated: item.id,
                            build_status: job.build_status, compare_verdict: job.compare_verdict});
  data.job = data.experiments[0];
  persist();
  return {job: clone(job)};
}

function recordAnswer(entry) {
  // A retry or another page render cannot turn one answer into several attempts.
  const previous = data.learning.find(row => row.stage === entry.stage &&
    (entry.job ? row.job === entry.job : row.experiment === entry.experiment));
  if (previous) return previous;
  data.learning.push(entry);
  return entry;
}

function beliefAnswer(stage, experiment, choice) {
  const belief = lessons.beliefs.find(entry => entry.id === experiment);
  if (!belief || !['true', 'false', 'unsure'].includes(choice)) throw new Error('Unknown statement or answer.');
  return {experiment, stage, choice, correct: choice === String(belief.truth)};
}

function learning(body) {
  if (!body) {
    const tally = stage => {
      const rows = data.learning.filter(entry => entry.stage === stage);
      return {answered: rows.length, correct: rows.filter(entry => entry.correct).length};
    };
    const beliefs = {};
    for (const entry of data.learning) {
      if (!['before', 'after'].includes(entry.stage)) continue;
      beliefs[entry.experiment] = {...beliefs[entry.experiment], [entry.stage]: {choice: entry.choice, correct: entry.correct}};
    }
    return {summary: {prediction: tally('prediction'), followup: tally('followup'), before: tally('before'), after: tally('after')}, beliefs, entries: clone(data.learning)};
  }
  const stage = body.stage;
  if (['before', 'after'].includes(stage)) {
    const beforeComplete = lessons.beliefs.every(belief => data.learning.some(entry => entry.experiment === belief.id && entry.stage === 'before'));
    if (stage === 'after' && !beforeComplete) throw new Error('Save your first answers before your second answers.');
    if (Array.isArray(body.answers)) {
      if (body.answers.length !== lessons.beliefs.length || new Set(body.answers.map(answer => answer?.experiment)).size !== lessons.beliefs.length) throw new Error('Answer every statement once.');
      const entries = body.answers.map(answer => beliefAnswer(stage, answer.experiment, answer.choice));
      entries.forEach(recordAnswer);
      persist();
      return {ok: true};
    }
    const saved = recordAnswer(beliefAnswer(stage, body.experiment, body.choice));
    persist();
    return {correct: saved.correct, choice: saved.choice};
  }
  if (!['prediction', 'followup'].includes(stage)) throw new Error('Unknown answer stage.');
  const item = lessons.curated.find(entry => entry.id === body.experiment);
  const job = Object.hasOwn(data.records, body.job || '') && data.records[body.job].summary;
  if (!item || !job || job.state !== 'done' || job.curated !== item.id || job.compare?.verdict === 'inconclusive') throw new Error('Choose a completed, matching experiment.');
  const options = stage === 'followup' ? item.followup.options : item.kind === 'scene' ? item.options : lessons.prediction.options;
  if (!options.some(option => option.id === body.choice)) throw new Error('Unknown answer.');
  const expected = stage === 'followup' ? item.followup.answer : item.kind === 'scene' ? job.compare.observed_answer : job.compare.verdict === 'identical' ? 'none' : job.compare.verdict;
  if (!expected || (stage === 'prediction' && body.choice !== job.prediction)) throw new Error('That prediction cannot be scored.');
  const saved = recordAnswer({experiment: item.id, job: job.id, stage, choice: body.choice, correct: body.choice === expected});
  persist();
  return {correct: saved.correct, choice: saved.choice};
}

const REAL_ONLY = 'This needs the installed lab. The browser demo only replays the ready-made experiments.';
async function api(path, body) {
  const url = new URL(path, 'https://demo.invalid');
  switch (url.pathname) {
    case '/api/status': return status();
    case '/api/experiment': {
      const id = url.searchParams.get('id');
      if (!Object.hasOwn(data.records, id)) throw new Error('Experiment not found');
      return clone(data.records[id]);
    }
    case '/api/curated': return runCurated(body);
    case '/api/learning': return learning(body);
    case '/api/earlier-record':
      if (!earlierRecord) throw new Error('No earlier demo record is available.');
      return clone(earlierRecord);
    case '/api/diff': return {patch: ''};
    case '/api/node-log': return {log: 'The browser demo runs no node.'};
    default: throw new Error(REAL_ONLY);
  }
}
window.VibesDemo = {api, hasEarlierRecord: !!earlierRecord, reset() { data = initial(); persist(); }};
})();
