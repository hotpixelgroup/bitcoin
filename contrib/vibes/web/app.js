'use strict';
// Bitcoin Vibes console page. Everything the page shows is set with
// textContent, never innerHTML: requests, agent output and lab results are
// all untrusted text.
(() => {
const $ = id => document.getElementById(id);
const demo = location.pathname.endsWith('demo.html') || new URLSearchParams(location.search).get('demo') === '1';
const lessons = window.VibesLessons || {prediction: {question: '', options: []}, verdicts: {}, networks: {}, groups: [], curated: [], beliefs: []};
const storageKey = demo ? 'vibes-demo-draft-v3' : 'vibes-draft-v3';

const examples = {
  Customize: [
    {title: 'A haiku for every block', prompt: 'Log a short haiku whenever a block is connected. Keep all validation and network behaviour unchanged.', effect: 'Logging only. Expect: no difference observed.'},
    {title: 'Friendlier startup log', prompt: 'When the node finishes starting, log one plain sentence saying which network it is on and how many blocks it has. Change nothing else.', effect: 'Logging only. Expect: no difference observed.'},
  ],
  Policy: [
    {title: 'Refuse large data by default', prompt: 'Change the default value of -datacarriersize to 83 bytes. Do not change any consensus rule.', effect: 'Relay policy. Expect: local policy only.'},
    {title: 'A higher fee floor', prompt: 'Raise the default minimum relay fee to ten times its current value. Do not change any consensus rule.', effect: 'Relay policy. Expect: local policy only.'},
  ],
  Consensus: [
    {title: 'Smaller blocks', prompt: 'Reduce the maximum block weight to 1,000,000 weight units and keep everything that depends on it consistent.', effect: 'Consensus. A stricter rule: which node gets left behind?'},
    {title: 'Spend new coins sooner', prompt: 'Reduce coinbase maturity from 100 blocks to 10.', effect: 'Consensus. The lab\'s checks may not exercise this: see what it reports.'},
  ],
};

let status = null;
let selectedId = null;
let selected = null;
let stream = null;
let streamId = null;
let streamSeq = 0;
let inflight = false;
let actionPending = false;
let lastSuccess = 0;
let toastTimer;
let settings = null;
let imported = null;        // {sender} while the draft holds someone else's request
let diffFilter = null;
let followupFor = null;
let beliefState = {};

// ----- small helpers ---------------------------------------------------------

const short = sha => sha ? sha.slice(0, 10) : 'Unknown';
const title = value => value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Not run';
const isBusy = () => actionPending || !!(status?.job && ['running', 'cancelling', 'review'].includes(status.job.state));

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node[key] = value;
    else node.setAttribute(key, value);
  }
  node.append(...children);
  return node;
}

function toast(message) {
  $('toast').textContent = message;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 6500);
}

function confirmAction(heading, copy, label = 'Continue') {
  const dialog = $('confirm-dialog');
  $('confirm-title').textContent = heading;
  $('confirm-copy').textContent = copy;
  $('confirm-action').textContent = label;
  return new Promise(resolve => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirm'), {once: true});
    dialog.returnValue = '';
    dialog.showModal();
  });
}

function remember(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch { /* storage unavailable: the page still works */ }
  return null;
}

async function api(path, body) {
  if (demo) return window.VibesDemo.api(path, body);
  const options = body !== undefined
    ? {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)}
    : {};
  const response = await fetch(path, {...options, signal: AbortSignal.timeout(30000)});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
  return result;
}

async function action(path, body) {
  if (actionPending) return;
  actionPending = true;
  updateControls();
  try {
    const result = await api(path, body);
    if (result.job) {
      selectedId = result.job.id;
      selected = null;
      closeStream();
      streamSeq = 0;
      $('current').scrollIntoView({behavior: 'smooth'});
    }
    await refresh();
  } catch (error) {
    toast(error.message);
  } finally {
    actionPending = false;
    updateControls();
  }
}

// ----- predictions -----------------------------------------------------------

function radioGroup(container, name, options) {
  container.replaceChildren();
  for (const option of options) {
    const input = el('input', {type: 'radio', name, value: option.id, id: `${name}-${option.id}`});
    container.append(el('label', {class: 'choice', for: input.id}, [input, el('span', {text: option.text})]));
  }
}

function chosen(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || null;
}

function optionText(options, id) {
  return options.find(option => option.id === id)?.text || id;
}

// Ask for a prediction. Resolves to {choice, share, compile}, where choice is
// '' if skipped, or to null if the operator cancelled.
function askPrediction(heading, summary, question, options, item) {
  const dialog = $('predict-dialog');
  $('predict-title').textContent = heading;
  $('predict-summary').textContent = summary;
  $('predict-question').textContent = question;
  radioGroup($('predict-options'), 'prediction', options);

  const slider = item?.slider;
  $('predict-slider').hidden = !slider;
  if (slider) {
    const input = $('predict-share');
    input.min = slider.min;
    input.max = slider.max;
    input.step = slider.step;
    input.value = remember('vibes-share') || slider.value;
    $('predict-share-label').textContent = slider.label;
    const show = () => { $('predict-share-value').textContent = input.value + slider.unit; };
    input.oninput = show;
    show();
  }

  const compilable = item?.kind === 'patch' && !demo;
  $('predict-compile-row').hidden = !compilable;
  if (compilable) {
    const ready = !!status?.variants?.[item.id];
    $('predict-compile').checked = false;
    $('predict-compile-text').textContent = ready
      ? 'Compile it myself instead. Slower, and it also runs Bitcoin Core\'s unit tests on the change.'
      : 'Compile it myself. Leave this unticked to look for a ready-made node published with your release; if there is none, tick it.';
  }

  return new Promise(resolve => {
    dialog.addEventListener('close', () => {
      if (dialog.returnValue !== 'confirm') {
        resolve(null);
        return;
      }
      const share = slider ? Number($('predict-share').value) : undefined;
      if (slider) remember('vibes-share', String(share));
      resolve({choice: chosen('prediction') || '', share, compile: compilable && $('predict-compile').checked});
    }, {once: true});
    dialog.returnValue = '';
    dialog.showModal();
  });
}

function curatedItem(job) {
  return lessons.curated.find(item => item.id === job.curated) || null;
}

// What was observed, expressed as one of the prediction's option ids.
function observedAnswer(job) {
  const item = curatedItem(job);
  if (item?.answer_by_share) {
    const rule = item.answer_by_share;
    return (job.compare?.share || 0) > rule.line ? rule.above : rule.below;
  }
  if (item?.kind === 'scene') return item.answer;
  const verdict = job.compare?.verdict;
  if (!verdict) return null;
  return verdict === 'identical' ? 'none' : verdict;
}

async function recordPrediction(job) {
  const flag = `vibes-recorded-${job.id}`;
  if (!job.prediction || job.prediction === 'unsure' || remember(flag)) return;
  remember(flag, '1');
  try {
    await api('/api/learning', {experiment: job.curated || '', job: job.id, stage: 'prediction', choice: job.prediction});
    refreshLearning();
  } catch { /* the lesson still shows; only the tally is missing */ }
}

