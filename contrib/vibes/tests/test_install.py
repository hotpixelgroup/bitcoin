"""The installer, the launcher and the update path, without a network.

Every test builds tiny throwaway git repositories and points the real
install.sh at them. Nothing is installed and nothing outside a temporary
folder is touched.
"""
import hashlib
import os
from pathlib import Path
import platform
import subprocess
import tarfile
import tempfile
import unittest

VIBES_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = VIBES_DIR.parents[1]
INSTALL = VIBES_DIR / 'install.sh'
LAUNCHER = VIBES_DIR / 'macos/launcher.sh'
SHELL_SCRIPTS = (INSTALL, LAUNCHER, VIBES_DIR / 'macos/build-app.sh',
                 VIBES_DIR / 'docker-entrypoint.sh', REPO_ROOT / 'vibes')
GIT_ENV = {'GIT_AUTHOR_NAME': 'QA', 'GIT_AUTHOR_EMAIL': 'qa@example.invalid',
           'GIT_COMMITTER_NAME': 'QA', 'GIT_COMMITTER_EMAIL': 'qa@example.invalid',
           'GIT_CONFIG_GLOBAL': os.devnull, 'GIT_CONFIG_SYSTEM': os.devnull}


def git(cwd, *args):
    return subprocess.check_output(['git', '-C', str(cwd), *args], stderr=subprocess.STDOUT,
                                   env={**os.environ, **GIT_ENV}).decode().strip()


