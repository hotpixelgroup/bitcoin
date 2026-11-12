"""Practice keeps immutable daily attempts separate from original learning scores."""
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from vibeslib import learning_content, lessons, study


class StudyTests(unittest.TestCase):
    def test_retry_cannot_replace_first_daily_answer_but_later_review_can(self):
        body = dict(stage='practice', experiment='utxos', question='utxo-sum-1', choice='0', round=10)
        entries, first = study.record([], body, now=864001)
        again, saved = study.record(entries, {**body, 'choice': '2', 'correct': True}, now=864002)
        self.assertEqual(again, entries)
        self.assertEqual(saved, first)
        self.assertFalse(saved['correct'])
        later, second = study.record(entries, {**body, 'choice': '2', 'round': 11}, now=950401)
        self.assertEqual(len(later), 2)
        self.assertTrue(second['correct'])
        self.assertEqual(later[0], first)

    def test_unknown_questions_invalid_choices_and_old_rounds_are_rejected(self):
        valid = dict(stage='practice', experiment='utxos', question='utxo-sum-1', choice='2', round=10)
        for change in ({'experiment': []}, {'question': 'made-up'}, {'choice': {}}, {'round': True}, {'round': 9}):
            with self.subTest(change=change), self.assertRaises(ValueError):
                study.record([], {**valid, **change}, now=864001)

    def test_reflections_are_bounded_and_first_entry_is_retained(self):
        body = dict(stage='reflection', experiment='keys', job='job-123', note='  My reasoning  ', confidence='low')
        entries, saved = study.record([], body)
        self.assertEqual(saved['note'], 'My reasoning')
        self.assertEqual(study.record(entries, {**body, 'note': 'replacement'})[1], saved)
        for change in ({'note': 'x' * 1001}, {'confidence': 'certain'}, {'job': None}):
            with self.subTest(change=change), self.assertRaises(ValueError):
                study.record([], {**body, **change})

    def test_damaged_practice_entries_do_not_discard_valid_reflections(self):
        entries, saved = study.record([], dict(stage='reflection', experiment='keys', job='job', note='', confidence=''))
        self.assertEqual(study.clean_entries([None, {}, {'time': float('nan')}, *entries]), [saved])
        self.assertEqual(study.clean_entries({'entries': entries}), [])

    def test_catalog_has_varied_practice_and_defined_terms_for_every_lesson(self):
        ids = {item['id'] for item in lessons.CURATED}
        self.assertTrue(set(learning_content.BEGINNER_ROUTE) <= ids)
        for identity in ids:
            self.assertIn(identity, learning_content.TAKEAWAYS)
            for term in learning_content.TERMS[identity]:
                self.assertIn(term, learning_content.GLOSSARY)
        for questions in learning_content.PRACTICE.values():
            self.assertGreaterEqual(len(questions), 2)
            self.assertEqual(len({item['id'] for item in questions}), len(questions))
            for item in questions:
                self.assertIn(item['answer'], [option['id'] for option in item['options']])