async function refreshLearning() {
  try {
    const result = await api('/api/learning');
    const {prediction, followup} = result.summary;
    beliefState = result.beliefs || {};
    renderBeliefs();
    $('learning-summary').textContent = prediction.answered || followup.answered
      ? `Your record on this machine: ${prediction.correct} of ${prediction.answered} predictions right, ${followup.correct} of ${followup.answered} follow-up questions right.`
      : '';
  } catch { /* not essential */ }
}

// ----- ready-made experiments ------------------------------------------------

function renderCurated() {
  $('curated-grid').replaceChildren();
  for (const group of lessons.groups) {
    const items = lessons.curated.filter(item => item.group === group.id);
    if (!items.length) continue;
    const grid = el('div', {class: 'example-grid'});
    for (const item of items) {
      const button = el('button', {class: 'example', onclick: () => runCurated(item)}, [
        el('b', {text: item.title}),
        el('small', {text: item.summary}),
        el('small', {class: 'needs', text: item.needs}),
      ]);
      button.dataset.curated = item.id;
      grid.append(button);
    }
    $('curated-grid').append(el('h3', {text: group.title}), el('p', {class: 'subtle', text: group.blurb}), grid);
  }
}

async function runCurated(item) {
  if (isBusy()) {
    toast('Finish or discard the current experiment first.');
    return;
  }
  const answer = await askPrediction(item.title, item.summary, item.question, item.options, item);
  if (answer === null) return;
  action('/api/curated', {id: item.id, prediction: answer.choice, share: answer.share, compile: answer.compile});
}

// ----- before and after ----------------------------------------------------------

// The same ten statements are answered before any experiment and again later.
// Until the second round is saved the answers are not shown, so the second
// round measures what changed and not what was just read.
function renderBeliefs() {
  const answered = Object.keys(beliefState);
  const before = answered.length && answered.every(id => beliefState[id].before);
  const after = lessons.beliefs.length && lessons.beliefs.every(belief => beliefState[belief.id]?.after);
  $('beliefs-stage').textContent = after ? 'Answered before and after' : before ? 'First answers saved' : 'Not answered yet';
  $('beliefs-intro').textContent = after
    ? 'Your answers from before and after, with what the lab shows.'
    : before
      ? 'Your first answers are saved and hidden. Run a few experiments, then answer the same statements again to see what changed.'
      : 'Before you run anything, say what you think. You will be asked the same statements again later. Nothing is marked right or wrong until then, and your answers stay on this machine.';
  $('beliefs-summary').textContent = after ? 'What changed' : before ? 'Answer the ten statements again' : 'Ten statements: true or false?';
  $('beliefs-save').textContent = before ? 'Save my second answers' : 'Save my answers';
  $('beliefs-save').hidden = !!after;
  $('beliefs-list').replaceChildren();
  for (const belief of lessons.beliefs) {
    const state = beliefState[belief.id] || {};
    const row = el('fieldset', {class: 'question belief'});
    row.append(el('legend', {text: belief.statement}));
    if (after) {
      const word = choice => ({true: 'True', false: 'False', unsure: 'Not sure'})[choice] || 'No answer';
      const experiment = lessons.curated.find(item => item.id === belief.experiment);
      row.append(
        el('p', {class: state.after?.correct ? 'pass' : 'fail',
                 text: `Before: ${word(state.before?.choice)}. After: ${word(state.after?.choice)}. It is ${belief.truth ? 'true' : 'false'}.`}),
        el('p', {class: 'subtle', text: experiment ? `Shown by: ${experiment.title}` : ''}));
    } else {
      const group = el('div', {class: 'belief-options'});
      for (const [value, text] of [['true', 'True'], ['false', 'False'], ['unsure', 'Not sure']]) {
        const input = el('input', {type: 'radio', name: 'belief-' + belief.id, value, id: `belief-${belief.id}-${value}`});
        group.append(el('label', {class: 'choice', for: input.id}, [input, el('span', {text})]));
      }
      row.append(group);
    }
    $('beliefs-list').append(row);
  }
  if (after) {
    const count = stage => lessons.beliefs.filter(belief => beliefState[belief.id]?.[stage]?.correct).length;
    $('beliefs-status').textContent = `Right before: ${count('before')} of ${lessons.beliefs.length}. Right after: ${count('after')} of ${lessons.beliefs.length}.`;
  }
}

async function saveBeliefs() {
  const stage = lessons.beliefs.every(belief => beliefState[belief.id]?.before) ? 'after' : 'before';
  const answers = lessons.beliefs.map(belief => [belief.id, chosen('belief-' + belief.id)]);
  if (answers.some(([, choice]) => !choice)) {
    toast('Answer every statement first. "Not sure" is a fine answer.');
    return;
  }
  try {
    for (const [id, choice] of answers) await api('/api/learning', {experiment: id, stage, choice});
    await refreshLearning();
    if (stage === 'before') {
      $('beliefs-status').textContent = 'Saved. Now try an experiment or two.';
      $('beliefs-details').open = false;
    }
  } catch (error) {
    toast(error.message);
  }
}

async function exportLearning() {
  try {
    const record = await api('/api/learning');
    const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], {type: 'application/json'}));
    el('a', {href: url, download: 'bitcoin-vibes-learning-record.json'}).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    toast(error.message);
  }
}

// ----- composer --------------------------------------------------------------

function saveDraft() {
  const draft = {prompt: $('wish').value, mode: $('mode').value, autobuild: $('autobuild').checked,
                 autorestart: $('autorestart').checked, imported};
  remember(storageKey, JSON.stringify(draft));
  $('draft-status').textContent = $('wish').value ? 'Draft saved on this device' : '';
}

function loadDraft() {
  try {
    const draft = JSON.parse(remember(storageKey) || '{}');
    if (typeof draft.prompt === 'string') $('wish').value = draft.prompt;
    if (['review', 'auto'].includes(draft.mode)) $('mode').value = draft.mode;
    if (typeof draft.autobuild === 'boolean') $('autobuild').checked = draft.autobuild;
    if (typeof draft.autorestart === 'boolean') $('autorestart').checked = draft.autorestart;
    if (draft.imported && draft.prompt) imported = draft.imported;
  } catch { /* a damaged draft is simply ignored */ }
}

function renderImportedNote() {
  $('imported-note').hidden = !imported;
  if (!imported) return;
  const sender = imported.sender || {};
  const parts = ['This request came from someone else.'];
  if (sender.ts) parts.push(`They saved it on ${new Date(sender.ts * 1000).toLocaleDateString()}.`);
  if (sender.c?.length) parts.push(`Their console flagged it as touching: ${sender.c.join(', ')}.`);
  if (sender.f?.length) parts.push(`On their machine it changed: ${sender.f.map(file => file[0]).join(', ')}.`);
  parts.push('It will be handed to an AI agent as instructions, so it always stops for your review and is never applied or started automatically. Clear the box to write your own request instead.');
  $('imported-note').textContent = parts.join(' ');
}

function modeHelp() {
  const contained = demo || status?.sandbox?.contained !== false;
  $('mode').querySelector('[value="auto"]').disabled = !contained;
  if (!contained && $('mode').value === 'auto') $('mode').value = 'review';
  $('mode-help').textContent = !contained
    ? 'Automatic applying is off: this machine has no sandbox, so nothing is built or applied without your review.'
    : $('mode').value === 'auto'
      ? 'Applied without waiting only when it builds, every stock unit test passes, no text or test flag is raised, and the comparison finds no difference. Anything else waits for you.'
      : 'You read the change and the evidence, then decide.';
}

