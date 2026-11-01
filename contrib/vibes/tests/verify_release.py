#!/usr/bin/env python3
"""Check release contents without executing them; smoke public downloads only on CI.

Pre-publication: --assets DIR --tag TAG --commit SHA [--platform SLUG]
Post-publication: --public --platform SLUG --tag TAG --commit SHA
All native execution is restricted to fresh GitHub Actions runners.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import plistlib
import re
import shutil
import socket
import struct
import subprocess
import sys
import tarfile
import tempfile
import time
import urllib.request

SOURCE = Path(__file__).resolve().parents[1]
PLATFORMS = ('linux-x86_64', 'linux-arm64', 'macos-arm64')
PATCHES = ('double-reward', 'halve-reward', 'faster-halving')
MACOS_MINIMUM = 15 << 16


def require(condition, message):
    if not condition:
        raise ValueError(message)


def release_version(tag):
    match = re.fullmatch(r'v([0-9]+)\.([0-9]+)-([0-9]+)', tag)
    require(match is not None, 'Use a release tag such as v31.99-9')
    return '.'.join(match.groups())


def digest(path):
    result = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            result.update(chunk)
    return result.hexdigest()


def expected_assets(platforms=PLATFORMS):
    result = {'install.sh', 'SHA256SUMS'}
    for platform in platforms:
        for kind in ('node', 'variants'):
            name = f'vibes-{kind}-{platform}.tar.gz'
            result.update((name, name + '.sha256'))
    if 'macos-arm64' in platforms:
        result.add('BitcoinVibes.dmg')
    return result


def checksum_entries(text):
    entries = {}
    for line in text.splitlines():
        match = re.fullmatch(r'([0-9a-fA-F]{64}) [ *]([^/\\\r\n]+)', line)
        require(match is not None, 'Malformed checksum entry')
        sha, name = match.groups()
        require(name not in entries and name not in ('.', '..'), f'Duplicate/invalid checksum name: {name}')
        entries[name] = sha.lower()
    return entries


def verify_pin(text, name, expected):
    values = re.findall(r'^' + re.escape(name) + r'="([^"\r\n]*)"$', text, re.M)
    require(values == [expected], f'{name} must be stamped exactly once as {expected}')


def mac_runtime(data):
    """Inspect load commands without loading or executing the Mach-O image."""
    require(struct.unpack_from('<I', data, 12)[0] == 2, 'Mac program must be a Mach-O executable')
    count, size = struct.unpack_from('<II', data, 16)
    require(0 < count <= 4096 and 32 + size <= len(data), 'Truncated Mach-O load commands')
    offset, end = 32, 32 + size
    libraries, rpaths, minimums = [], [], []
    for _ in range(count):
        require(offset + 8 <= end, 'Truncated Mach-O load command')
        command, length = struct.unpack_from('<II', data, offset)
        require(length >= 8 and offset + length <= end, 'Invalid Mach-O load command size')
        block = data[offset:offset + length]
        kind = command & 0x7fffffff
        if kind in (0xc, 0x18, 0x1f, 0x20, 0x23, 0x1c):
            require(length >= (12 if kind == 0x1c else 24), 'Truncated Mach-O library/rpath command')
            start = struct.unpack_from('<I', block, 8)[0]
            require(0 < start < len(block) and b'\0' in block[start:], 'Invalid Mach-O library/rpath name')
            value = block[start:].split(b'\0', 1)[0].decode()
            (rpaths if kind == 0x1c else libraries).append(value)
        elif kind == 0x32:
            require(length >= 24, 'Truncated Mach-O build version')
            platform, minimum = struct.unpack_from('<II', block, 8)
            require(platform == 1, 'Expected a macOS program')
            minimums.append(minimum)
        elif kind == 0x24:
            require(length >= 16, 'Truncated Mach-O minimum version')
            minimums.append(struct.unpack_from('<I', block, 8)[0])
        offset += length
    require(offset == end, 'Mach-O load command sizes do not match the header')
    require(minimums == [MACOS_MINIMUM], 'Mac program minimum OS must be exactly macOS 15.0')
    def system_path(value):
        return '..' not in PurePosixPath(value).parts and (
            value == '/usr/lib' or value.startswith('/usr/lib/') or
            value == '/System/Library' or value.startswith('/System/Library/'))
    require(libraries and all(system_path(path) for path in libraries),
            f'Mac programs must use system-only libraries: {libraries}')
    require(all(system_path(path) for path in rpaths), f'Mac program has a non-system runtime search path: {rpaths}')
    return {'minimum_macos': '15.0', 'libraries': libraries, 'rpaths': rpaths}


def native_header(data, platform):
    require(len(data) >= 32, f'Truncated native program for {platform}')
    if platform.startswith('linux-'):
        require(data[:6] == b'\x7fELF\x02\x01', f'{platform} needs a 64-bit little-endian ELF program')
        machine = struct.unpack_from('<H', data, 18)[0]
        require(machine == (62 if platform == 'linux-x86_64' else 183), f'Wrong ELF architecture for {platform}')
    else:
        require(data[:4] == b'\xcf\xfa\xed\xfe', 'macos-arm64 needs a thin 64-bit Mach-O program')
        require(struct.unpack_from('<I', data, 4)[0] == 0x0100000c, 'Wrong Mach-O architecture for macos-arm64')
        return mac_runtime(data)


def verify_archive(path, kind, platform, commit, source=SOURCE):
    name = f'vibes-{kind}-{platform}'
    wanted = {f'{name}/COMMIT'}
    if kind == 'node':
        programs = {f'{name}/bitcoind', f'{name}/bitcoin-cli'}
    else:
        wanted.add(f'{name}/PATCHES')
        programs = {f'{name}/{patch}/bitcoind' for patch in PATCHES}
    wanted |= programs
    files = {}
    with tarfile.open(path, 'r:gz') as archive:
        for member in archive.getmembers():
            parts = PurePosixPath(member.name)
            require(bool(parts.parts) and not parts.is_absolute() and '..' not in parts.parts and parts.parts[0] == name,
                    f'Unsafe/unexpected archive path: {member.name}')
            require(member.isdir() or member.isfile(), f'Archive links/devices are not allowed: {member.name}')
            if member.isdir():
                continue
            require(member.name in wanted and member.name not in files, f'Unexpected/duplicate archive member: {member.name}')
            require(0 < member.size < 200 * 1024 * 1024, f'Invalid member size: {member.name}')
            if member.name in programs:
                require(member.mode & 0o111 and member.size >= 1024, f'Program is empty or not executable: {member.name}')
            stream = archive.extractfile(member)
            require(stream is not None, f'Unreadable archive member: {member.name}')
            files[member.name] = stream.read()
    require(set(files) == wanted, f'{path.name} is missing required members: {wanted - set(files)}')
    require(files[f'{name}/COMMIT'].decode().strip() == commit, f'{path.name} was built from a different commit')
    if kind == 'variants':
        patch_lines = files[f'{name}/PATCHES'].decode().splitlines()
        require(len(patch_lines) == len(PATCHES), 'PATCHES must name exactly three variants')
        published = {}
        for line in patch_lines:
            match = re.fullmatch(r'([0-9a-f]{64})  ([a-z-]+)', line)
            require(match is not None and match[2] not in published, 'Malformed/duplicate PATCHES entry')
            published[match[2]] = match[1]
        require(set(published) == set(PATCHES), 'PATCHES names do not match the bundled experiments')
        for patch in PATCHES:
            require(published[patch] == digest(source / 'experiments' / (patch + '.diff')),
                    f'Patch digest does not match this source: {patch}')
    for program in programs:
        metadata = native_header(files[program], platform)
        if metadata:
            print(f'{program}: {json.dumps(metadata, sort_keys=True)}', flush=True)
    return {path: hashlib.sha256(data).hexdigest() for path, data in files.items()}


def verify_assets(folder, tag, commit, source=SOURCE, platform=None):
    release_version(tag)
    require(re.fullmatch(r'[0-9a-f]{40}', commit) is not None, 'Expected a full source commit')
    folder = Path(folder)
    platforms = (platform,) if platform else PLATFORMS
    if platform:
        expected = expected_assets(platforms) - {'install.sh', 'SHA256SUMS'}
        permitted = expected | ({'mac-signing.txt'} if platform == 'macos-arm64' else set())
    else:
        expected = permitted = expected_assets()
    actual = {path.name for path in folder.iterdir()}
    require(expected <= actual <= permitted, f'Release assets differ: missing {expected - actual}; unexpected {actual - permitted}')
    for name in actual:
        path = folder / name
        require(path.is_file() and not path.is_symlink() and path.stat().st_size > 0, f'Asset is not a nonempty plain file: {name}')
    if not platform:
        checksums = checksum_entries((folder / 'SHA256SUMS').read_text())
        require(set(checksums) == expected - {'SHA256SUMS'}, 'SHA256SUMS must cover every other asset exactly once')
        for name, expected_sha in checksums.items():
            require(digest(folder / name) == expected_sha, f'Global checksum mismatch: {name}')
        installer = (folder / 'install.sh').read_text()
        verify_pin(installer, 'PINNED_REF', tag)
        require((folder / 'install.sh').stat().st_size >= 1024, 'Installer is unexpectedly small')
    for slug in platforms:
        for kind in ('node', 'variants'):
            name = f'vibes-{kind}-{slug}.tar.gz'
            checksums = checksum_entries((folder / (name + '.sha256')).read_text())
            require(checksums == {name: digest(folder / name)}, f'Archive checksum mismatch: {name}')
            verify_archive(folder / name, kind, slug, commit, source)
    if 'macos-arm64' in platforms:
        require((folder / 'BitcoinVibes.dmg').stat().st_size >= 4096, 'DMG is unexpectedly small')
    print(f'Verified {len(expected)} assets for {tag} ({commit})', flush=True)


def command(args, **kwargs):
    return subprocess.run([str(arg) for arg in args], check=True, text=True, stdout=subprocess.PIPE,
                          stderr=subprocess.STDOUT, timeout=kwargs.pop('timeout', 180), **kwargs).stdout


def verify_dmg(path, tag, commit):
    require(sys.platform == 'darwin', 'DMG verification needs a macOS runner')
    command(['hdiutil', 'verify', path])
    with tempfile.TemporaryDirectory(prefix='vibes-dmg-') as folder:
        mount = Path(folder) / 'mounted'
        mount.mkdir()
        command(['hdiutil', 'attach', '-readonly', '-nobrowse', '-mountpoint', mount, path])
        try:
            app = mount / 'Bitcoin Vibes.app'
            with (app / 'Contents/Info.plist').open('rb') as stream:
                info = plistlib.load(stream)
            version = release_version(tag)
            require(info.get('CFBundleVersion') == version and info.get('CFBundleShortVersionString') == version,
                    f'Mac bundle must identify release {version}')
            require(info.get('LSMinimumSystemVersion') == '15.0', 'Mac bundle must require macOS 15.0')
            launcher = app / 'Contents/MacOS' / info['CFBundleExecutable']
            require(launcher.stat().st_mode & 0o111, 'Mac launcher must be executable')
            text = launcher.read_text()
            verify_pin(text, 'PINNED_REF', tag)
            verify_pin(text, 'PINNED_COMMIT', commit)
            command(['sh', '-n', launcher])
            command(['codesign', '--verify', '--deep', '--strict', app])
            require((app / 'Contents/Resources/AppIcon.icns').stat().st_size > 0, 'Mac app icon is missing')
        finally:
            command(['hdiutil', 'detach', mount])
    print(f'Verified read-only DMG contents, signature and release pins for {tag}', flush=True)


def free_ports(count):
    sockets = [socket.socket() for _ in range(count)]
    try:
        for sock in sockets:
            sock.bind(('127.0.0.1', 0))
        return [sock.getsockname()[1] for sock in sockets]
    finally:
        for sock in sockets:
            sock.close()


def public_smoke(tag, commit, platform, repository):
    require(os.environ.get('GITHUB_ACTIONS') == 'true', 'Native release execution is restricted to isolated GitHub Actions runners')
    require(re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repository) is not None, 'Invalid repository')
    release_version(tag)
    base = f'https://github.com/{repository}/releases/download/{tag}'
    with tempfile.TemporaryDirectory(prefix='vibes-public-release-') as folder:
        root = Path(folder)
        assets = root / 'assets'
        assets.mkdir()
        names = expected_assets((platform,))
        for name in sorted(names):
            for attempt in range(4):
                try:
                    with urllib.request.urlopen(f'{base}/{name}', timeout=300) as response, (assets / name).open('wb') as target:
                        shutil.copyfileobj(response, target)
                    break
                except OSError:
                    if attempt == 3:
                        raise
                    time.sleep(5)
        sums = checksum_entries((assets / 'SHA256SUMS').read_text())
        require(set(sums) == expected_assets() - {'SHA256SUMS'}, 'Public checksum manifest is incomplete')
        for name in names - {'SHA256SUMS'}:
            require(sums.get(name) == digest(assets / name), f'Public checksum mismatch: {name}')
        for name in sorted(names):
            command(['gh', 'attestation', 'verify', assets / name, '--repo', repository,
                     '--signer-workflow', repository + '/.github/workflows/release.yml',
                     '--source-digest', commit, '--deny-self-hosted-runners'])
        verify_pin((assets / 'install.sh').read_text(), 'PINNED_REF', tag)
        command(['sh', '-n', assets / 'install.sh'])
        checkout = root / 'installed'
        env = {key: value for key, value in os.environ.items() if not key.startswith('VIBES_')}
        env.update(VIBES_DIR=str(checkout), VIBES_REPO=f'https://github.com/{repository}.git', NO_COLOR='1')
        command(['sh', assets / 'install.sh'], env={**env, 'VIBES_INSTALL_ONLY': 'fetch'}, timeout=300)
        require(command(['git', '-C', checkout, 'rev-parse', 'HEAD']).strip() == commit, 'Published installer did not fetch its stamped release commit')
        for kind in ('node', 'variants'):
            name = f'vibes-{kind}-{platform}.tar.gz'
            side = checksum_entries((assets / (name + '.sha256')).read_text())
            require(side == {name: digest(assets / name)}, f'Public side checksum mismatch: {name}')
            verify_archive(assets / name, kind, platform, commit, checkout / 'contrib/vibes')
        command(['sh', assets / 'install.sh'], env={**env, 'VIBES_INSTALL_ONLY': 'prebuilt',
                'VIBES_PREBUILT_URL': base}, timeout=400)
        require((checkout / 'build/bin/COMMIT').read_text().strip() == commit, 'Installed program provenance does not match the tag')
        for name in ('bitcoind', 'bitcoin-cli'):
            output = command([checkout / 'build/bin' / name, '-version'])
            require('version' in output.lower(), f'{name} did not report a version')
        if platform == 'macos-arm64':
            verify_dmg(assets / 'BitcoinVibes.dmg', tag, commit)
        config = checkout / '.vibes/data/bitcoin.conf'
        config.parent.mkdir(parents=True, exist_ok=True)
        rpc_port, p2p_port, port = free_ports(3)
        config.write_text(f'networkactive=0\n[regtest]\nrpcport={rpc_port}\nport={p2p_port}\n')
        log = root / 'console.log'
        with log.open('w') as output:
            proc = subprocess.Popen([sys.executable, '-u', str(checkout / 'contrib/vibes/bitcoin-vibes'),
                '--repo', str(checkout), '--chain', 'regtest', '--engine', 'mock', '--no-open', '--no-autostart',
                '--port', str(port), '--app'], stdout=output, stderr=subprocess.STDOUT, env=env)
            key = ''
            failed = False
            def api(path, body=None):
                request = urllib.request.Request(f'http://127.0.0.1:{port}{path}',
                    data=json.dumps(body).encode() if body is not None else None,
                    headers={'X-Vibe-Key': key, 'Content-Type': 'application/json'})
                with urllib.request.urlopen(request, timeout=60) as response:
                    return json.load(response)
            def wait_job(body):
                job_id = body['job']['id']
                deadline = time.monotonic() + 300
                while time.monotonic() < deadline:
                    summary = api('/api/experiment?id=' + job_id)['summary']
                    if summary['state'] not in ('running', 'cancelling'):
                        require(summary['state'] == 'done', f'Release smoke job failed: {summary.get("error", summary["state"])}')
                        return summary
                    time.sleep(0.2)
                raise RuntimeError('Release smoke job timed out')
            try:
                deadline = time.monotonic() + 60
                while time.monotonic() < deadline:
                    require(proc.poll() is None, 'Downloaded console exited during startup')
                    try:
                        key = (checkout / '.vibes/key').read_text().strip()
                        status = api('/api/status')
                        break
                    except OSError:
                        time.sleep(0.2)
                else:
                    raise RuntimeError('Downloaded console never became ready')
                require(status['source'] == commit and status['reference']['ready'], 'Downloaded console did not adopt the release reference')
                wait_job(api('/api/node', {'action': 'start'}))
                wait_job(api('/api/node', {'action': 'mine', 'blocks': 1}))
                require(api('/api/status')['node']['blocks'] == 1, 'Downloaded node did not produce a private regtest block')
                for item, verdict in (('double-reward', 'loosened'), ('halve-reward', 'tightened'), ('faster-halving', 'tightened')):
                    result = wait_job(api('/api/curated', {'id': item}))
                    require(result.get('compare', {}).get('verdict') == verdict, f'Downloaded variant {item} gave the wrong outcome')
                require(all(api('/api/status')['variants'].values()), 'Not every published variant was installed')
                wait_job(api('/api/node', {'action': 'stop'}))
            except Exception:
                failed = True
                raise
            finally:
                proc.terminate()
                try:
                    proc.wait(timeout=30)
                except subprocess.TimeoutExpired:
                    proc.kill()
                    proc.wait(timeout=10)
                if failed:
                    tail = log.read_text(errors='replace')[-12000:]
                    if key:
                        tail = tail.replace(key, '<redacted>')
                    tail = re.sub(r'([?&]key=)[^\s&]+', r'\1<redacted>', tail)
                    print('Downloaded console log tail (access key redacted):\n' + tail, file=sys.stderr)
        print(f'Public download smoke passed for {platform}: pinned installer, stock node, console, regtest and three variants', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--assets', type=Path)
    parser.add_argument('--public', action='store_true')
    parser.add_argument('--platform', choices=PLATFORMS)
    parser.add_argument('--tag', required=True)
    parser.add_argument('--commit', required=True)
    parser.add_argument('--repository', default='hotpixelgroup/bitcoin')
    parser.add_argument('--source', type=Path, default=SOURCE)
    parser.add_argument('--dmg', type=Path)
    args = parser.parse_args()
    require((args.assets or args.public or args.dmg) and not (args.public and (args.assets or args.dmg)),
            'Choose assets/DMG inspection or public download verification')
    if args.assets:
        verify_assets(args.assets, args.tag, args.commit, args.source, args.platform)
    if args.dmg:
        verify_dmg(args.dmg, args.tag, args.commit)
    if args.public:
        require(args.platform is not None, 'Choose the native platform for public verification')
        public_smoke(args.tag, args.commit, args.platform, args.repository)


if __name__ == '__main__':
    try:
        main()
    except (ValueError, RuntimeError, OSError, subprocess.SubprocessError) as error:
        print(f'Release verification failed: {error}', file=sys.stderr)
        output = getattr(error, 'stdout', '') or ''
        if output:
            print(re.sub(r'([?&]key=)[^\s&]+', r'\1<redacted>', output[-8000:]), file=sys.stderr)
        sys.exit(1)
