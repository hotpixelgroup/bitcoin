'use strict';
// Optional learning tools. Evidence comes from the completed job, never a model.
window.VibesLearning = {create({$, el, api, lessons, remember, toast, showSection, runCurated}) {
  const content = lessons.learning;
  let record = {entries: [], round: Math.floor(Date.now() / 86400000), now: Date.now() / 1000};
  let firstAnswers = [], completed = new Set(), queueKey = '', stepKey = '', reflectionKey = '';
  let practiceGeneration = 0;
  const title = id => lessons.curated.find(item => item.id === id)?.title || content.workshops.find(item => item.id === id)?.title || id;
  const confident = () => el('select', {}, [
    el('option', {value: '', text: 'Prefer not to say'}), el('option', {value: 'low', text: 'Not confident yet'}),
    el('option', {value: 'medium', text: 'Somewhat confident'}), el('option', {value: 'high', text: 'Very confident'}),
  ]);
  function terms(container, id) {
    if (container.dataset.topic === (id || '')) return;
    container.dataset.topic = id || '';
    container.replaceChildren();
    const names = content.terms[id];
    if (!names?.length) return;
    const definitions = el('dl');
    for (const name of names) definitions.append(el('dt', {text: name}), el('dd', {text: content.glossary[name]}));
    container.append(el('details', {class: 'terms'}, [el('summary', {text: 'Words used in this experiment'}), definitions]));
  }
  function setView(value) {
    const view = value === 'lab' ? 'lab' : 'learning';
    $('learning-view').value = view;
    document.body.classList.toggle('learning-mode', view === 'learning');
    remember('vibes-learning-view', view);
  }
  for (const id of ['node-controls', 'settings-section']) $(id)?.setAttribute('data-advanced', '');
  setView(remember('vibes-learning-view'));
  const revealLinkedSection = () => {
    if (/^#[a-z][a-z0-9-]*$/.test(location.hash) && $(location.hash.slice(1))?.closest('[data-advanced]')) setView('lab');
  };
  revealLinkedSection();
  window.addEventListener('hashchange', revealLinkedSection);
  $('learning-view').onchange = () => setView($('learning-view').value);
  $('learning-route').value = remember('vibes-learning-route') === 'all' ? 'all' : 'beginner';
  function route() {
    return $('learning-route').value === 'all' ? lessons.curated : content.beginner_route.map(id => lessons.curated.find(item => item.id === id)).filter(Boolean);
  }
  function progress() {
    const items = route(), count = items.filter(item => completed.has(item.id)).length;
    const text = (id, value) => { if ($(id).textContent !== value) $(id).textContent = value; };
    text('journey-progress', `${count} of ${items.length} ${items.length === 5 ? 'foundations' : 'experiments'} explored`);
    text('start-learning', count === items.length ? 'Explore this path again' : count ? 'Continue learning' : 'Start with coins and keys');
    text('route-description', items.length === 5 ? 'Coins and keys → inputs and change → fees → relay policy → consensus rules.' : 'Choose any experiment. You can return to the five foundations at any time.');
  }
  $('learning-route').onchange = () => { remember('vibes-learning-route', $('learning-route').value); progress(); };
  $('baseline-start').onclick = () => { $('beliefs-details').open = true; showSection('beliefs', true); };

  function queue() {
    const topics = [...new Set([...completed, ...record.entries.map(row => row.experiment)])].filter(id => Object.hasOwn(content.practice, id));
    const key = JSON.stringify([topics, record.entries, firstAnswers, Math.floor(Date.now() / 86400000)]);
    if (key === queueKey) return;
    queueKey = key;
    const box = $('practice-queue');
    box.replaceChildren();
    if (!topics.length) { box.append(el('p', {class: 'subtle', text: 'Complete an experiment or explore a model to start your review list.'})); return; }
    for (const id of topics) {
      const attempts = [...firstAnswers.filter(row => row.experiment === id && row.stage === 'followup'), ...record.entries.filter(row => row.experiment === id && row.stage === 'practice')].sort((a, b) => (a.time || 0) - (b.time || 0));
      const latest = attempts.at(-1);
      const due = latest && (latest.time || 0) + (latest.correct ? 7 : 1) * 86400;
      const state = !latest ? 'Ready for a first practice question' : due <= Date.now() / 1000 ? 'Review suggested now' : `Review suggested ${new Date(due * 1000).toLocaleDateString()}`;
      const outcome = latest ? latest.correct ? 'Last question answered correctly. ' : 'Last question needs another look. ' : '';
      box.append(el('div', {class: 'review-row'}, [el('div', {}, [el('b', {text: title(id)}), el('p', {class: 'subtle', text: outcome + state})]),
        el('button', {text: latest ? 'Practice again' : 'Try a question', 'aria-label': 'Practice: ' + title(id), onclick: () => practice(id)})]));
    }
  }
  async function refresh() {
    try { record = await api('/api/study'); queue(); } catch (error) { toast('Could not load practice: ' + error.message); }
  }
  async function practice(id) {
    const generation = ++practiceGeneration;
    const box = $('practice-question');
    try {
      const current = await api('/api/study');
      if (generation !== practiceGeneration) return;
      record = current;
      const answered = question => record.entries.filter(row => row.stage === 'practice' && row.experiment === id && row.question === question.id);
      const available = content.practice[id].filter(question => !answered(question).some(row => row.round === record.round));
      available.sort((a, b) => answered(a).length - answered(b).length);
      const question = available[0];
      box.replaceChildren(el('h3', {text: title(id)}));
      if (!question) {
        box.append(el('p', {text: 'Both practice questions are saved for today. Return on another day to try remembering them again.'}));
        showSection('practice-section', true);
        return;
      }
      const round = record.round;
      const field = el('fieldset', {class: 'question'}, [el('legend', {text: question.question})]);
      question.options.forEach(option => {
        const input = el('input', {type: 'radio', name: 'practice-answer', value: option.id});
        field.append(el('label', {class: 'choice'}, [input, el('span', {text: option.text})]));
      });
      const feedback = el('p', {role: 'status'});
      const check = el('button', {text: 'Save practice answer'});
      check.onclick = async () => {
        const choice = field.querySelector('input:checked')?.value;
        if (!choice) { feedback.textContent = 'Choose an answer first.'; return; }
        check.disabled = true;
        try {
          const saved = await api('/api/study', {stage: 'practice', experiment: id, question: question.id, choice, round});
          record = saved;
          field.querySelectorAll('input').forEach(input => { input.checked = input.value === saved.entry.choice; input.disabled = true; });
          feedback.textContent = (saved.entry.correct ? 'Correct. ' : 'Try this explanation: ') + question.why;
          box.append(el('button', {text: 'Try another question', onclick: () => practice(id)}));
          const item = lessons.curated.find(item => item.id === id);
          if (!saved.entry.correct && item) box.append(el('button', {text: 'Revisit the experiment', onclick: () => runCurated(item)}));
          queue();
        } catch (error) { feedback.textContent = error.message; check.disabled = false; }
      };
      box.append(field, check, feedback);
      showSection('practice-section');
      box.focus({preventScroll: true});
    } catch (error) { toast(error.message); }
  }

  function result(job, canExplain) {
    const rows = job.compare?.rows || [], id = job.curated;
    const key = JSON.stringify([job.id, rows]);
    if (stepKey !== key) {
      stepKey = key;
      const box = $('evidence-stepper');
      box.replaceChildren();
      box.hidden = !rows.length;
      $('full-observations').open = !canExplain;
      if (rows.length) {
        let index = 0;
        const count = el('span', {class: 'subtle'}), card = el('div', {class: 'evidence-frame', 'aria-live': 'polite'});
        const previous = el('button', {text: 'Previous observation'}), next = el('button', {text: 'Next observation'});
        const draw = () => {
          const row = rows[index];
          count.textContent = `${index + 1} of ${rows.length}`;
          card.replaceChildren(el('h4', {text: row.title}));
          const values = el('div', {class: 'evidence-values'});
          for (const [label, value] of [['First observation', row.reference], ['Comparison', row.candidate]]) {
            if (value) values.append(el('div', {}, [el('small', {text: label}), el('p', {text: String(value)})]));
          }
          card.append(values, el('p', {text: row.plain}));
          previous.disabled = index === 0; next.disabled = index === rows.length - 1;
        };
        previous.onclick = () => { if (index > 0) { index--; draw(); } };
        next.onclick = () => { if (index < rows.length - 1) { index++; draw(); } };
        box.append(el('h3', {text: 'Walk through the evidence'}), el('p', {class: 'subtle', text: 'One observation at a time, taken directly from this result.'}), card, el('div', {class: 'toolbar'}, [previous, count, next]));
        draw();
      }
    }
    $('lesson-takeaway').textContent = canExplain ? content.takeaways[id] || '' : '';
    terms($('lesson-terms'), canExplain ? id : '');
    const saved = record.entries.find(row => row.stage === 'reflection' && row.job === job.id);
    const reflectionIdentity = JSON.stringify([job.id, canExplain, saved]);
    if (reflectionKey === reflectionIdentity) return;
    reflectionKey = reflectionIdentity;
    const box = $('reflection');
    box.replaceChildren();
    if (!canExplain) return;
    const details = el('details'), note = el('textarea', {id: 'reflection-note', rows: '3', maxlength: '1000'}), confidence = confident();
    confidence.id = 'reflection-confidence';
    const feedback = el('p', {role: 'status'}), save = el('button', {text: 'Save reflection'});
    details.append(el('summary', {text: 'What changed your thinking? (optional)'}));
    const before = job.prediction_context;
    if (before?.reason || before?.confidence) details.append(el('p', {class: 'subtle', text: `Before: ${before.confidence || 'no confidence recorded'}. ${before.reason || ''}`}));
    details.append(el('label', {for: note.id, text: 'Explain the result in your own words'}), note,
      el('label', {for: confidence.id, text: 'How confident are you now?'}), confidence,
      el('p', {class: 'subtle', text: 'Saved only here and included in your download. Keep private keys and recovery phrases out of notes.'}), save, feedback);
    box.append(details, el('button', {class: 'text-button', text: 'Practice this idea with a different question', onclick: () => practice(id)}));
    const lock = entry => { note.value = entry.note; confidence.value = entry.confidence; note.disabled = confidence.disabled = save.disabled = true; feedback.textContent = 'Your first reflection is saved.'; };
    if (saved) lock(saved);
    save.onclick = async () => {
      save.disabled = true;
      try {
        record = await api('/api/study', {stage: 'reflection', experiment: id, job: job.id, note: note.value, confidence: confidence.value});
        reflectionKey = JSON.stringify([job.id, canExplain, record.entry]);
        lock(record.entry); queue();
      } catch (error) { feedback.textContent = error.message; save.disabled = false; }
    };
  }

  function workshops() {
    for (const item of content.workshops) {
      const details = el('details', {class: 'workshop', id: 'model-' + item.id}), body = el('div', {class: 'model-body'});
      details.append(el('summary', {text: item.title}), el('p', {text: item.summary}), body,
        el('p', {class: 'subtle'}, [el('a', {href: item.source, target: '_blank', rel: 'noreferrer', text: 'Read the source ↗'})]),
        el('button', {text: 'Check this idea', onclick: () => practice(item.id)}));
      $('workshop-list').append(details);
      if (item.id === 'work') workModel(body);
      if (item.id === 'privacy') privacyModel(body);
      if (item.id === 'lightning') lightningModel(body);
    }
  }
  function workModel(box) {
    let nonce = 0, wins = 0, busy = false;
    const target = el('select', {id: 'work-target'}, [el('option', {value: '1', text: 'Hash starts with 0 (1 in 16 per attempt)'}), el('option', {value: '2', text: 'Hash starts with 00 (1 in 256 per attempt)'})]);
    const output = el('p', {role: 'status'}), hash = el('code', {class: 'toy-hash'}), button = el('button', {text: 'Try 100 hashes'});
    const reset = () => { nonce = 0; wins = 0; hash.textContent = ''; output.textContent = 'No attempts yet. Every attempt has the same chance; previous misses do not make a win due.'; };
    target.onchange = reset;
    button.onclick = async () => {
      if (busy) return;
      busy = true; button.disabled = target.disabled = true;
      try {
        if (!globalThis.crypto?.subtle) throw new Error('Hashing needs a secure browser context (HTTPS or localhost).');
        const prefix = '0'.repeat(Number(target.value));
        for (let i = 0; i < 100; i++) {
          const bytes = new TextEncoder().encode('Vibes toy block:' + nonce++);
          const digest = await crypto.subtle.digest('SHA-256', bytes);
          const value = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
          if (value.startsWith(prefix)) wins++;
          hash.textContent = value;
        }
        output.textContent = `${nonce} attempts; ${wins} met the target. The last hash is shown below. Expected successes over many trials: about ${(nonce / (16 ** Number(target.value))).toFixed(1)}; a finite sample can differ.`;
      } catch (error) { output.textContent = error.message; }
      finally { busy = false; button.disabled = target.disabled = false; }
    };
    box.append(el('p', {text: 'Toy SHA-256 hashes, not Bitcoin block headers. Real Bitcoin hashes headers twice and compares a numeric target. The same message and nonce always give the same hash; changing the target resets to the same sequence for comparison. This model changes only the probability of a match.'}),
      el('label', {for: target.id, text: 'Target'}), target, button, output, hash,
      el('p', {text: 'Adding one required hexadecimal zero makes this toy target 16 times harder on average. More attempts per second reduce the expected wait, not the rules a node checks. Bitcoin adjusts its target every 2,016 blocks to aim for a long-run ten-minute block interval; individual waits vary.'}));
    reset();
  }
  function privacyModel(box) {
    const input = el('input', {type: 'checkbox', id: 'fresh-addresses'}), diagram = el('div', {class: 'privacy-map'}), explanation = el('p', {role: 'status'});
    const draw = () => {
      diagram.replaceChildren();
      ['A', 'B', 'C'].forEach((name, index) => diagram.append(el('div', {class: 'flow-row', text: `Payment ${name} → destination ${input.checked ? index + 1 : 1}`})));
      explanation.textContent = input.checked ? 'These payments no longer share an identical destination. Fresh addresses reduce that direct link, but amounts, timing and later input combinations can still reveal relationships. They do not guarantee anonymity.' : 'The same destination directly links all three payments. The public graph alone does not tell you the person’s identity. Other information can connect an address to a person.';
    };
    box.append(el('p', {text: 'Fictional payments, with no real addresses or people.'}), el('label', {class: 'choice', for: input.id}, [input, el('span', {text: 'Use a fresh destination for each payment'})]), diagram, explanation);
    input.onchange = draw; draw();
  }
  function lightningModel(box) {
    let alice = 80000, bob = 20000, closed = false;
    const balances = el('p', {class: 'takeaway', role: 'status'}), status = el('p', {role: 'status'});
    const amount = el('input', {id: 'channel-amount', type: 'number', min: '1', max: '100000', step: '1', value: '30000'});
    const forward = el('button', {text: 'Alice pays Bob'}), back = el('button', {text: 'Bob pays Alice'}), close = el('button', {text: 'Settle and close model channel'}), reset = el('button', {text: 'Reset model'});
    const draw = () => { balances.textContent = `Alice: ${alice.toLocaleString()} sat · Bob: ${bob.toLocaleString()} sat · Total: 100,000 sat`; forward.disabled = back.disabled = close.disabled = amount.disabled = closed; };
    const pay = fromAlice => {
      if (closed) return;
      const value = Number(amount.value), available = fromAlice ? alice : bob;
      if (!available) { status.textContent = 'This sender has no outgoing balance in the model. A payment in the other direction can restore it.'; return; }
      if (!Number.isSafeInteger(value) || value < 1 || value > available) { status.textContent = `Choose a whole number from 1 to ${available.toLocaleString()} sat, the sender’s available balance in this model.`; return; }
      alice += fromAlice ? -value : value; bob += fromAlice ? value : -value;
      status.textContent = 'The channel balance changed. No new on-chain payment was made in this model.'; draw();
    };
    forward.onclick = () => pay(true); back.onclick = () => pay(false);
    close.onclick = () => { closed = true; status.textContent = 'Model closed: a cooperative closing transaction would settle these latest balances on-chain, less fees. No transaction was created here.'; draw(); };
    reset.onclick = () => { alice = 80000; bob = 20000; closed = false; status.textContent = 'Model reset.'; draw(); };
    box.append(el('p', {text: 'A fictional 100,000-satoshi channel starts with 80,000 on Alice’s side. Outgoing capacity depends on which side holds the balance. Real channels also need reserves and fees, and use signed commitments and protections for failed or disputed closes. This model omits those and multi-hop routing.'}), balances,
      el('label', {for: amount.id, text: 'Payment in satoshis'}), amount, el('div', {class: 'toolbar'}, [forward, back, close, reset]), status);
    draw();
  }
  workshops();
  refresh();
  return {terms, route, result, refresh, setView,
    update(entries, explored) { firstAnswers = entries; completed = explored; progress(); queue(); },
  };
}};