function renderExamples(category) {
  $('examples').replaceChildren();
  for (const example of examples[category]) {
    $('examples').append(el('button', {class: 'example', onclick: () => {
      $('wish').value = example.prompt;
      imported = null;
      renderImportedNote();
      saveDraft();
      updateControls();
      $('wish').focus();
    }}, [el('b', {text: example.title}), el('small', {text: example.effect})]));
  }
}

async function manifest() {
  const prompt = $('wish').value.trim();
  if (!prompt) return;
  const answer = await askPrediction('Make a prediction first', prompt.slice(0, 300),
                                     lessons.prediction.question, lessons.prediction.options);
  if (answer === null) return;
  const prediction = answer.choice;
  const auto = $('mode').value === 'auto' && !imported;
  action('/api/vibe', {
    prompt, prediction,
    review: !auto,
    autobuild: auto || $('autobuild').checked,
    autorestart: (auto || $('autorestart').checked) && !imported,
    origin: imported ? 'imported' : 'typed',
    sender: imported?.sender,
  });
}

// ----- the node card ---------------------------------------------------------

function renderNode(next) {
  $('environment').textContent = (demo ? 'DEMO · ' : '') + next.chain + ' · ' + next.branch;
  $('engine-label').textContent = demo ? 'No AI in the demo' : next.engine === 'mock' ? 'Mock engine (no AI)' : 'Claude Code';
  $('source').textContent = short(next.source);
  $('source-note').textContent = next.dirty ? 'Uncommitted edits: commit or stash them before experimenting' : 'Working tree clean';
  const build = next.build || {};
  $('built').textContent = build.sha ? short(build.sha) : build.path ? 'Installed build' : 'None yet';
  $('build-note').textContent = !build.verified
    ? (build.path ? 'As installed; not built or checked by this console' : 'Build and check first')
    : `Compiled · ${build.unit_failures?.length ? build.unit_failures.length + ' stock unit tests fail' : 'unit tests pass'} · ${build.compare?.headline || 'not compared'}`;
  $('running').textContent = next.node.running ? (next.node.revision ? short(next.node.revision) : 'Unrecorded build') : 'Stopped';
  $('node-summary').textContent = next.node.running
    ? `Block ${next.node.blocks ?? '…'} · ${next.node.peers ?? 0} peers · wallet ${next.node.wallet ? 'on' : 'off'} · incoming connections ${next.node.listening ? 'on' : 'off'}`
    : 'Start your node to use it';
  const health = {healthy: 'Running', syncing: 'Synchronising', starting: 'Starting', stopped: 'Stopped', diverged: 'Refused a block'};
  $('node-health').textContent = health[next.node.health] || title(next.node.health);
  $('node-health').className = 'pill ' + (next.node.health === 'healthy' ? 'good' : next.node.health === 'diverged' ? 'bad' : '');
  $('node-start').textContent = next.node.running ? 'Stop node' : 'Start node';
  $('chain-note').textContent = next.chain_note || '';

  $('node-alerts').replaceChildren();
  for (const alert of next.node.alerts || []) {
    $('node-alerts').append(el('div', {class: 'notice ' + (alert.level === 'danger' ? 'danger' : '')}, [
      el('b', {text: alert.title + '. '}), el('span', {text: alert.detail})]));
  }

  const sandbox = next.sandbox || {};
  $('sandbox-label').textContent = sandbox.label || 'Unknown';
  $('sandbox-label').className = sandbox.contained ? 'pass' : 'fail';
  $('sandbox-detail').textContent = sandbox.detail || '';

  const reference = next.reference || {};
  $('reference-label').textContent = reference.ready ? 'Ready' : reference.stale ? 'Out of date' : 'Not available yet';
  $('reference-label').className = reference.ready ? 'pass' : 'fail';
  $('reference-detail').textContent = reference.ready
    ? `Built from ${short(reference.sha)}. Every build that changes the node is compared with it.`
    : reference.stale
      ? 'Your baseline has moved since it was built. Prepare it again so builds can be compared.'
      : 'Without it a changed node has nobody to disagree with. The first build of unmodified source provides it.';
  $('reference').hidden = !!reference.ready || demo;

  $('activation-block').hidden = !next.activation_block;
  $('activation-block').textContent = next.activation_block || '';

  $('blocker').hidden = next.engine_ready.ok;
  $('blocker').textContent = next.engine_ready.ok ? '' : next.engine_ready.detail + (next.engine_ready.fix ? '\nFix: ' + next.engine_ready.fix : '');
  const agent = next.agent || {};
  $('agent-note').textContent = next.engine === 'claude'
    ? `The agent is Claude Code using the ${agent.model} model. It can read and edit files in its own copy of the source and do nothing else: no commands, no network. It stops after ${agent.turns} steps or ${agent.minutes} minutes. Your provider bills you for each request; the amount it reports is shown afterwards.`
    : 'The mock engine makes one harmless edit to the manual, so the workflow can be rehearsed without an AI.';

  const update = next.update || {};
  $('update-status').textContent = !update.known
    ? 'This copy has nothing to update from yet. Updating fetches from origin.'
    : update.available
      ? `${update.behind} newer commit(s) known at ${update.ref} · ${update.decrees || 0} saved experiment(s) of yours to replay`
      : `Current with ${update.ref} as of the last time you asked`;
  renderUpstream(next.upstream || {});
}

function renderUpstream(facts) {
  const parts = [];
  if (facts.commit) parts.push(`Built on Bitcoin Core ${short(facts.commit)} from ${facts.date}: a ${facts.kind || 'snapshot'}.`);
  if (typeof facts.core_ahead === 'number') parts.push(`Bitcoin Core's main line is ${facts.core_ahead.toLocaleString()} changes ahead of that.`);
  if (facts.core_release) parts.push(`Latest Bitcoin Core release: ${facts.core_release}.`);
  if (facts.vibes_release) parts.push(`Latest Bitcoin Vibes release: ${facts.vibes_release}.`);
  if (facts.checked) parts.push(`Checked ${new Date(facts.checked * 1000).toLocaleString()}.`);
  if (facts.error) parts.push(facts.error + '.');
  $('upstream-status').textContent = parts.join(' ');
}

function updateControls() {
  const busy = isBusy();
  const online = demo || (lastSuccess && Date.now() - lastSuccess < 15000);
  const engineOk = !!status?.engine_ready?.ok && !demo;
  $('manifest').disabled = busy || !online || !engineOk || !$('wish').value.trim();
  $('manifest').textContent = actionPending ? 'Starting…' : busy ? 'Experiment in progress' : 'Manifest ✦';
  for (const id of ['node-start', 'build', 'restart', 'mine', 'mine-101', 'maturity', 'activate', 'update',
                    'save-settings', 'reference', 'restore', 'reset-chain', 'external-run']) {
    $(id).disabled = busy || !online || demo;
  }
  document.querySelectorAll('[data-curated]').forEach(button => { button.disabled = busy || !online || (!demo && !status?.binary); });
  $('node-start').disabled ||= !status?.binary && !status?.node?.running;
  const blocked = !!status?.activation_block;
  $('activate').disabled ||= !status?.build?.verified || blocked;
  $('restart').disabled ||= !status?.build?.verified || !status?.node?.running || blocked;
  const regtest = status?.chain === 'regtest';
  const ready = regtest && ['healthy', 'syncing', 'diverged'].includes(status?.node?.health);
  $('mine').disabled ||= !ready;
  $('mine-101').disabled ||= !ready;
  $('maturity').disabled ||= !status?.binary;
  $('reset-chain').disabled ||= !regtest;
  $('playground-help').textContent = !regtest
    ? 'Blocks can be produced on demand only on the private regtest chain.'
    : ready ? 'These blocks exist only on your own node.' : 'Start your node to produce blocks.';
  const current = selected && status?.job?.id === selected.summary.id;
  $('apply').disabled = actionPending || !current || selected?.summary.state !== 'review' || !!status?.dirty;
  $('cancel').disabled = actionPending || selected?.summary.state === 'cancelling';
  $('retry').disabled = busy || !online;
  $('repair').disabled = busy || !online || !engineOk;
}

