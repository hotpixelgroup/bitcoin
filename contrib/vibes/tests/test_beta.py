"""Beta distribution policy and the instructions testers actually follow.

GitHub calls are replaced by a recorder; no release or issue is created.
The Mac fixture builds an ad-hoc launcher but never runs Bitcoin programs.
"""
import hashlib
import json
import os
from pathlib import Path
import plistlib
import re
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[3]


def step(name):
    source = (ROOT / '.github/workflows/release.yml').read_text()
    match = re.search(r'^      - name: ' + re.escape(name) + r'\n(.*?)(?=^      - (?:name:|uses:)|^  [a-z][a-z_-]*:|\Z)', source, re.M | re.S)
    block = match[1].split('        run: |\n', 1)[1]
    lines = []
    for line in block.splitlines():
        if line and not line.startswith('          '):
            break
        lines.append(line[10:] if line else '')
    return '\n'.join(lines).replace('${{ matrix.slug }}', 'linux-x86_64') + '\n'


class BetaPolicyTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.tools = self.root / 'tools'
        self.tools.mkdir()
        self.calls = self.root / 'calls.jsonl'
        self.env = {**os.environ, 'PATH': str(self.tools) + os.pathsep + os.environ['PATH'],
                    'TAG': 'beta-v31.99-11', 'PRERELEASE': 'true', 'GITHUB_SHA': 'a' * 40,
                    'GITHUB_REPOSITORY': 'example/repository', 'CALLS': str(self.calls), 'ATTACHED': '3'}
        (self.root / 'assets').mkdir()
        for number in range(3):
            (self.root / 'assets' / str(number)).write_text('fixture')
        self.tool('gh', '''
with open(os.environ['CALLS'], 'a') as out: out.write(json.dumps(sys.argv[1:]) + '\\n')
if sys.argv[1:3] == ['release', 'view']: print(os.environ['ATTACHED'])
''')
        self.tool('git', 'print("a" * 40)')
        self.tool('uname', 'print("x86_64")')

    def tool(self, name, body):
        path = self.tools / name
        path.write_text('#!/usr/bin/env python3\nimport json, os, sys\n' + body)
        path.chmod(0o755)

    def execute(self, name, **env):
        return subprocess.run(['bash', '-c', step(name)], cwd=self.root, env={**self.env, **env},
                              text=True, capture_output=True, timeout=10)

    def test_beta_and_stable_tags_cannot_be_dispatched_in_the_wrong_channel(self):
        for tag, channel, valid in (('beta-v31.99-11', 'true', True), ('v31.99-10', 'false', True),
                                    ('beta-v31.99-11', 'false', False), ('v31.99-11', 'true', False),
                                    ('beta-v31.99-11', 'invalid', False)):
            with self.subTest(tag=tag, channel=channel):
                result = self.execute('Verify the immutable release target and runner architecture', TAG=tag, PRERELEASE=channel)
                self.assertEqual(result.returncode == 0, valid, result.stdout + result.stderr)

    def test_beta_publication_does_not_promote_latest(self):
        for channel, flags in (('true', ('--prerelease=true', '--latest=false')),
                               ('false', ('--prerelease=false', '--latest=true'))):
            with self.subTest(channel=channel):
                self.calls.unlink(missing_ok=True)
                result = self.execute('Publish the release', PRERELEASE=channel)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                edits = [row for row in map(json.loads, self.calls.read_text().splitlines()) if row[:2] == ['release', 'edit']]
                self.assertEqual(len(edits), 1)
                for flag in flags:
                    self.assertIn(flag, edits[0])

    def test_partial_assets_or_invalid_channel_never_publish(self):
        for env in ({'ATTACHED': '2'}, {'PRERELEASE': 'unknown'}):
            with self.subTest(env=env):
                self.calls.unlink(missing_ok=True)
                result = self.execute('Publish the release', **env)
                self.assertNotEqual(result.returncode, 0)
                rows = list(map(json.loads, self.calls.read_text().splitlines())) if self.calls.exists() else []
                self.assertFalse(any(row[:2] == ['release', 'edit'] for row in rows))


class TesterInstructionTests(unittest.TestCase):
    def test_checksum_instructions_detect_tampering_even_with_python_optimization(self):
        text = (ROOT / 'doc/vibes-beta.md').read_text()
        snippet = text.split("python3 - <<'PY'\n", 1)[1].split('\nPY\n', 1)[0]
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            content = b'installer fixture\n'
            checksum = hashlib.sha256(content).hexdigest()
            for data, manifest, valid in ((content, checksum + '  install.sh\n', True),
                                         (b'changed', checksum + '  install.sh\n', False),
                                         (content, checksum + '  other.sh\n', False),
                                         (content, (checksum + '  install.sh\n') * 2, False)):
                with self.subTest(valid=valid, manifest=manifest):
                    (root / 'install.sh').write_bytes(data)
                    (root / 'SHA256SUMS').write_text(manifest)
                    result = subprocess.run([sys.executable, '-c', snippet], cwd=root,
                        env={**os.environ, 'PYTHONOPTIMIZE': '1'}, capture_output=True, text=True, timeout=10)
                    self.assertEqual(result.returncode == 0, valid, result.stdout + result.stderr)


@unittest.skipUnless(sys.platform == 'darwin', 'Mac bundle metadata needs macOS tools')
class MacBetaBundleTests(unittest.TestCase):
    def test_beta_bundle_identity_and_version_are_distinct(self):
        with tempfile.TemporaryDirectory(prefix='vibes-beta-bundle-') as folder:
            root = Path(folder)
            mac = root / 'contrib/vibes/macos'
            mac.mkdir(parents=True)
            (root / 'CMakeLists.txt').write_text('set(CLIENT_VERSION_MAJOR 31)\nset(CLIENT_VERSION_MINOR 99)\n')
            for name in ('build-app.sh', 'launcher.sh'):
                shutil.copy2(ROOT / 'contrib/vibes/macos' / name, mac / name)
            launcher = (mac / 'launcher.sh').read_text().replace('PINNED_REF=""', 'PINNED_REF="beta-v31.99-11"').replace('PINNED_BETA=""', 'PINNED_BETA="1"')
            (mac / 'launcher.sh').write_text(launcher)
            env = {name: value for name, value in os.environ.items() if not name.startswith('VIBES_')}
            result = subprocess.run(['sh', mac / 'build-app.sh'], cwd=root, env=env,
                                    capture_output=True, text=True, timeout=60)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertFalse((root / 'dist/Bitcoin Vibes.app').exists(), 'beta must not overwrite the stable bundle path')
            with (root / 'dist/Bitcoin Vibes Beta.app/Contents/Info.plist').open('rb') as source:
                info = plistlib.load(source)
            self.assertEqual(info['CFBundleIdentifier'], 'group.hotpixel.bitcoinvibes.beta')
            self.assertEqual(info['CFBundleDisplayName'], 'Bitcoin Vibes Beta')
            self.assertEqual(info['CFBundleVersion'], '31.99.11')
            self.assertEqual(info['LSMinimumSystemVersion'], '15.0')
