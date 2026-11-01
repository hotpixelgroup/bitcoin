#!/usr/bin/env python3
"""Record through the real HTTP console using CI's just-built programs.

PROGRAMS contains stock/bitcoind and one bitcoind in each patch's named
directory. No node is started on a shared network and no source is applied.
The console still checks patch digests and source identity before each run.
"""
import argparse
from http.server import ThreadingHTTPServer
import importlib.machinery
import importlib.util
from pathlib import Path
import subprocess
import sys
import threading
from types import SimpleNamespace

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))
loader = importlib.machinery.SourceFileLoader('recording_console', str(HERE / 'bitcoin-vibes'))
spec = importlib.util.spec_from_loader(loader.name, loader)
vibes = importlib.util.module_from_spec(spec)
loader.exec_module(vibes)


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--programs', type=Path, required=True)
    parser.add_argument('--repo', type=Path, default=HERE.parents[1])
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    programs = args.programs.resolve()
    repo = args.repo.resolve()
    console = vibes.Console(SimpleNamespace(repo=str(repo), chain='regtest', engine='mock',
                                            claude=None, jobs=2, sandbox=None))
    console._capture_reference(console.stock_rev(), programs / 'stock')
    for item in vibes.lessons.CURATED:
        if item['kind'] == 'patch':
            console._keep_variant(item, programs / item['id'], 'CI: built from the bundled patch')
    class Handler(vibes.Handler):
        pass
    Handler.console = console
    Handler.load_assets(HERE)
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        subprocess.run([sys.executable, '-u', str(HERE / 'record_demo.py'), '--repo', str(repo),
                        '--url', f'http://127.0.0.1:{server.server_port}', '--ready', '--out', str(args.out)], check=True)
    finally:
        if console.job and console.job.state in ('running', 'cancelling', 'review'):
            console.cancel_job()
            if getattr(console.job, 'thread', None):
                console.job.thread.join(30)
        server.shutdown()
        server.server_close()
        thread.join()


if __name__ == '__main__':
    main()