class StaticChecks(unittest.TestCase):
    def test_shell_scripts_parse(self):
        for script in SHELL_SCRIPTS:
            done = subprocess.run(['sh', '-n', str(script)], capture_output=True, text=True)
            self.assertEqual(done.returncode, 0, f'{script}: {done.stderr}')

    def test_release_stamp_line_exists_exactly_once(self):
        for script in (INSTALL, LAUNCHER):
            lines = [line for line in script.read_text().splitlines() if line == 'PINNED_REF=""']
            self.assertEqual(len(lines), 1, script)

    def test_launcher_never_updates_by_itself(self):
        text = LAUNCHER.read_text()
        self.assertNotIn('fetch --depth', text)
        self.assertNotIn('merge --ff-only', text)
        self.assertEqual(text.count('git -C "$SRC" fetch'), 0)

    def test_installer_does_not_run_another_installer_unasked(self):
        text = INSTALL.read_text()
        # The only place the third-party installer is piped to a shell sits
        # behind an explicit yes read from the terminal.
        self.assertEqual(text.count('| bash'), 2)       # the printed command, and the guarded run
        self.assertIn('read -r reply < /dev/tty', text)

    def test_dry_run_creates_nothing(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / 'never'
            done = subprocess.run(['sh', str(INSTALL)], capture_output=True, text=True,
                                  env={**os.environ, 'VIBES_DRY_RUN': '1', 'VIBES_DIR': str(dest)})
            self.assertEqual(done.returncode, 0, done.stderr)
            self.assertFalse(dest.exists())


class UpdateTests(unittest.TestCase):
    """Re-running the installer on an existing checkout."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.origin = root / 'origin'
        self.dest = root / 'checkout'
        self.origin.mkdir()
        git(self.origin, 'init', '-q', '-b', 'master')
        self.commit_upstream('first')
        self.commit_upstream('second')
        out = self.install()
        self.assertTrue((self.dest / '.git').is_dir(), out)

    def tearDown(self):
        self.tmp.cleanup()

    def commit_upstream(self, text):
        (self.origin / 'file.txt').write_text(text + '\n')
        git(self.origin, 'add', '-A')
        git(self.origin, 'commit', '-q', '-m', text)

    def install(self, **extra):
        env = {**os.environ, **GIT_ENV, 'VIBES_INSTALL_ONLY': 'fetch', 'NO_COLOR': '1',
               'VIBES_REPO': 'file://' + str(self.origin), 'VIBES_DIR': str(self.dest),
               'VIBES_REF': 'master', **extra}
        done = subprocess.run(['sh', str(INSTALL)], capture_output=True, text=True, env=env)
        self.assertEqual(done.returncode, 0, done.stdout + done.stderr)
        return done.stdout + done.stderr

    def test_the_checkout_is_shallow_like_a_real_install(self):
        self.assertEqual(git(self.dest, 'rev-parse', '--is-shallow-repository'), 'true')
        self.assertEqual(git(self.dest, 'rev-list', '--count', 'HEAD'), '1')

    def test_shallow_checkout_fast_forwards(self):
        """The defect this guards against: a second depth-1 fetch brought a tip
        with no known parent, and git refused to merge "unrelated histories"."""
        self.commit_upstream('third')
        out = self.install()
        self.assertIn('fast-forwarded', out)
        self.assertEqual((self.dest / 'file.txt').read_text(), 'third\n')
        self.assertEqual(git(self.dest, 'rev-parse', 'HEAD'), git(self.origin, 'rev-parse', 'HEAD'))

    def test_already_current_says_so(self):
        self.assertIn('already current', self.install())

    def test_saved_experiments_are_left_alone_and_named_truthfully(self):
        (self.dest / 'mine.txt').write_text('experiment\n')
        git(self.dest, 'add', '-A')
        git(self.dest, 'commit', '-q', '-m', 'vibe: my experiment')
        mine = git(self.dest, 'rev-parse', 'HEAD')
        self.commit_upstream('third')
        out = self.install()
        self.assertEqual(git(self.dest, 'rev-parse', 'HEAD'), mine)
        self.assertIn('1 saved experiment', out)
        self.assertIn('Update button', out)
        self.assertNotIn('fast-forwarded', out)

    def test_uncommitted_changes_are_reported_as_such(self):
        (self.dest / 'file.txt').write_text('edited by hand\n')
        self.commit_upstream('third')
        out = self.install()
        self.assertIn('uncommitted changes', out)
        self.assertEqual((self.dest / 'file.txt').read_text(), 'edited by hand\n')

    def test_unreachable_origin_is_not_blamed_on_the_operator(self):
        self.commit_upstream('third')
        git(self.dest, 'remote', 'set-url', 'origin', 'file://' + str(self.origin) + '-gone')
        out = self.install()
        self.assertIn('could not reach origin', out)
        self.assertNotIn('local', out.lower().replace('local branch', ''))

    def test_release_tag_install_gets_a_branch_to_commit_on(self):
        git(self.origin, 'tag', 'v1.0-1')
        dest = Path(self.tmp.name) / 'tagged'
        self.dest = dest
        self.install(VIBES_REF='v1.0-1')
        self.assertEqual(git(dest, 'rev-parse', '--abbrev-ref', 'HEAD'), 'vibes')
        self.assertEqual(git(dest, 'describe', '--tags', '--exact-match', 'HEAD'), 'v1.0-1')


class PrebuiltTests(unittest.TestCase):
    """A ready-made node is used only if it matches its published SHA-256,
    unpacks inside its own folder and records this exact commit."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.dest = root / 'checkout'
        self.dest.mkdir()
        git(self.dest, 'init', '-q', '-b', 'master')
        (self.dest / 'file.txt').write_text('source\n')
        git(self.dest, 'add', '-A')
        git(self.dest, 'commit', '-q', '-m', 'source')
        self.commit = git(self.dest, 'rev-parse', 'HEAD')
        self.served = root / 'served'
        self.served.mkdir()
        machine = platform.machine()
        system = platform.system()
        self.slug = {('Darwin', 'arm64'): 'macos-arm64', ('Darwin', 'x86_64'): 'macos-x86_64',
                     ('Linux', 'x86_64'): 'linux-x86_64', ('Linux', 'aarch64'): 'linux-arm64',
                     ('Linux', 'arm64'): 'linux-arm64'}.get((system, machine))
        if not self.slug:
            self.skipTest('no prebuilt node is published for this platform')

    def tearDown(self):
        self.tmp.cleanup()

    def publish(self, commit=None, member_prefix=None, checksum=None):
        folder = f'vibes-node-{self.slug}'
        stage = Path(self.tmp.name) / 'stage' / folder
        stage.mkdir(parents=True, exist_ok=True)
        (stage / 'COMMIT').write_text((commit or self.commit) + '\n')
        for name in ('bitcoind', 'bitcoin-cli'):
            (stage / name).write_text('#!/bin/sh\nexit 0\n')
            (stage / name).chmod(0o755)
        archive = self.served / f'{folder}.tar.gz'
        with tarfile.open(archive, 'w:gz') as tar:
            for path in sorted(stage.iterdir()):
                tar.add(path, arcname=f'{member_prefix or folder}/{path.name}')
        digest = checksum or hashlib.sha256(archive.read_bytes()).hexdigest()
        (self.served / f'{folder}.tar.gz.sha256').write_text(f'{digest}  {folder}.tar.gz\n')

    def run_installer(self):
        env = {**os.environ, **GIT_ENV, 'VIBES_INSTALL_ONLY': 'prebuilt', 'NO_COLOR': '1',
               'VIBES_DIR': str(self.dest), 'VIBES_PREBUILT_URL': 'file://' + str(self.served)}
        done = subprocess.run(['sh', str(INSTALL)], capture_output=True, text=True, env=env)
        return done.returncode, done.stdout + done.stderr

    def test_matching_archive_is_used(self):
        self.publish()
        code, out = self.run_installer()
        self.assertEqual(code, 0, out)
        self.assertTrue((self.dest / 'build/bin/bitcoind').is_file())
        self.assertIn('not an independent signature', out)
        # The commit it was built from goes along, so the console can adopt it
        # as the unmodified reference node.
        self.assertEqual((self.dest / 'build/bin/COMMIT').read_text().strip(), self.commit)

    def test_tampered_archive_is_refused(self):
        self.publish(checksum='0' * 64)
        code, out = self.run_installer()
        self.assertNotEqual(code, 0)
        self.assertIn('does not match its published SHA-256', out)
        self.assertFalse((self.dest / 'build/bin/bitcoind').exists())

    def test_archive_without_a_checksum_is_refused(self):
        self.publish()
        (self.served / f'vibes-node-{self.slug}.tar.gz.sha256').unlink()
        code, out = self.run_installer()
        self.assertNotEqual(code, 0)
        self.assertFalse((self.dest / 'build/bin/bitcoind').exists())

    def test_archive_built_from_other_source_is_refused(self):
        self.publish(commit='f' * 40)
        code, out = self.run_installer()
        self.assertNotEqual(code, 0)
        self.assertIn('different source', out)

    def test_archive_that_escapes_its_folder_is_refused(self):
        self.publish(member_prefix='../outside')
        code, out = self.run_installer()
        self.assertNotEqual(code, 0)
        self.assertFalse((Path(self.tmp.name) / 'outside').exists())


if __name__ == '__main__':
    unittest.main(verbosity=2)
