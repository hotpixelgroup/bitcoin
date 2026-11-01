#!/usr/bin/env python3
"""Serve the real console over a disposable repo for live browser checks.

Uses the mock agent and leaves compilation off in the browser workflow. It
never touches an installed lab or runs an AI session.
"""
import importlib.machinery
import importlib.util
from http.server import ThreadingHTTPServer
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
from types import SimpleNamespace

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))
loader = importlib.machinery.SourceFileLoader('browser_console', str(HERE / 'bitcoin-vibes'))
spec = importlib.util.spec_from_loader(loader.name, loader)
vibes = importlib.util.module_from_spec(spec)
loader.exec_module(vibes)


def main():
    with tempfile.TemporaryDirectory(prefix='vibes-live-browser-') as temporary:
        repo = Path(temporary)
        (repo / 'doc').mkdir()
        (repo / 'doc/vibes.md').write_text('# Browser test baseline\n')
        (repo / '.gitignore').write_text('.vibes/\nbuild/\n')
        env = {**os.environ, 'GIT_CONFIG_GLOBAL': os.devnull, 'GIT_CONFIG_SYSTEM': os.devnull}
        for args in (('init', '-q', '-b', 'browser-test'),
                     ('config', 'user.name', 'Browser QA'),
                     ('config', 'user.email', 'qa@example.invalid'),
                     ('add', '.'), ('commit', '-q', '-m', 'baseline')):
            subprocess.run(['git', '-C', str(repo), *args], env=env, check=True,
                           stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        console = vibes.Console(SimpleNamespace(repo=str(repo), chain='regtest', engine='mock',
                                                claude=None, jobs=2, sandbox='off'))
        class Handler(vibes.Handler):
            pass
        Handler.console = console
        Handler.load_assets(HERE)
        server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        def stop(*_):
            raise KeyboardInterrupt
        signal.signal(signal.SIGTERM, stop)
        print(json.dumps({'url': f'http://127.0.0.1:{server.server_port}',
                          'key': console.key, 'repo': str(repo)}), flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            if console.job and console.job.state in ('running', 'cancelling', 'review'):
                console.cancel_job()
                if getattr(console.job, 'thread', None):
                    console.job.thread.join(10)
            server.server_close()


if __name__ == '__main__':
    main()