// ----- the current experiment ------------------------------------------------

function renderEvidence(rows) {
  $('evidence').replaceChildren();
  for (const row of rows || []) {
    const state = el('b', {
      class: row.status === 'passed' ? 'pass' : row.status === 'failed' ? 'fail' : 'subtle',
      text: row.status === 'passed' ? '✓ ' + row.name : row.status === 'failed' ? '✕ ' + row.name : '○ ' + row.name,
    });
    const detail = row.actual !== undefined
      ? `Expected ${JSON.stringify(row.expected)}, observed ${JSON.stringify(row.actual)}. ${row.detail || ''}`
      : row.detail || '';
    $('evidence').append(el('div', {class: 'evidence-row'}, [state, el('span', {class: 'value', text: detail})]));
  }
}

const READY_NOTE = 'This ran a ready-made node built from exactly the change shown below. Bitcoin Core\'s unit tests were not run on it; run the experiment again with "Compile it myself" to see which of them the change breaks.';

const ROW_LABELS = {
  compare: ['Unmodified node', 'Your node'],
  external: ['Unmodified node', 'The other program'],
  'relay-filter': ['Default node', 'Filtering node'],
  keys: ['Node A', 'Node B'],
  softfork: ['Upgraded node', 'Node on the old rules'],
  miners: ['Unmodified node', 'Rule-breaking miner'],
  power: ['Unmodified', 'Stricter'],
};

// Two chains drawn block by block: who produced each block, and which block a
// node refused. The same facts are in the text beside it for screen readers.
function renderPicture(picture) {
  const box = $('chain-picture');
  box.hidden = !picture;
  box.replaceChildren();
  if (!picture) return;
  for (const lane of picture.lanes) {
    const blocks = el('div', {class: 'chain-blocks', role: 'img', 'aria-label': `${lane.label}: ${lane.note}`});
    for (const block of lane.blocks) {
      blocks.append(el('span', {class: `blk ${block.kind} ${block.state}`, text: block.state === 'refused' ? '✕' : ''}));
    }
    box.append(el('div', {class: 'chain-lane'}, [
      el('span', {class: 'metric-label', text: lane.label}), blocks, el('small', {text: lane.note})]));
  }
  box.append(el('div', {class: 'chain-legend'}, [
    el('span', {class: 'blk shared kept'}), el('span', {text: 'shared'}),
    el('span', {class: 'blk stock kept'}), el('span', {text: 'unmodified rules'}),
    el('span', {class: 'blk changed kept'}), el('span', {text: 'changed rules'}),
    el('span', {class: 'blk changed refused', text: '✕'}), el('span', {text: 'refused'})]));
}

function renderComparison(job) {
  const compare = job.compare;
  $('comparison').hidden = !compare;
  if (!compare) return;
  const item = curatedItem(job);
  const scene = job.kind === 'scene';
  const verdict = lessons.verdicts[compare.verdict];
  $('verdict-title').textContent = scene ? compare.headline : verdict?.title || compare.headline;
  $('verdict-title').className = 'verdict ' + (['tightened', 'loosened', 'split'].includes(compare.verdict) ? 'differs' : '');
  $('verdict-meaning').textContent = scene ? '' : verdict?.meaning || '';
  $('verdict-meaning').hidden = scene;
  $('mainnet-heading').hidden = scene || !verdict;
  $('verdict-mainnet').hidden = scene || !verdict;
  $('verdict-mainnet').textContent = scene ? '' : verdict?.mainnet || '';

  const labels = ROW_LABELS[job.external ? 'external' : scene ? item?.id : 'compare'] || ['', ''];
  $('ready-note').hidden = !(job.ready_made || job.external);
  if (job.external) $('ready-note').textContent = 'In the rows below, "your node" means the other program you pointed the lab at.';
  else if (job.ready_made) $('ready-note').textContent = READY_NOTE;
  renderPicture(compare.picture);
  $('comparison-rows').replaceChildren();
  for (const row of compare.rows || []) {
    const badge = {same: '= Same', differs: '≠ Differs', skipped: '○ Skipped', error: '✕ Problem', info: '• Observed'}[row.status] || row.status;
    const sides = el('div', {class: 'cmp-sides'});
    for (const [label, value] of [[labels[0], row.reference], [labels[1], row.candidate]]) {
      if (value) sides.append(el('div', {}, [el('span', {class: 'metric-label', text: label}), el('span', {text: value})]));
    }
    $('comparison-rows').append(el('div', {class: 'cmp-row ' + row.status}, [
      el('div', {class: 'cmp-head'}, [el('b', {class: 'cmp-badge', text: badge}), el('span', {text: row.title})]),
      sides,
      el('p', {text: row.plain}),
    ]));
  }

  // Prediction against observation.
  const options = item?.kind === 'scene' ? item.options : lessons.prediction.options;
  if (job.external) {
    $('verdict-meaning').textContent = `This compared the unmodified node with ${job.external}. ` + (verdict?.meaning || '').replaceAll('Your node', 'The other program').replaceAll('your node', 'the other program');
  }
  const observed = observedAnswer(job);
  const predicted = job.prediction;
  $('prediction-result').hidden = !predicted || !observed;
  if (predicted && observed) {
    $('prediction-result').textContent = predicted === 'unsure'
      ? `You were not sure. Observed: ${optionText(options, observed)}`
      : predicted === observed
        ? `You predicted this. ${optionText(options, observed)}`
        : `You predicted: ${optionText(options, predicted)} Observed instead: ${optionText(options, observed)}`;
    recordPrediction(job);
  }

  // The written explanation, shown only once there is something to explain.
  $('lesson').hidden = !item;
  if (!item) $('try-again').hidden = true;
  if (item) {
    $('lesson-belief').textContent = 'A common belief: ' + item.belief;
    $('lesson-text').textContent = item.lesson;
    $('lesson-sources').replaceChildren(el('span', {text: 'Sources: '}));
    (item.sources || []).forEach((source, index) => {
      if (index) $('lesson-sources').append(el('span', {text: ' · '}));
      $('lesson-sources').append(el('a', {href: source.url, rel: 'noreferrer', target: '_blank', text: source.title}));
    });
    $('try-again').hidden = !item.slider;
    if (followupFor !== job.id) {
      followupFor = job.id;
      $('followup').hidden = false;
      $('followup-question').textContent = 'One more, to check the idea travels: ' + item.followup.question;
      radioGroup($('followup-options'), 'followup', item.followup.options);
      $('followup-result').textContent = '';
      $('followup-check').disabled = false;
    }
  }
}

