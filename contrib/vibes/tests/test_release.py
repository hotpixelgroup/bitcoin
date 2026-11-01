"""Release manifests and launcher upgrade notices; no native node is executed."""
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import struct
import subprocess
import sys
import tarfile
import tempfile
import unittest

from test_install import GIT_ENV, LAUNCHER, git
import verify_release as release


class ReleaseAssetTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.assets = self.root / 'assets'
        self.assets.mkdir()
        self.source = self.root / 'source'
        (self.source / 'experiments').mkdir(parents=True)
        self.commit = 'a' * 40
        self.tag = 'v31.99-9'
        for patch in release.PATCHES:
            (self.source / 'experiments' / (patch + '.diff')).write_text(patch + '\n')
        for platform in release.PLATFORMS:
            for kind in ('node', 'variants'):
                self.make_archive(kind, platform)
        (self.assets / 'BitcoinVibes.dmg').write_bytes(b'image fixture' + bytes(4096))
        (self.assets / 'install.sh').write_text('#!/bin/sh\nPINNED_REF="v31.99-9"\n#' + 'x' * 1024 + '\n')
        self.write_manifest()

    def program(self, platform, library='/usr/lib/libSystem.B.dylib', minimum=15 << 16, rpath=None):
        data = bytearray(1024)
        if platform.startswith('linux'):
            data[:6] = b'\x7fELF\x02\x01'
            struct.pack_into('<H', data, 18, 62 if platform == 'linux-x86_64' else 183)
        else:
            name = library.encode() + b'\0'
            length = (24 + len(name) + 7) // 8 * 8
            load = struct.pack('<IIIIII', 0xc, length, 24, 0, 0, 0) + name
            load += bytes(length - len(load))
            build = struct.pack('<IIIIII', 0x32, 24, 1, minimum, 26 << 16, 0)
            commands = load + build
            if rpath:
                value = rpath.encode() + b'\0'
                length = (12 + len(value) + 7) // 8 * 8
                extra = struct.pack('<III', 0x8000001c, length, 12) + value
                commands += extra + bytes(length - len(extra))
            header = struct.pack('<IiiIIIII', 0xfeedfacf, 0x0100000c, 0, 2, 3 if rpath else 2, len(commands), 0, 0)
            data[:len(header + commands)] = header + commands
        return bytes(data)

    def make_archive(self, kind, platform, commit=None, patch_digest=None, extra=None, native_platform=None, program_data=None):
        name = f'vibes-{kind}-{platform}'
        members = {name + '/COMMIT': ((commit or self.commit) + '\n').encode()}
        if kind == 'node':
            members.update({name + '/' + item: program_data or self.program(native_platform or platform) for item in ('bitcoind', 'bitcoin-cli')})
        else:
            members[name + '/PATCHES'] = ''.join(
                f'{patch_digest or release.digest(self.source / "experiments" / (patch + ".diff"))}  {patch}\n'
                for patch in release.PATCHES).encode()
            members.update({f'{name}/{patch}/bitcoind': program_data or self.program(native_platform or platform) for patch in release.PATCHES})
        members.update(extra or {})
        archive = self.assets / (name + '.tar.gz')
        with tarfile.open(archive, 'w:gz') as target:
            for path, data in members.items():
                info = tarfile.TarInfo(path)
                info.size, info.mode = len(data), 0o755 if path.endswith(('bitcoind', 'bitcoin-cli')) else 0o644
                target.addfile(info, io.BytesIO(data))
        (self.assets / (archive.name + '.sha256')).write_text(release.digest(archive) + '  ' + archive.name + '\n')

    def write_manifest(self):
        names = release.expected_assets() - {'SHA256SUMS'}
        (self.assets / 'SHA256SUMS').write_text(''.join(
            release.digest(self.assets / name) + '  ' + name + '\n' for name in sorted(names) if (self.assets / name).exists()))

    def verify(self):
        release.verify_assets(self.assets, self.tag, self.commit, self.source)

    def test_complete_manifest_validates_all_three_platforms(self):
        self.assertEqual(len(release.expected_assets()), 15)
        self.verify()
        self.assertEqual(release.release_version(self.tag), '31.99.9')

    def test_missing_or_extra_assets_are_rejected_before_publication(self):
        (self.assets / 'unexpected.txt').write_text('no\n')
        with self.assertRaisesRegex(ValueError, 'unexpected'):
            self.verify()
        (self.assets / 'unexpected.txt').unlink()
        (self.assets / 'vibes-node-linux-arm64.tar.gz').unlink()
        with self.assertRaisesRegex(ValueError, 'missing'):
            self.verify()

    def test_modified_download_fails_checksum(self):
        with (self.assets / 'install.sh').open('a') as target:
            target.write('# changed\n')
        with self.assertRaisesRegex(ValueError, 'checksum mismatch'):
            self.verify()

    def test_wrong_source_or_patch_metadata_fails_even_with_matching_checksums(self):
        self.make_archive('node', 'linux-x86_64', commit='b' * 40)
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, 'different commit'):
            self.verify()
        self.make_archive('node', 'linux-x86_64')
        self.make_archive('variants', 'linux-arm64', patch_digest='b' * 64)
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, 'Patch digest'):
            self.verify()

    def test_wrong_architecture_and_unsafe_members_are_rejected(self):
        self.make_archive('node', 'linux-x86_64', native_platform='linux-arm64')
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, 'architecture'):
            self.verify()
        self.make_archive('node', 'linux-x86_64', extra={'../escape': b'bad'})
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, 'Unsafe'):
            self.verify()

    def test_mac_archives_reject_homebrew_libraries_even_when_checksums_match(self):
        program = self.program('macos-arm64', library='/opt/homebrew/opt/sqlite/lib/libsqlite3.0.dylib')
        self.make_archive('node', 'macos-arm64', program_data=program)
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, 'system-only libraries'):
            self.verify()

    def test_mac_archives_require_the_documented_minimum_os(self):
        for minimum in (12 << 16, 16 << 16):
            program = self.program('macos-arm64', minimum=minimum)
            self.make_archive('variants', 'macos-arm64', program_data=program)
            self.write_manifest()
            with self.assertRaisesRegex(ValueError, 'minimum OS'):
                self.verify()

    def test_mac_archives_reject_homebrew_runtime_search_paths(self):
        program = self.program('macos-arm64', rpath='/opt/homebrew/lib')
        self.make_archive('node', 'macos-arm64', program_data=program)
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, 'runtime search path'):
            self.verify()

    def test_installer_must_pin_this_exact_tag_and_checksums_cover_every_asset(self):
        (self.assets / 'install.sh').write_text((self.assets / 'install.sh').read_text().replace(self.tag, 'v31.99-8'))
        self.write_manifest()
        with self.assertRaisesRegex(ValueError, 'PINNED_REF'):
            self.verify()
        (self.assets / 'install.sh').write_text((self.assets / 'install.sh').read_text().replace('v31.99-8', self.tag))
        self.write_manifest()
        lines = (self.assets / 'SHA256SUMS').read_text().splitlines()
        (self.assets / 'SHA256SUMS').write_text('\n'.join(lines[:-1]) + '\n')
        with self.assertRaisesRegex(ValueError, 'every other asset'):
            self.verify()

    def test_native_first_launch_cannot_execute_on_a_developer_machine(self):
        from unittest.mock import patch
        with patch.dict(os.environ, {'GITHUB_ACTIONS': 'false'}):
            with self.assertRaisesRegex(ValueError, 'isolated GitHub Actions'):
                release.first_launch_smoke(None, None, self.tag, self.commit, 'macos-arm64', 'hotpixelgroup/bitcoin', 'file:///tmp')

    def test_native_public_smoke_cannot_execute_on_a_developer_machine(self):
        from unittest.mock import patch
        with patch.dict(os.environ, {'GITHUB_ACTIONS': 'false'}):
            with self.assertRaisesRegex(ValueError, 'isolated GitHub Actions'):
                release.public_smoke(self.tag, self.commit, 'macos-arm64', 'hotpixelgroup/bitcoin')


class LauncherReleaseTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.origin = self.root / 'origin'
        (self.origin / 'contrib/vibes').mkdir(parents=True)
        (self.origin / '.gitignore').write_text('.vibes/\n')
        self.console = self.origin / 'contrib/vibes/bitcoin-vibes'
        git(self.origin, 'init', '-q', '-b', 'master')
        self.commit('old')
        git(self.origin, 'tag', 'v31.99-8')
        self.old = git(self.origin, 'rev-parse', 'HEAD')
        self.commit('new')
        self.new = git(self.origin, 'rev-parse', 'HEAD')
        git(self.origin, 'tag', 'v31.99-9')
        self.support = self.root / 'Application Support'
        self.tools = self.root / 'tools'
        self.tools.mkdir()
        dialogs = self.tools / 'osascript'
        dialogs.write_text('#!/bin/sh\nprintf "%s\\n" "$*" >> "$DIALOG_LOG"\ncat >> "$DIALOG_LOG"\n')
        dialogs.chmod(0o755)
        self.launcher = self.root / 'launcher.sh'
        text = LAUNCHER.read_text().replace('PINNED_REF=""', 'PINNED_REF="v31.99-9"')
        text = text.replace('PINNED_COMMIT=""', f'PINNED_COMMIT="{self.new}"')
        # Only the disposable test copy replaces Finder's fixed PATH, allowing
        # a dialog stub while retaining the real local git and Python tools.
        text = '\n'.join('PATH="$VIBES_TEST_PATH"' if line.startswith('PATH=') else line for line in text.splitlines()) + '\n'
        self.launcher.write_text(text)
        self.dialogs = self.root / 'dialogs.log'
        self.result = self.root / 'result.json'

    def commit(self, version):
        self.console.write_text('import json,os\nopen(os.environ["LAUNCH_RESULT"], "w").write(json.dumps(' + repr(version) + '))\n')
        git(self.origin, 'add', '.')
        git(self.origin, 'commit', '-q', '-m', version)

    def launch(self, expect=0, **extra):
        env = {**os.environ, **GIT_ENV, 'VIBES_HOME': str(self.support), 'VIBES_REPO': 'file://' + str(self.origin),
               'VIBES_TEST_PATH': str(self.tools) + os.pathsep + os.environ['PATH'],
               'DIALOG_LOG': str(self.dialogs), 'LAUNCH_RESULT': str(self.result), **extra}
        env.pop('VIBES_REF', None)
        env.pop('VIBES_BRANCH', None)
        result = subprocess.run(['sh', self.launcher], capture_output=True, text=True, env=env)
        self.assertEqual(result.returncode, expect, result.stdout + result.stderr + ((self.support / 'launch.log').read_text() if (self.support / 'launch.log').exists() else ''))
        return json.loads(self.result.read_text()) if self.result.exists() else None

    def test_fresh_app_fetches_its_release_and_opens_the_matching_console(self):
        self.assertEqual(self.launch(), 'new')
        self.assertEqual(git(self.support / 'source', 'rev-parse', 'HEAD'), self.new)
        self.assertNotIn('existing lab uses different source', self.dialogs.read_text())
        self.assertIn('display notification', self.dialogs.read_text())
        self.assertNotIn('display dialog', self.dialogs.read_text())

    def test_existing_lab_is_preserved_with_one_explicit_update_notice(self):
        self.support.mkdir()
        source = self.support / 'source'
        subprocess.run(['git', 'clone', '-q', '--depth', '1', '--branch', 'v31.99-8',
                        'file://' + str(self.origin), str(source)], check=True, capture_output=True)
        (source / '.vibes').mkdir()
        saved = source / '.vibes/learning.json'
        saved.write_text('["keep my learning record"]\n')
        self.assertEqual(self.launch(), 'old')
        self.assertEqual(self.launch(), 'old')
        self.assertEqual(git(source, 'rev-parse', 'HEAD'), self.old)
        self.assertEqual(saved.read_text(), '["keep my learning record"]\n')
        text = self.dialogs.read_text()
        self.assertEqual(text.count('existing lab uses different source'), 1)
        self.assertIn('Check for and take updates', text)
        self.assertNotIn('older', text)

    def test_experiments_on_top_of_this_release_do_not_trigger_a_wrong_version_notice(self):
        self.launch()
        source = self.support / 'source'
        (source / 'notes.txt').write_text('my experiment\n')
        git(source, 'add', '.')
        git(source, 'commit', '-q', '-m', 'vibe: my experiment')
        self.assertEqual(self.launch(), 'new')
        self.assertNotIn('existing lab uses different source', self.dialogs.read_text())


    def test_unwritable_lab_folder_reports_a_native_error(self):
        stub = self.tools / 'mkdir'
        stub.write_text('#!/bin/sh\nexit 1\n')
        stub.chmod(0o755)
        self.launch(expect=1)
        self.assertIn('Could not create the Bitcoin Vibes lab folder', self.dialogs.read_text())
        self.assertFalse((self.support / 'source').exists())

    def test_failed_clone_can_be_retried_without_a_partial_source_folder(self):
        self.launch(expect=1, VIBES_REPO='file://' + str(self.origin) + '-missing')
        self.assertFalse((self.support / 'source').exists())
        self.assertFalse(list(self.support.glob('source.download.*')))
        self.assertIn('reopen the app to retry', self.dialogs.read_text())
        self.assertEqual(self.launch(), 'new')

    def test_incomplete_existing_source_is_preserved(self):
        source = self.support / 'source'
        source.mkdir(parents=True)
        (source / 'my-saved-work.txt').write_text('keep my work')
        self.launch(expect=1)
        self.assertEqual((source / 'my-saved-work.txt').read_text(), 'keep my work')
        self.assertIn('Your files have been kept', self.dialogs.read_text())

    def test_git_stub_on_path_is_not_mistaken_for_working_git(self):
        stub = self.tools / 'git'
        stub.write_text('#!/bin/sh\nexit 69\n')
        stub.chmod(0o755)
        self.launch(expect=1)
        self.assertFalse((self.support / 'source').exists())
        self.assertIn('needs working git', self.dialogs.read_text())
        self.assertIn('xcode-select --install', self.dialogs.read_text())

    def test_python_stub_on_path_is_not_mistaken_for_working_python(self):
        stub = self.tools / 'python3'
        stub.write_text('#!/bin/sh\nexit 69\n')
        stub.chmod(0o755)
        # Remove real fallback paths from the disposable copy only. The
        # product tries them so a broken PATH tool need not prevent launch.
        text = self.launcher.read_text()
        text = text.replace(' /opt/homebrew/bin/python3 /usr/local/bin/python3 /usr/bin/python3;', ';')
        self.launcher.write_text(text)
        self.launch(expect=1)
        self.assertFalse((self.support / 'source').exists())
        self.assertIn('needs working Python', self.dialogs.read_text())


if __name__ == '__main__':
    unittest.main()
