"""Recording rejects incomplete runs and covers the exact supported inputs."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))
spec = importlib.util.spec_from_file_location('record_demo', HERE / 'record_demo.py')
recorder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(recorder)
spec = importlib.util.spec_from_file_location('record_ci_demo', HERE / 'tests/record_ci_demo.py')
ci_recorder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ci_recorder)


class RecordingTests(unittest.TestCase):
    def record(self, incomplete=False, mutate=None, error=None, state='done', item=None, replacement=False):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / '.vibes').mkdir()
            (root / '.vibes/key').write_text('test-only-key')
            target = root / 'recordings.js'
            target.write_text('previous complete recordings\n')
            shares = []
            cancelled = []
            item = item or {'id': 'power', 'kind': 'scene', 'answer': None,
                            'slider': {'min': 10, 'max': 20, 'step': 5},
                            'options': [{'id': 'own'}, {'id': 'strict'}]}
            current_state = state
            def request(req, **_):
                nonlocal current_state
                if req.full_url.endswith('/api/cancel'):
                    cancelled.append('recording-job')
                    current_state = 'cancelled'
                    result = {'cancelled': True}
                elif req.data:
                    shares.append(json.loads(req.data).get('share'))
                    current_state = state
                    result = {'job': {'id': 'recording-job'}}
                elif req.full_url.endswith('/api/status'):
                    result = {'job': {'id': 'different-job' if replacement else 'recording-job',
                                      'state': current_state}}
                else:
                    comparison = {'headline': 'observed result', 'verdict': 'tightened',
                                  'share': shares[-1], 'observed_answer': 'own',
                                  'rows': [{'status': 'error' if incomplete and shares[-1] == 15 else 'same'}]}
                    if mutate:
                        mutate(comparison)
                    result = {'summary': {'id': 'recording-job', 'curated': item['id'],
                                          'state': state, 'test_status': 'not run', 'compare': comparison}}
                return io.BytesIO(json.dumps(result).encode())
            args = ['record_demo.py', '--repo', str(root), '--url', 'http://test.invalid',
                    '--out', str(target), '--ready']
            with patch.object(sys, 'argv', args), patch.object(recorder.lessons, 'CURATED', (item,)), \
                    patch.object(recorder.urllib.request, 'urlopen', request), \
                    patch.object(recorder.time, 'sleep'), contextlib.redirect_stdout(io.StringIO()):
                if incomplete or error:
                    with self.assertRaisesRegex(SystemExit, error or 'incomplete observation'):
                        recorder.main()
                    self.assertEqual(target.read_text(), 'previous complete recordings\n')
                else:
                    recorder.main()
                    text = target.read_text()
                    self.assertIn('"power@15"' if item.get('slider') else '"' + item['id'] + '"', text)
                    self.assertIn('"unit_failures": null', text)
            return shares, cancelled

    def test_every_slider_position_gets_its_own_recording(self):
        self.assertEqual(self.record()[0], [10, 15, 20])

    def test_incomplete_run_never_replaces_existing_recordings(self):
        self.assertEqual(self.record(incomplete=True)[0], [10, 15])

    def test_missing_or_wrong_share_preserves_existing_recordings(self):
        for mutate in (lambda result: result.pop('share'),
                       lambda result: result.update(share=30),
                       lambda result: result.update(share=10.0)):
            with self.subTest(mutate=mutate):
                self.record(mutate=mutate, error='requested share')

    def test_missing_or_unknown_observed_answer_is_refused(self):
        for answer in (None, 'invented', []):
            with self.subTest(answer=answer):
                self.record(mutate=lambda result: result.update(observed_answer=answer),
                            error='valid observed answer')

    def test_fixed_scene_must_demonstrate_its_designed_outcome(self):
        item = {'id': 'keys', 'kind': 'scene', 'answer': 'chain',
                'options': [{'id': 'chain'}, {'id': 'gone'}]}
        self.record(item=item, mutate=lambda result: result.update(observed_answer='gone'),
                    error='expected outcome')

    def test_patch_must_demonstrate_its_expected_rule_difference(self):
        item = {'id': 'double-reward', 'kind': 'patch', 'expected': 'loosened'}
        self.record(item=item, error='expected outcome')

    def test_failed_review_recording_discards_its_proposal(self):
        _, cancelled = self.record(state='review', mutate=lambda result: result.update(observed_answer=None),
                                   error='valid observed answer')
        self.assertEqual(cancelled, ['recording-job'])

    def test_replaced_job_is_never_discarded(self):
        _, cancelled = self.record(state='review', replacement=True, error='Another experiment')
        self.assertEqual(cancelled, [])

    def test_timeout_must_be_finite_and_positive(self):
        for timeout in ('nan', 'inf', '-inf', '0', '-1'):
            with self.subTest(timeout=timeout), patch.object(sys, 'argv', ['record_demo.py', '--timeout=' + timeout]), \
                    contextlib.redirect_stderr(io.StringIO()):
                with self.assertRaises(SystemExit) as caught:
                    recorder.main()
                self.assertEqual(caught.exception.code, 2)


class CIReferenceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.programs = self.root / 'programs'
        (self.programs / 'stock').mkdir(parents=True)
        (self.programs / 'stock/bitcoind').write_bytes(b'known CI stock program')
        self.console = ci_recorder.vibes.Console.__new__(ci_recorder.vibes.Console)
        self.console.owns_lab = True
        self.console.reference_dir = self.root / 'reference'
        self.console.reference_dir.mkdir()
        self.console.stock_rev = lambda: 'stock-commit'
        self.console.node_key = lambda revision: 'matching-source-tree'
        self.binary = self.console.reference_dir / 'bitcoind'
        self.binary.write_bytes(b'previous auto-adopted variant')
        self.metadata = self.console.reference_dir / 'reference.json'
        self.metadata.write_text(json.dumps({'tree': 'matching-source-tree', 'sha': 'stock-commit'}))

    def test_same_tree_cached_reference_is_replaced_by_known_stock(self):
        self.assertTrue(self.console._capture_reference('stock-commit', self.programs / 'stock'))
        self.assertEqual(self.binary.read_bytes(), b'previous auto-adopted variant')
        ci_recorder.prepare_reference(self.console, self.programs)
        self.assertTrue(self.console.reference_state()['ready'])
        self.assertEqual(self.binary.read_bytes(), b'known CI stock program')

    def test_unowned_lab_reference_is_never_changed(self):
        self.console.owns_lab = False
        with self.assertRaisesRegex(RuntimeError, 'owns this lab'):
            ci_recorder.prepare_reference(self.console, self.programs)
        self.assertEqual(self.binary.read_bytes(), b'previous auto-adopted variant')
        self.assertTrue(self.metadata.exists())

    def test_a_corrupt_copy_is_not_left_marked_ready(self):
        capture = self.console._capture_reference
        def corrupt_copy(*args):
            result = capture(*args)
            self.binary.write_bytes(b'corrupt copy')
            return result
        with patch.object(self.console, '_capture_reference', corrupt_copy), \
                self.assertRaisesRegex(RuntimeError, 'does not match'):
            ci_recorder.prepare_reference(self.console, self.programs)
        self.assertFalse(self.console.reference_state()['ready'])


if __name__ == '__main__':
    unittest.main()