async function checkFollowup() {
  const item = selected && curatedItem(selected.summary);
  const choice = chosen('followup');
  if (!item || !choice) {
    toast('Choose an answer first.');
    return;
  }
  const right = choice === item.followup.answer;
  $('followup-result').textContent = (right ? 'Right. ' : `Not quite: ${optionText(item.followup.options, item.followup.answer)} `) + item.followup.why;
  $('followup-check').disabled = true;
  try {
    await api('/api/learning', {experiment: item.id, stage: 'followup', choice});
    refreshLearning();
  } catch { /* the explanation is already on screen */ }
}

function fileKind(path) {
  if (/^(src\/test\/|src\/wallet\/test\/|src\/bench\/|test\/)/.test(path)) return 'test';
  if (selected?.summary.sensitive?.includes(path)) return 'consensus-related';
  return '';
}

function renderDiff(patch) {
  const pre = $('diff');
  const top = pre.scrollTop;
  const left = pre.scrollLeft;
  pre.replaceChildren();
  let showing = true;
  for (const line of (patch || 'No source change for this experiment.').split('\n')) {
    if (line.startsWith('diff --git ')) showing = !diffFilter || line.endsWith(' b/' + diffFilter);
    if (!showing) continue;
    const kind = line.startsWith('+') && !line.startsWith('+++') ? 'add'
      : line.startsWith('-') && !line.startsWith('---') ? 'del'
      : line.startsWith('@@') ? 'hunk' : 'context';
    pre.append(el('span', {class: kind, text: line + '\n'}));
  }
  pre.scrollTop = top;
  pre.scrollLeft = left;
}

function renderDiffFiles(job) {
  $('diff-files').replaceChildren();
  const files = job.files || [];
  if (files.length < 2) {
    diffFilter = null;
    return;
  }
  const pick = path => () => {
    diffFilter = path;
    renderDiffFiles(job);
    renderDiff(job.patch);
  };
  $('diff-files').append(el('button', {class: diffFilter ? 'text-button' : 'text-button selected', text: 'All files', onclick: pick(null)}));
  for (const file of files) {
    const kind = fileKind(file.path);
    const label = `${file.path}  +${file.added} −${file.removed}${kind ? '  · ' + kind : ''}`;
    $('diff-files').append(el('button', {class: 'text-button' + (diffFilter === file.path ? ' selected' : ''), text: label, onclick: pick(file.path)}));
  }
}

function eventText(event) {
  if (event.t === 'phase') return `[${event.name}] ${event.detail || ''}`;
  if (event.t === 'agent') return event.kind === 'tool' ? `› ${event.name}: ${event.detail}` : event.text || '';
  if (event.t === 'log') return event.line || '';
  if (event.t === 'warn') return `Note: ${event.detail}\n${event.plain || ''}`;
  if (event.t === 'result') return event.detail || '';
  return '';
}

function renderJob(value) {
  if (selected?.summary.id !== value.summary.id) diffFilter = null;
  selected = value;
  const job = value.summary;
  $('empty-current').hidden = true;
  $('job-content').hidden = false;
  const stateNames = {review: 'Waiting for your review', done: 'Finished', error: 'Stopped with a problem',
                      running: 'Working', cancelling: 'Stopping', cancelled: 'Cancelled'};
  $('job-state').textContent = stateNames[job.state] || title(job.state);
  $('job-state').className = 'pill ' + (job.state === 'error' ? 'bad' : job.state === 'done' ? 'good' : job.state === 'review' ? 'warn' : '');
  $('job-prompt').textContent = job.prompt;
  const origin = job.origin === 'imported' ? ' · imported from someone else' : job.curated ? ' · ready-made experiment' : '';
  const cost = typeof job.cost === 'number' ? ` · provider reported cost ${job.cost.toFixed(4)}` : '';
  $('job-meta').textContent = `${new Date(job.time * 1000).toLocaleString()}${origin}${job.sha ? ' · ' + short(job.sha) : ''}${cost}`;

  $('outcome-build').textContent = {passed: 'Compiled', failed: 'Did not compile'}[job.build_status] || title(job.build_status);
  $('outcome-test').textContent = job.test_status === 'findings'
    ? `${job.unit_failures?.length || 'Some'} no longer pass`
    : {passed: job.kind === 'scene' ? 'Not applicable' : 'All pass'}[job.test_status] || title(job.test_status);
  $('outcome-compare').textContent = job.compare ? (lessons.verdicts[job.compare.verdict]?.title || job.compare.headline).split(':')[0]
    : job.build_status === 'passed' ? 'Not compared' : 'Not run';
  $('outcome-active').textContent = {active: 'Running', refused: 'Refused on this network', 'rolled back': 'Went back to the previous build',
                                     failed: 'Would not start'}[job.activation] || 'Not started';

  const builds = ['vibe', 'build', 'revert', 'update', 'setup'].includes(job.kind);
  document.querySelector('.pipeline').hidden = job.kind !== 'vibe';
  document.querySelector('.outcomes').hidden = !builds;
  $('job-error').hidden = !job.error;
  $('job-error').textContent = job.error || '';
  $('review-reason').hidden = job.state !== 'review' || !job.review_reason;
  $('review-reason').textContent = job.review_reason || '';
  const risks = [...(job.risk || []), ...(job.sensitive || [])];
  $('risk').hidden = !risks.length;
  $('risk').textContent = 'Text match: this change touches ' + risks.join(', ') + '. ' + (lessons.static_flag_note || '');
  $('tests-touched').hidden = !job.tests_touched?.length;
  $('tests-touched').textContent = job.tests_touched?.length
    ? `This change edits ${job.tests_touched.length} test file(s): ${job.tests_touched.join(', ')}. Tests are how a codebase pins its rules in place; a change that edits them can make them pass without the behaviour being right. Read those edits as carefully as the change itself.`
    : '';

  renderComparison(job);

  const hasAgentText = !!job.explanation && job.kind === 'vibe' && !job.curated;
  $('explanation-heading').hidden = !hasAgentText;
  $('explanation-note').hidden = !hasAgentText;
  $('explanation').hidden = !job.explanation && !['running', 'cancelling'].includes(job.state);
  $('explanation').textContent = job.explanation || (['running', 'cancelling'].includes(job.state) ? 'Working…' : '');
  renderEvidence(job.evidence);
  renderDiffFiles(job);
  renderDiff(job.patch);
  $('diff-details').hidden = !job.patch;
  const files = job.files || [];
  $('diff-summary').textContent = files.length
    ? `The change · ${files.length} file(s) · +${files.reduce((n, f) => n + f.added, 0)} / −${files.reduce((n, f) => n + f.removed, 0)}`
    : 'The change';
  $('download-diff').disabled = !job.patch;

  $('apply').hidden = job.state !== 'review';
  $('apply').textContent = job.candidate ? 'Apply proposal' : 'Apply proposal, then build and compare';
  $('cancel').hidden = !(status?.job?.id === job.id && ['running', 'review', 'cancelling'].includes(job.state));
  $('cancel').textContent = job.state === 'review' ? 'Discard proposal' : job.state === 'cancelling' ? 'Stopping…' : 'Cancel experiment';
  $('refine').hidden = job.kind !== 'vibe' || !!job.curated;
  $('explanation').hidden ||= job.kind === 'ready';
  $('repair').hidden = !(job.state === 'error' && job.build_status === 'failed' && job.build_errors && job.kind === 'vibe' && !job.curated);
  $('retry').hidden = job.state !== 'error' || job.kind !== 'build';
  $('share').hidden = !job.sha || job.kind !== 'vibe' || !!job.curated;

  const events = value.events || [];
  const feed = $('feed');
  const nearBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 45;
  const position = feed.scrollTop;
  feed.textContent = events.map(eventText).filter(Boolean).join('\n');
  feed.scrollTop = nearBottom ? feed.scrollHeight : position;
  $('log-count').textContent = `(${events.length} events)`;
  const phases = events.filter(event => event.t === 'phase');
  const last = phases.at(-1);
  $('progress-message').textContent = last?.detail || '';

  const steps = ['agent', 'build', 'test', 'compare', 'review', 'restart'];
  let phase = last?.name;
  if (phase === 'commit') phase = 'review';
  if (phase === 'done' || phase === 'error' || phase === 'cancelled') {
    phase = job.activation === 'active' ? 'restart' : job.sha ? 'review' : job.compare ? 'compare'
      : job.test_status && job.test_status !== 'not run' ? 'test' : job.build_status === 'passed' ? 'build' : 'agent';
  }
  const index = steps.indexOf(phase);
  document.querySelectorAll('[data-step]').forEach(node => {
    const i = steps.indexOf(node.dataset.step);
    node.classList.toggle('current', i === index && job.state !== 'done');
    node.classList.toggle('complete', i < index || (i === index && job.state === 'done'));
  });
  updateControls();
}

