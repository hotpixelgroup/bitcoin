"""Exercise installed-build reuse and container bootstrap in disposable folders."""
import os
from pathlib import Path
import subprocess
import shutil
import tempfile
import unittest

from test_install import GIT_ENV, INSTALL, VIBES_DIR, git


class InstalledBuildTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.repo = self.root / 'checkout'
        self.repo.mkdir()
        (self.repo / '.gitignore').write_text('build/\n')
        (self.repo / 'source.txt').write_text('stock\n')
        git(self.repo, 'init', '-q', '-b', 'test')
        git(self.repo, 'add', '.')
        git(self.repo, 'commit', '-q', '-m', 'stock')
        self.sha = git(self.repo, 'rev-parse', 'HEAD')
        self.programs = self.repo / 'build/bin'
        self.programs.mkdir(parents=True)
        for name in ('bitcoind', 'bitcoin-cli'):
            program = self.programs / name
            program.write_text('#!/bin/sh\nexit 0\n')
            program.chmod(0o755)
        self.tools = self.root / 'tools'
        self.tools.mkdir()
        cmake = self.tools / 'cmake'
        cmake.write_text('#!/bin/sh\nprintf "%s\\n" "$*" >> "$CMAKE_LOG"\n')
        cmake.chmod(0o755)
        self.log = self.root / 'cmake.log'

    def build(self):
        return subprocess.run(['sh', str(INSTALL)], capture_output=True, text=True, env={
            **os.environ, **GIT_ENV, 'PATH': str(self.tools) + os.pathsep + os.environ['PATH'],
            'VIBES_INSTALL_ONLY': 'build', 'VIBES_NO_PREBUILT': '1',
            'VIBES_DIR': str(self.repo), 'CMAKE_LOG': str(self.log), 'NO_COLOR': '1',
        }, check=True).stdout

    def test_only_a_complete_matching_build_is_reused(self):
        (self.programs / 'COMMIT').write_text(self.sha + '\n')
        self.assertIn('exact source: skipping', self.build())
        self.assertFalse(self.log.exists())
        (self.programs / 'bitcoin-cli').unlink()
        self.build()
        self.assertIn('--build', self.log.read_text())

    def test_stale_or_unrecorded_programs_are_rebuilt(self):
        for stamp in (None, '0' * 40):
            if stamp:
                (self.programs / 'COMMIT').write_text(stamp + '\n')
            self.build()
            self.assertIn('--build', self.log.read_text())
            self.assertEqual((self.programs / 'COMMIT').read_text().strip(), self.sha)
            self.log.unlink()

    def test_dirty_source_is_never_labelled_as_an_exact_commit(self):
        (self.programs / 'COMMIT').write_text(self.sha + '\n')
        (self.repo / 'source.txt').write_text('local edit\n')
        self.build()
        self.assertTrue(self.log.exists())
        self.assertFalse((self.programs / 'COMMIT').exists())

    def test_failed_git_status_cannot_vouch_for_a_clean_build(self):
        real_git = shutil.which('git')
        wrapper = self.tools / 'git'
        wrapper.write_text('#!/bin/sh\ncase "$*" in *"status --porcelain"*) exit 1 ;; esac\n'
                           + 'exec "' + real_git + '" "$@"\n')
        wrapper.chmod(0o755)
        (self.programs / 'COMMIT').write_text(self.sha + '\n')
        self.build()
        self.assertTrue(self.log.exists())
        self.assertFalse((self.programs / 'COMMIT').exists())


class ContainerBootstrapTests(unittest.TestCase):
    def test_programs_are_attributed_to_the_initial_commit_and_state_survives(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            image, work = root / 'image', root / 'work'
            (image / 'build/bin').mkdir(parents=True)
            (image / 'contrib/vibes').mkdir(parents=True)
            (image / '.gitignore').write_text('build/\n')
            (image / 'source.txt').write_text('shipped source\n')
            (image / 'build/bin/bitcoind').write_text('shipped node\n')
            (image / 'contrib/vibes/bitcoin-vibes').write_text('print("console started")\n')
            work.mkdir()
            env = {**os.environ, **GIT_ENV, 'VIBES_IMAGE': str(image), 'VIBES_WORK': str(work)}
            def start():
                return subprocess.run(['sh', str(VIBES_DIR / 'docker-entrypoint.sh')],
                                      capture_output=True, text=True, env=env, check=True).stdout
            self.assertIn('console started', start())
            initial = git(work, 'rev-parse', 'HEAD')
            self.assertEqual((work / 'build/bin/COMMIT').read_text().strip(), initial)
            (work / 'source.txt').write_text('saved experiment\n')
            git(work, 'add', '.')
            git(work, 'commit', '-q', '-m', 'vibe: local experiment')
            self.assertIn('console started', start())
            self.assertEqual((work / 'source.txt').read_text(), 'saved experiment\n')
            self.assertEqual((work / 'build/bin/COMMIT').read_text().strip(), initial)


class SiteBuildTests(unittest.TestCase):
    def test_output_cannot_overlap_the_source_tree(self):
        script = VIBES_DIR / 'build_site.py'
        for target in (VIBES_DIR, VIBES_DIR.parent, VIBES_DIR / 'web/generated-test-output'):
            result = subprocess.run([os.environ.get('PYTHON', 'python3'), str(script), '--out', str(target)],
                                    capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('separate directory', result.stderr)
        self.assertFalse((VIBES_DIR / 'web/generated-test-output').exists())


if __name__ == '__main__':
    unittest.main()
