'use strict';
// Browser demo. No AI, no node and no network requests.
//
// The ready-made experiments replay results that were recorded from real runs
// of the lab (see demo-data.js). Nothing here pretends to write code: a typed
// request is refused with an explanation, because inventing a plausible result
// for it would teach the wrong thing.
(() => {
const key = 'vibes-browser-demo-v3';
const base = 'b17c01a0000000000000000000000000000000000000';
const lessons = window.VibesLessons || {curated: []};
const recorded = window.VibesDemoData || {};

const initial = () => ({experiments: [], records: {}, job: null, learning: []});
let data;
try {
  data = JSON.parse(localStorage.getItem(key) || 'null');
} catch {
  data = null;
}
if (!data?.records) data = initial();

const clone = value => JSON.parse(JSON.stringify(value));
function persist() {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* storage unavailable: the demo still works for this visit */ }
}

function status() {
  return {
    chain: 'regtest', branch: 'demo', source: base, dirty: false, engine: 'demo',
    chain_note: lessons.networks?.regtest || '',
    engine_ready: {ok: true}, binary: true,
    agent: {model: 'none', turns: 0, minutes: 0},
    node: {running: true, health: 'healthy', blocks: 0, peers: 0, revision: base, wallet: false, listening: false, alerts: []},
    build: {sha: base, verified: true, unit_failures: [], compare: {verdict: 'identical', headline: 'Same rules as the unmodified node'}},
    baseline: {sha: base},
    sandbox: {kind: 'demo', contained: true, label: 'Not applicable in the demo', detail: 'The real lab compiles and runs every proposal inside an operating-system sandbox.'},
    reference: {ready: true, sha: base},
    variants: {'double-reward': true, 'halve-reward': true, 'faster-halving': true},
    activation_block: '', upstream: {}, update: {known: false},
    job: data.job, experiments: data.experiments, vibes: [],
  };
}

function runCurated(body) {
  const item = lessons.curated.find(entry => entry.id === body.id);
  let result = recorded[body.id];
  if (item?.slider) {
    // Recorded at several shares; replay the nearest one to what was asked for.
    const shares = Object.keys(recorded).filter(name => name.startsWith(body.id + '@')).map(name => Number(name.split('@')[1]));
    const nearest = shares.sort((a, b) => Math.abs(a - body.share) - Math.abs(b - body.share))[0];
    result = recorded[`${body.id}@${nearest}`];
  }
  if (!item || !result) throw new Error('This experiment has no recorded result in the demo.');
  const id = Math.floor(Date.now() / 1000) + '-' + Array.from(crypto.getRandomValues(new Uint8Array(3)), n => n.toString(16).padStart(2, '0')).join('');
  const scene = item.kind === 'scene';
  const job = {
    id, time: Date.now() / 1000, kind: scene ? 'scene' : 'vibe', prompt: item.title, state: 'done',
    curated: item.id, prediction: body.prediction || null, origin: 'curated',
    build_status: scene ? 'not run' : 'passed', test_status: scene ? 'passed' : result.unit_failures?.length ? 'findings' : 'passed',
    unit_failures: result.unit_failures || [], activation: 'not activated',
    compare: result.compare, compare_verdict: result.compare.headline,
    explanation: item.summary, patch: result.patch || '', files: result.files || [],
    risk: result.risk || [], sensitive: result.sensitive || [],
    evidence: scene ? [] : [
      {name: 'Compiled', status: 'passed', detail: 'Recorded from a real run.'},
      {name: 'Bitcoin Core unit tests', status: result.unit_failures?.length ? 'failed' : 'passed',
       detail: result.unit_failures?.length ? `${result.unit_failures.length} no longer pass: ${result.unit_failures.join(', ')}` : ''},
      {name: 'Compared with an unmodified node', status: 'passed', detail: result.compare.headline},
    ],
  };
  const events = [
    {t: 'phase', name: 'test', detail: 'Replaying a result recorded from a real run of the lab', seq: 1, ts: job.time},
    {t: 'log', line: 'Recorded with two real nodes on a throwaway private chain. Block hashes in your own run will differ.', seq: 2, ts: job.time},
    {t: 'phase', name: 'done', seq: 3, ts: job.time},
  ];
  data.records[id] = {summary: job, events};
  data.experiments.unshift({id, time: job.time, kind: job.kind, prompt: job.prompt, state: 'done', curated: item.id,
                            build_status: job.build_status, compare_verdict: job.compare_verdict});
  data.job = data.experiments[0];
  persist();
  return {job: clone(job)};
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
    return {summary: {prediction: tally('prediction'), followup: tally('followup'), before: tally('before'), after: tally('after')},
            beliefs, entries: clone(data.learning)};
  }
  let correct;
  let name = body.experiment;
  if (['before', 'after'].includes(body.stage)) {
    const belief = (lessons.beliefs || []).find(entry => entry.id === body.experiment);
    if (!belief) throw new Error('Unknown statement');
    correct = body.choice === String(belief.truth);
  } else {
    const item = lessons.curated.find(entry => entry.id === body.experiment);
    if (!item) throw new Error('Unknown experiment');
    name = item.id;
    if (body.stage === 'followup') {
      correct = body.choice === item.followup.answer;
    } else if (item.answer_by_share) {
      const share = data.records[body.job]?.summary.compare?.share || 0;
      correct = body.choice === (share > item.answer_by_share.line ? item.answer_by_share.above : item.answer_by_share.below);
    } else {
      correct = body.choice === item.answer;
    }
  }
  data.learning.push({experiment: name, stage: body.stage, choice: body.choice, correct});
  persist();
  return {correct};
}

const REAL_ONLY = 'The browser demo has no AI and no node, so it cannot do this. Try a ready-made experiment, which replays a result recorded from a real run, or install the lab to run your own.';

async function api(path, body) {
  const url = new URL(path, 'https://demo.invalid');
  switch (url.pathname) {
    case '/api/status':
      return status();
    case '/api/experiment': {
      const record = data.records[url.searchParams.get('id')];
      if (!record) throw new Error('Experiment not found');
      return clone(record);
    }
    case '/api/curated':
      return runCurated(body);
    case '/api/learning':
      return learning(body);
    case '/api/settings':
      if (body) throw new Error(REAL_ONLY);
      return {groups: [{id: 'relay', title: 'What your node relays', blurb: 'In the real lab this list is read from the node itself.'}],
              schema: [{key: 'datacarriersize', group: 'relay', label: 'Largest data payload', type: 'int', min: 0, max: 1000000, unit: 'bytes', default: 100000,
                        help: 'The number the 2025 relay dispute was about.',
                        tip: 'Relay policy: it governs what crosses your node, and your node accepts the same blocks whatever you choose.'}],
              values: {datacarriersize: 100000}};
    case '/api/diff':
      return {patch: ''};
    case '/api/node-log':
      return {log: 'The browser demo runs no node.'};
    default:
      throw new Error(REAL_ONLY);
  }
}

window.VibesDemo = {
  api,
  reset() {
    data = initial();
    persist();
  },
};
})();