// ----- live updates ----------------------------------------------------------

function closeStream() {
  if (stream) {
    stream.close();
    stream = null;
  }
  streamId = null;
}

function openStream(job) {
  if (demo || !['running', 'cancelling'].includes(job.state) || streamId === job.id) return;
  closeStream();
  streamId = job.id;
  streamSeq = 0;
  stream = new EventSource('/api/stream?id=' + encodeURIComponent(job.id));
  stream.onmessage = message => {
    let event;
    try {
      event = JSON.parse(message.data);
    } catch {
      return;
    }
    if (event.t === 'state') {
      closeStream();
      refresh();
      return;
    }
    if (event.seq <= streamSeq) return;
    streamSeq = event.seq;
    if (selected?.summary.id === job.id) {
      if (!selected.events.some(item => item.seq === event.seq)) selected.events.push(event);
      renderJob(selected);
    }
    if (event.t === 'phase' || event.t === 'verification') refresh();
  };
  stream.onerror = () => {
    // EventSource resumes from Last-Event-ID by itself.
    $('connection').textContent = 'Activity reconnecting…';
  };
}

async function selectJob(id, scroll = true) {
  selectedId = id;
  closeStream();
  const value = await api('/api/experiment?id=' + encodeURIComponent(id));
  if (selectedId !== id) return;
  renderJob(value);
  if (status?.job?.id === id) openStream(status.job);
  if (scroll) $('current').scrollIntoView({behavior: 'smooth'});
}

async function refresh() {
  if (inflight) return;
  inflight = true;
  try {
    const next = await api('/api/status');
    status = next;
    lastSuccess = Date.now();
    $('connection').textContent = demo ? 'Demo · nothing leaves this page' : 'Connected · updated ' + new Date().toLocaleTimeString();
    renderNode(next);
    modeHelp();
    if (next.job && !selectedId) selectedId = next.job.id;
    if (next.job && next.job.id === selectedId) {
      const value = await api('/api/experiment?id=' + encodeURIComponent(selectedId));
      if (selectedId === value.summary.id) renderJob(value);
      openStream(next.job);
    }
    renderHistory();
    updateControls();
  } catch (error) {
    $('connection').textContent = 'Offline · ' + (lastSuccess ? 'last updated ' + new Date(lastSuccess).toLocaleTimeString() : 'console unavailable');
    $('blocker').hidden = false;
    $('blocker').textContent = 'Cannot reach the local console. Check that ./vibes is still running. Reconnecting automatically.';
    lastSuccess = 0;
    updateControls();
  } finally {
    inflight = false;
  }
}

// ----- history ---------------------------------------------------------------

function renderHistory() {
  const query = $('search').value.trim().toLowerCase();
  const experiments = status?.experiments || [];
  const known = new Set(experiments.map(job => job.sha).filter(Boolean));
  const legacy = (status?.vibes || []).filter(v => !known.has(v.sha))
    .map(v => ({id: null, sha: v.sha, prompt: v.subject, time: v.time, state: 'saved earlier', kind: 'vibe'}));
  const all = [...experiments, ...legacy].sort((a, b) => b.time - a.time);
  const rows = all.filter(job => [job.prompt, job.sha, job.state, job.build_status, job.test_status].join(' ').toLowerCase().includes(query));
  $('history-count').textContent = `${rows.length} of ${all.length}`;
  $('history').replaceChildren();
  const reverted = new Set(experiments.filter(job => job.reverts && job.sha).map(job => job.reverts));
  const restoredAll = experiments.some(job => job.reverts === 'all');
  for (const job of rows) {
    const open = () => {
      if (job.id) {
        selectJob(job.id).catch(error => toast(error.message));
        return;
      }
      api('/api/diff?sha=' + job.sha).then(result => {
        renderJob({summary: {...job, patch: result.patch, explanation: 'Saved by an earlier version of the console. No build or comparison record exists for it.'}, events: []});
        $('current').scrollIntoView();
      }).catch(error => toast(error.message));
    };
    const state = reverted.has(job.sha) ? 'Reverted'
      : job.sha && status.node.revision === job.sha ? 'Running now'
      : {done: 'Finished', error: 'Problem', review: 'Awaiting review', cancelled: 'Cancelled'}[job.state] || title(job.state);
    const top = el('div', {class: 'history-top'}, [
      el('button', {text: job.prompt || job.kind, onclick: open}),
      el('span', {class: 'pill', text: state}),
    ]);
    const outcome = job.compare_verdict || '';
    const bottom = el('div', {class: 'history-bottom'}, [
      el('span', {text: `${new Date(job.time * 1000).toLocaleString()}${job.sha ? ' · ' + short(job.sha) : ''}${job.build_status ? ' · build: ' + job.build_status : ''}${outcome ? ' · ' + outcome : ''}`}),
    ]);
    if (job.sha && job.kind === 'vibe' && !reverted.has(job.sha) && !restoredAll) {
      bottom.append(el('button', {text: 'Revert change', onclick: async () => {
        const regtest = status?.chain === 'regtest';
        const ok = await confirmAction('Revert this change?',
          job.prompt + '\n\nThis adds a commit that undoes it, then builds and compares the result.' +
          (regtest ? ' Your private chain is reset as well, because blocks made under the old rules would otherwise stay in the node\'s database.' : ''),
          'Revert');
        if (ok) action('/api/revert', {sha: job.sha, autobuild: true, autorestart: $('autorestart').checked});
      }}));
    }
    $('history').append(el('div', {class: 'history-row'}, [top, bottom]));
  }
  if (!rows.length) {
    $('history').append(el('p', {class: 'history-empty', text: query ? 'No experiments match this search.' : 'No experiments yet. Start with a ready-made one above.'}));
  }
}

// ----- settings --------------------------------------------------------------

