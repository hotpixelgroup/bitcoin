'use strict';
// Browser-demo counterpart of vibeslib/study.py. No original scores are edited.
(() => {
const questions = window.VibesLessons?.learning?.practice || {};
const question = (topic, id) => Object.hasOwn(questions, topic) && questions[topic].find(item => item.id === id);
function clean(entries) {
  return (Array.isArray(entries) ? entries : []).filter(row => {
    if (!row || typeof row !== 'object' || typeof row.experiment !== 'string' || !Number.isFinite(row.time)) return false;
    if (row.stage === 'practice') return Number.isInteger(row.round) && row.round >= 0 &&
      question(row.experiment, row.question)?.options.some(option => option.id === row.choice);
    return row.stage === 'reflection' && typeof row.job === 'string' && typeof row.note === 'string' &&
      row.note.length <= 1000 && ['', 'low', 'medium', 'high'].includes(row.confidence);
  }).map(row => row.stage === 'practice' ? {...row, correct: row.choice === question(row.experiment, row.question).answer} : {...row});
}
function snapshot(entries, now = Date.now() / 1000) {
  return {version: 1, round: Math.floor(now / 86400), now, entries: clean(entries)};
}
function record(entries, body, now = Date.now() / 1000) {
  const {stage, experiment} = body;
  if (typeof experiment !== 'string' || !Object.hasOwn(questions, experiment)) throw new Error('Choose a known learning topic');
  entries = clean(entries);
  let entry, previous;
  if (stage === 'practice') {
    const item = question(experiment, body.question);
    if (!item?.options.some(option => option.id === body.choice)) throw new Error("Choose one of this question's answers");
    if (!Number.isInteger(body.round) || body.round !== Math.floor(now / 86400)) throw new Error('A new review day has started. Reload the page before saving this answer.');
    entry = {stage, experiment, question: item.id, choice: body.choice, correct: body.choice === item.answer, round: body.round, time: now};
    previous = entries.find(row => row.stage === stage && row.experiment === experiment && row.question === item.id && row.round === body.round);
  } else if (stage === 'reflection') {
    const {note = '', confidence = '', job} = body;
    if (typeof note !== 'string' || note.length > 1000 || !['', 'low', 'medium', 'high'].includes(confidence) ||
        typeof job !== 'string' || !job.length || job.length > 80) throw new Error('Use a short reflection and one of the confidence choices');
    entry = {stage, experiment, job, note: note.trim(), confidence, time: now};
    previous = entries.find(row => row.stage === stage && row.job === job);
  } else throw new Error('Unknown study entry');
  return {entries: previous ? entries : [...entries, entry], entry: previous || entry};
}
window.VibesStudy = {clean, snapshot, record};
})();
