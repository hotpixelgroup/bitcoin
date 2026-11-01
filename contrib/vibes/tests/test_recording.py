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


class RecordingTests(unittest.TestCase):
    def record(self, incomplete=False):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / '.vibes').mkdir()
            (root / '.vibes/key').write_text('test-only-key')
            target = root / 'recordings.js'
            target.write_text('previous complete recordings\n')
            shares = []
            def request(req, **_):
                if req.data:
                    shares.append(json.loads(req.data)['share'])
                    result = {'job': {'id': 'recording-job'}}
                elif req.full_url.endswith('/api/status'):
                    result = {'job': {'id': 'recording-job', 'state': 'done'}}
                else:
                    result = {'summary': {'state': 'done', 'test_status': 'not run',
                        'compare': {'headline': 'observed result', 'verdict': 'tightened',
                                    'share': shares[-1], 'observed_answer': 'own',
                                    'rows': [{'status': 'error' if incomplete and shares[-1] == 15 else 'same'}]}}}
                return io.BytesIO(json.dumps(result).encode())
            item = {'id': 'power', 'kind': 'scene', 'answer': None,
                    'slider': {'min': 10, 'max': 20, 'step': 5}}
            args = ['record_demo.py', '--repo', str(root), '--url', 'http://test.invalid',
                    '--out', str(target), '--ready']
            with patch.object(sys, 'argv', args), patch.object(recorder.lessons, 'CURATED', (item,)), \
                    patch.object(recorder.urllib.request, 'urlopen', request), contextlib.redirect_stdout(io.StringIO()):
                if incomplete:
                    with self.assertRaisesRegex(SystemExit, 'incomplete observation'):
                        recorder.main()
                    self.assertEqual(target.read_text(), 'previous complete recordings\n')
                else:
                    recorder.main()
                    text = target.read_text()
                    self.assertIn('"power@15"', text)
                    self.assertIn('"unit_failures": null', text)
            return shares

    def test_every_slider_position_gets_its_own_recording(self):
        self.assertEqual(self.record(), [10, 15, 20])

    def test_incomplete_run_never_replaces_existing_recordings(self):
        self.assertEqual(self.record(incomplete=True), [10, 15])


if __name__ == '__main__':
    unittest.main()