function settingInput(spec) {
  let input;
  if (spec.type === 'multi') {
    input = el('select', {multiple: ''});
    for (const choice of spec.choices) {
      const option = el('option', {value: choice, text: choice});
      option.selected = (settings.values[spec.key] || []).includes(choice);
      input.append(option);
    }
  } else {
    input = el('input', {type: spec.type === 'bool' ? 'checkbox' : ['int', 'decimal'].includes(spec.type) ? 'number' : 'text'});
    if (spec.type === 'bool') input.checked = !!settings.values[spec.key];
    else input.value = spec.type === 'multi_string' ? (settings.values[spec.key] || []).join(', ') : settings.values[spec.key] ?? '';
    if (input.type === 'number') {
      input.min = spec.min;
      input.max = spec.max;
      input.step = spec.type === 'int' ? '1' : 'any';
    }
  }
  input.id = 'setting-' + spec.key;
  input.dataset.setting = spec.key;
  input.onchange = () => {
    settings.values[spec.key] = spec.type === 'bool' ? input.checked
      : spec.type === 'multi' ? Array.from(input.selectedOptions, option => option.value)
      : spec.type === 'multi_string' ? input.value.split(',').map(v => v.trim()).filter(Boolean)
      : input.value;
  };
  return input;
}

function renderSettings() {
  const query = $('setting-search').value.toLowerCase();
  $('settings-fields').replaceChildren();
  for (const group of settings?.groups || []) {
    const specs = settings.schema.filter(spec => spec.group === group.id);
    const matches = specs.filter(spec => (spec.label + ' ' + spec.key + ' ' + spec.help + ' ' + (spec.tip || '')).toLowerCase().includes(query));
    if (!matches.length) continue;
    $('settings-fields').append(el('h3', {text: group.title}), el('p', {class: 'subtle', text: group.blurb || ''}));
    for (const spec of matches) {
      const text = el('div', {}, [
        el('label', {for: 'setting-' + spec.key, text: spec.label + (spec.unit ? ' (' + spec.unit + ')' : '')}),
        el('small', {text: spec.help || ''}),
      ]);
      if (spec.tip && spec.tip !== spec.help) {
        text.append(el('details', {class: 'tip'}, [el('summary', {text: 'What this does'}), el('p', {text: spec.tip})]));
      }
      const fallback = spec.type === 'bool' ? (spec.default ? 'on' : 'off') : Array.isArray(spec.default) ? 'none' : String(spec.default ?? '');
      text.append(el('small', {class: 'subtle', text: `-${spec.key} · default ${fallback || 'empty'}`}));
      $('settings-fields').append(el('div', {class: 'setting'}, [text, settingInput(spec)]));
    }
  }
}

// ----- sharing ---------------------------------------------------------------

function encodeToken(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return 'vibe1.' + btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function decodeToken(raw) {
  const token = (raw.includes('#decree=') ? raw.split('#decree=')[1] : raw).trim();
  if (!/^vibe1\.[A-Za-z0-9_-]+$/.test(token) || token.length > 16000) throw new Error('That is not a valid sharing token.');
  const b64 = token.slice(6).replaceAll('-', '+').replaceAll('_', '/');
  const binary = atob(b64 + '='.repeat((4 - b64.length % 4) % 4));
  const value = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0))));
  if (value.v !== 1 || typeof value.p !== 'string' || !value.p.trim() || value.p.length > 4000) throw new Error('A shared request must contain 1 to 4,000 characters.');
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f‪-‮⁦-⁩]/.test(value.p)) throw new Error('This shared request contains hidden control characters and was refused.');
  return value;
}

async function importRequest(raw) {
  let value;
  try {
    value = decodeToken(raw);
  } catch (error) {
    toast(error.message);
    return;
  }
  const ok = await confirmAction('A request from someone else',
    value.p + '\n\nThese are someone else\'s words. If you use them, they are handed to an AI agent as instructions. ' +
    'The agent can only edit files in its own copy of the source, and whatever it proposes is built in a sandbox, compared with an unmodified node, and then waits for your review. It is never applied or started automatically.',
    'Put it in my draft');
  if (!ok) return;
  $('wish').value = value.p;
  imported = {sender: {sha: String(value.sha || '').slice(0, 12), ts: Number(value.ts) || 0,
                       c: Array.isArray(value.c) ? value.c.slice(0, 8).map(String) : [],
                       f: Array.isArray(value.f) ? value.f.slice(0, 12) : []}};
  $('mode').value = 'review';
  renderImportedNote();
  saveDraft();
  updateControls();
  $('composer').scrollIntoView();
  $('wish').focus();
  if (demo) {
    $('share-output').hidden = false;
    $('share-output').closest('details').open = true;
    $('share-output').textContent = 'The browser demo cannot run a request. To use this one, start your own lab and open:\n' +
      'http://127.0.0.1:21212/import#decree=' + encodeToken(value) +
      '\n\nor paste this token into Setup & help → Import in your console:\n' + encodeToken(value);
  }
}

async function shareRequest() {
  try {
    const value = await api('/api/decree?sha=' + selected.summary.sha);
    if (value.p.length > 4000) throw new Error('Requests over 4,000 characters cannot be shared as a token.');
    const token = encodeToken(value);
    const text = 'Sharing link (explains what this is and how to import it):\n' +
      'https://hotpixelgroup.github.io/bitcoin/demo.html#decree=' + token +
      '\n\nToken, for Setup & help → Import in the recipient\'s own console:\n' + token;
    $('share-output').hidden = false;
    $('share-output').textContent = text;
    $('share-output').closest('details').open = true;
    try {
      await navigator.clipboard.writeText('https://hotpixelgroup.github.io/bitcoin/demo.html#decree=' + token);
      toast('Link copied. It carries your words, not your code.');
    } catch {
      toast('Copy the link from Setup & help.');
    }
    $('share-output').scrollIntoView();
  } catch (error) {
    toast(error.message);
  }
}

// ----- wiring ----------------------------------------------------------------

$('wish').addEventListener('input', () => {
  if (!$('wish').value.trim() && imported) {
    imported = null;
    renderImportedNote();
  }
  saveDraft();
  updateControls();
});
$('wish').addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault();
    $('manifest').click();
  }
});
for (const id of ['mode', 'autobuild', 'autorestart']) {
  $(id).addEventListener('change', () => {
    modeHelp();
    saveDraft();
  });
}
document.querySelectorAll('[data-category]').forEach(button => {
  button.onclick = () => {
    document.querySelectorAll('[data-category]').forEach(other => {
      other.classList.toggle('selected', other === button);
      other.setAttribute('aria-pressed', String(other === button));
    });
    renderExamples(button.dataset.category);
  };
});

$('manifest').onclick = manifest;
$('beliefs-save').onclick = saveBeliefs;
$('learning-export').onclick = exportLearning;
$('try-again').onclick = () => {
  const item = selected && curatedItem(selected.summary);
  if (item) runCurated(item);
};
$('external-run').onclick = () => {
  const path = $('external-path').value.trim();
  if (!path) {
    toast('Enter the full path to a bitcoind program.');
    return;
  }
  action('/api/compare-external', {path});
};
$('followup-check').onclick = checkFollowup;
$('apply').onclick = async () => {
  if (status?.dirty) {
    toast('Commit or stash your own source edits before applying.');
    return;
  }
  const job = selected.summary;
  const verdict = lessons.verdicts[job.compare?.verdict];
  const what = job.candidate
    ? `It was built and compared. Outcome: ${verdict?.title || 'not compared with an unmodified node'}.`
    : 'It has not been built yet; applying it will build and compare it.';
  if (await confirmAction('Apply this proposal?', `${job.prompt}\n\n${what}\n\nThis saves the change to your source. You can revert it from the history.`, 'Apply')) {
    action('/api/apply', {id: job.id});
  }
};
$('cancel').onclick = async () => {
  if (selected?.summary.state === 'review' && !await confirmAction('Discard this proposal?', 'The proposal is thrown away. Your source and your running node are unchanged.', 'Discard')) return;
  action('/api/cancel', {});
};
$('build').onclick = () => action('/api/build', {autorestart: false});
$('retry').onclick = () => action('/api/build', {autorestart: $('autorestart').checked});
$('reference').onclick = async () => {
  if (await confirmAction('Prepare the reference node?', 'If your source has saved experiments, this compiles the unmodified source from scratch in a temporary folder, which takes as long as a first build. Otherwise it is an ordinary build.', 'Prepare')) action('/api/reference', {});
};
$('activate').onclick = async () => {
  const build = status.build || {};
  const verdict = lessons.verdicts[build.compare?.verdict];
  const copy = `Revision ${short(build.sha)} will replace the running node.\n\nOutcome of its comparison with an unmodified node: ${verdict?.title || 'not compared'}.` +
    (build.unit_failures?.length ? `\n\n${build.unit_failures.length} stock unit tests fail on this build.` : '');
  if (await confirmAction('Start this build?', copy, 'Start it')) action('/api/activate', {});
};
$('restart').onclick = () => action('/api/node', {action: 'restart'});
$('node-start').onclick = () => action('/api/node', {action: status?.node.running ? 'stop' : 'start'});
$('mine').onclick = () => {
  const n = Number($('blocks').value);
  if (!Number.isInteger(n) || n < 1 || n > 150) {
    toast('Choose a whole number from 1 to 150.');
    return;
  }
  action('/api/node', {action: 'mine', blocks: n});
};
$('mine-101').onclick = () => action('/api/node', {action: 'mine', blocks: 101});
$('maturity').onclick = () => action('/api/playground', {scenario: 'maturity'});
$('refine').onclick = () => {
  $('wish').value = selected?.summary.prompt || '';
  imported = selected?.summary.origin === 'imported' ? {sender: selected.summary.sender || {}} : null;
  renderImportedNote();
  saveDraft();
  updateControls();
  $('composer').scrollIntoView();
  $('wish').focus();
};
$('repair').onclick = () => {
  const job = selected.summary;
  action('/api/vibe', {prompt: job.prompt, review: true, autobuild: true, autorestart: false, repair_of: job.id,
                       origin: job.origin === 'imported' ? 'imported' : 'typed', sender: job.sender, prediction: job.prediction});
};
$('share').onclick = shareRequest;
$('search').oninput = renderHistory;
$('jump').onclick = () => { $('feed').scrollTop = $('feed').scrollHeight; };
$('node-log').onclick = async () => {
  try {
    const result = await api('/api/node-log');
    $('node-log-detail').hidden = false;
    $('node-log-detail').open = true;
    $('node-log-content').textContent = result.log || 'No node log entries yet.';
  } catch (error) {
    toast(error.message);
  }
};
$('compare-baseline').onclick = async () => {
  try {
    const result = await api('/api/diff?sha=HEAD&base=baseline');
    diffFilter = null;
    renderDiff(result.patch || 'Your source is at the baseline: no saved experiments.');
    $('diff-details').open = true;
    toast('Showing everything your saved experiments changed, together.');
  } catch (error) {
    toast(error.message);
  }
};
$('download-diff').onclick = () => {
  const url = URL.createObjectURL(new Blob([selected?.summary.patch || ''], {type: 'text/plain'}));
  const anchor = el('a', {href: url, download: 'bitcoin-vibes-' + (selected?.summary.id || 'diff') + '.diff'});
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$('restore').onclick = async () => {
  if (await confirmAction('Restore the baseline source?', 'Every saved experiment is undone in one new commit, the result is built, and on the private chain the chain is reset. Your experiments stay in the history and in git.', 'Restore')) action('/api/restore', {autorestart: $('autorestart').checked});
};
$('reset-chain').onclick = async () => {
  if (await confirmAction('Reset your private chain?', 'Every block on your private regtest chain is deleted and the chain starts again from its first block. Your source, your settings and your experiment history are kept.', 'Reset')) action('/api/reset-chain', {});
};
$('update').onclick = async () => {
  if (await confirmAction('Update Bitcoin Vibes?', 'This contacts origin, takes any newer version, replays your saved experiments on top where possible, and builds the result. A conflict stops the update and leaves everything as it was.', 'Update')) action('/api/update', {autobuild: true, autorestart: false});
};
$('check-upstream').onclick = async () => {
  $('upstream-status').textContent = 'Asking GitHub…';
  try {
    renderUpstream(await api('/api/check-upstream', {}));
  } catch (error) {
    $('upstream-status').textContent = error.message;
  }
};
$('load-settings').onclick = async () => {
  try {
    settings = await api('/api/settings');
    $('setting-search').hidden = false;
    $('save-settings').hidden = false;
    renderSettings();
    $('settings-status').textContent = `Loaded ${settings.schema.length} settings. Defaults are read from this build of the node.`;
  } catch (error) {
    toast(error.message);
  }
};
$('setting-search').oninput = renderSettings;
$('save-settings').onclick = async () => {
  try {
    const result = await api('/api/settings', {values: settings.values});
    settings.values = result.values;
    $('settings-status').textContent = 'Settings saved. Restart the node to apply them.';
    toast('Settings saved. Restart the node to apply them.');
  } catch (error) {
    $('settings-status').textContent = error.message;
    toast(error.message);
  }
};
$('import').onclick = () => importRequest($('import-token').value);
$('reset-demo').onclick = async () => {
  if (!await confirmAction('Reset the browser demo?', 'This clears the demo\'s experiments and answers. Your saved draft stays on this device.', 'Reset')) return;
  window.VibesDemo.reset();
  selectedId = null;
  selected = null;
  $('job-content').hidden = true;
  $('empty-current').hidden = false;
  $('job-state').textContent = 'No experiment yet';
  $('feed').textContent = '';
  await refresh();
  refreshLearning();
};

$('networks-help').textContent = Object.entries(lessons.networks).map(([name, text]) => `${name}: ${text}`).join('\n\n');
if (demo) $('demo-banner').hidden = false;
loadDraft();
renderImportedNote();
renderCurated();
renderExamples('Customize');
modeHelp();
updateControls();
refresh();
refreshLearning();
// A shared link can arrive on first load or while the console is already open.
function importFromHash() {
  if (!location.hash.startsWith('#decree=')) return;
  const token = location.hash.slice(8);
  history.replaceState(null, '', location.pathname + location.search);
  importRequest(token);
}
setTimeout(importFromHash, 300);
window.addEventListener('hashchange', importFromHash);
setInterval(refresh, demo ? 1500 : 4000);
window.addEventListener('online', refresh);
window.addEventListener('beforeunload', closeStream);
})();
