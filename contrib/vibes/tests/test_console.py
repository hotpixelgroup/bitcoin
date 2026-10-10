"""Contracts, isolated git workflows, persistence and failure recovery."""
import importlib.machinery
import importlib.util
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import threading
import time
from types import SimpleNamespace
import unittest
from unittest.mock import patch
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

SCRIPT = Path(__file__).resolve().parents[1] / 'bitcoin-vibes'
loader = importlib.machinery.SourceFileLoader('vibes_console', str(SCRIPT))
spec = importlib.util.spec_from_loader(loader.name, loader)
vibes = importlib.util.module_from_spec(spec)
loader.exec_module(vibes)

class ConsoleTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.repo = Path(self.tmp.name)
        (self.repo / 'doc').mkdir()
        (self.repo / 'doc/vibes.md').write_text('# Test documentation\n')
        (self.repo / '.gitignore').write_text('.vibes/\nbuild/\n')
        for args in [('init','-b','test-universe'),('config','user.name','QA'),('config','user.email','qa@example.invalid'),('add','.'),('commit','-m','baseline')]: self.git(*args)
        self.opts = SimpleNamespace(repo=str(self.repo),chain='regtest',engine='mock',claude=None,jobs=2)
        self.console = vibes.Console(self.opts)
    def tearDown(self):
        if self.console.job and self.console.job.state in ('running','cancelling'):
            self.console.cancel_job(); self.wait()
        self.tmp.cleanup()
    def git(self,*args):
        return subprocess.check_output(['git','-C',str(self.repo),*args],stderr=subprocess.STDOUT).decode().strip()
    def wait(self):
        for _ in range(150):
            if self.console.job.state not in ('running','cancelling'): return self.console.job
            time.sleep(.03)
        self.fail('Job did not terminate')
    def propose(self,review=True):
        self.console.start_job('vibe','QA request',self.console.vibe_runner('QA request',False,False,False,review))
        return self.wait()
    def test_review_apply_share_and_revert(self):
        before=self.git('rev-parse','HEAD'); job=self.propose()
        self.assertEqual(job.state,'review'); self.assertEqual(before,self.git('rev-parse','HEAD'))
        self.assertNotIn('QA request',(self.repo/'doc/vibes.md').read_text())
        self.assertIsNone(self.console.start_job('build',runner=lambda j:None))
        self.console.resume_review(job.id); self.wait()
        self.assertEqual(job.state,'done'); self.assertIn('QA request',(self.repo/'doc/vibes.md').read_text())
        self.assertEqual(self.console.decree(job.meta['sha'])['p'],'QA request')
        self.assertNotIn('workspace',job.meta)
        self.console.start_job('revert',runner=self.console.revert_runner(job.meta['sha'],False,False))
        reverted=self.wait(); self.assertEqual(reverted.state,'done')
        self.assertNotIn('QA request',(self.repo/'doc/vibes.md').read_text()); self.assertEqual(reverted.meta['reverts'],job.meta['sha'])
    def test_dirty_source_stays_out_of_proposal(self):
        (self.repo/'personal.txt').write_text('Unrelated');job=self.propose()
        with self.assertRaisesRegex(RuntimeError,'uncommitted'):self.console.resume_review(job.id)
        self.assertEqual(job.state,'review');self.assertNotIn('personal.txt',self.git('ls-tree','--name-only',job.meta['proposal']))
    def test_stale_proposal_refused(self):
        job=self.propose();(self.repo/'another.txt').write_text('New');self.git('add','.');self.git('commit','-m','advanced')
        with self.assertRaisesRegex(ValueError,'advanced'):self.console.resume_review(job.id)
    def test_review_survives_restart_and_discard(self):
        job=self.propose();restored=vibes.Console(self.opts)
        self.assertEqual(restored.job.id,job.id);self.assertEqual(restored.job.state,'review');self.assertTrue(restored.experiment(job.id)['events'])
        restored.cancel_job();self.assertEqual(restored.job.state,'cancelled');self.assertNotIn('workspace',restored.job.meta)
    def test_interrupted_job_is_error(self):
        job=vibes.Job('build');self.console._save_job(job);restored=vibes.Console(self.opts)
        self.assertEqual(restored.job.state,'error');self.assertIn('interrupted',restored.job.meta['error'])
    def test_automatic_and_discard(self):
        job=self.propose(False);self.assertEqual(job.state,'done');self.assertEqual(job.meta['build_status'],'not run')
        self.propose();self.assertTrue(self.console.cancel_job());self.assertEqual(self.console.job.state,'cancelled')
    def test_consensus_forces_review(self):
        def agent(job,prompt,yolo):
            workspace=Path(job.meta['workspace']);(workspace/'src').mkdir();(workspace/'src/validation.cpp').write_text('int nSubsidy = 100;\n')
        with patch.object(self.console,'_run_agent',agent):
            self.console.start_job('vibe','Subsidy',self.console.vibe_runner('Subsidy',False,False,False,False));job=self.wait()
        self.assertEqual(job.state,'review');self.assertIn('the block subsidy',job.meta['risk'])
    def test_build_failure_keeps_running_release(self):
        job=vibes.Job('build');self.console.running_state={'sha':'known-good','path':'/good'}
        with patch.object(self.console,'_stream',return_value=1):
            with self.assertRaisesRegex(RuntimeError,'Build failed'):self.console._build(job)
        self.assertEqual(job.meta['build_status'],'failed');self.assertEqual(self.console.running_state['sha'],'known-good')
    def test_activation_failure_recovers(self):
        job=vibes.Job('activate');self.console.build_state={'sha':'new','path':'/new','verified':True};self.console.running_state={'sha':'old','path':'/old'};launches=[]
        def launch(release,job=None):
            launches.append(release['sha'])
            if release['sha']=='new':raise RuntimeError('startup failed')
            self.console.running_state=release
        with patch.object(self.console,'stop_node',return_value=True),patch.object(self.console,'_launch_release',launch):
            with self.assertRaisesRegex(RuntimeError,'startup failed'):self.console._restart_node(job)
        self.assertEqual(launches,['new','old']);self.assertEqual(job.meta['activation'],'rolled back')
    def test_unverified_activation_refused(self):
        with self.assertRaisesRegex(RuntimeError,'verify'):self.console._restart_node(vibes.Job('activate'))
    def test_event_sequence_and_path_validation(self):
        job=vibes.Job('vibe');job.persist=self.console._save_job;job.emit(t='log',line='First');job.emit(t='log',line='Second')
        self.assertEqual([ev['seq'] for ev in self.console.experiment(job.id)['events']],[1,2])
        with self.assertRaises(ValueError):self.console.experiment('../../key')
    def test_acceptance_comparisons(self):
        self.assertTrue(self.console._compare(1,'eq',1));self.assertFalse(self.console._compare(1,'gte',2));self.assertTrue(self.console._compare(1,'lte',2));self.assertTrue(self.console._compare(['foo'],'contains','foo'))
        with self.assertRaises(ValueError):self.console._compare(1,'exec',1)
    def test_settings_roundtrip(self):
        self.console.conf_path.write_text('# personal config\nuacomment=QA\n')
        problems,clean=self.console.validate_settings({'dbcache':512,'prune':0});self.assertEqual(problems,[])
        self.console.write_settings(clean);self.assertEqual(self.console.read_settings()['dbcache'],512)
        self.assertIn('uacomment=QA',self.console.conf_path.read_text());self.assertTrue(self.console.validate_settings({'prune':100})[0])
    def test_http_contracts_and_stream_replay(self):
        class Handler(vibes.Handler):pass
        Handler.console=self.console;Handler.html_path=SCRIPT.parent/'index.html';Handler.html=Handler.html_path.read_bytes()
        server=ThreadingHTTPServer(('127.0.0.1',0),Handler);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start();url='http://127.0.0.1:'+str(server.server_port)
        def get(path,auth=True,extra=None):return urllib.request.urlopen(urllib.request.Request(url+path,headers={**({'X-Vibe-Key':self.console.key} if auth else {}),**(extra or {})}))
        def post(path,value,origin=None):return urllib.request.urlopen(urllib.request.Request(url+path,data=json.dumps(value).encode(),headers={'X-Vibe-Key':self.console.key,'Content-Type':'application/json',**({'Origin':origin} if origin else {})}))
        try:
            with self.assertRaises(urllib.error.HTTPError) as err:get('/api/status',False)
            self.assertEqual(err.exception.code,403);self.assertIn(b'What shall Bitcoin become',get('/').read());self.assertIn(b'renderJob',get('/web/app.js').read());self.assertIn('source',json.load(get('/api/status')))
            for value in ({'prompt':123},{'prompt':''},{'prompt':'a'*20001},[]):
                with self.assertRaises(urllib.error.HTTPError):post('/api/vibe',value)
            with self.assertRaises(urllib.error.HTTPError) as err:post('/api/vibe',{'prompt':'attack'},'https://evil.invalid')
            self.assertEqual(err.exception.code,403)
            with self.assertRaises(urllib.error.HTTPError):get('/api/experiment?id=../../key')
            job=self.propose();stream=get('/api/stream?id='+job.id,extra={'Last-Event-ID':'1'}).read().decode()
            self.assertNotIn('id: 1\n',stream);self.assertIn('"state": "review"',stream);self.assertTrue(json.load(get('/api/experiment?id='+job.id))['events'])
        finally:server.shutdown();server.server_close();thread.join()
    @unittest.skipUnless(os.environ.get('VIBES_QA_BIN'),'Set VIBES_QA_BIN for real regtest checks')
    def test_real_failed_activation_restores_rpc_ready_release(self):
        releases=self.console.state_dir/'releases';old=releases/'good';bad=releases/'bad'
        old.mkdir(parents=True);bad.mkdir()
        for name in ('bitcoind','bitcoin-cli'):
            (old/name).symlink_to(Path(os.environ['VIBES_QA_BIN'])/name)
        (bad/'bitcoin-cli').symlink_to(Path(os.environ['VIBES_QA_BIN'])/'bitcoin-cli')
        (bad/'bitcoind').write_text('#!/bin/sh\nexit 1\n');(bad/'bitcoind').chmod(0o755)
        with socket.socket() as sock:
            sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
        self.console.conf_path.write_text(f'listen=0\nnetworkactive=0\n[regtest]\nrpcport={port}\n')
        self.console.build_state={'sha':'good','path':str(old),'verified':True}
        try:
            self.assertTrue(self.console.start_node())
            self.console.build_state={'sha':'bad','path':str(bad),'verified':True}
            job=vibes.Job('activate')
            with self.assertRaisesRegex(RuntimeError,'exited'):
                self.console._restart_node(job)
            self.assertEqual(job.meta['activation'],'rolled back')
            self.assertEqual(self.console.running_state['sha'],'good')
            self.assertIsNotNone(self.console.cli_json('getblockchaininfo'))
        finally:
            self.console.stop_node()
            if self.console.node_log:self.console.node_log.close()
    @unittest.skipUnless(os.environ.get('VIBES_QA_BIN'),'Set VIBES_QA_BIN for real regtest checks')
    def test_real_disposable_transaction_scenario(self):
        job=vibes.Job('playground');job.meta['scenario']='transaction'
        evidence=self.console.verify_regtest(job,Path(os.environ['VIBES_QA_BIN']))
        self.assertEqual(evidence[-1]['status'],'passed')
        self.assertIn('Transaction enters',evidence[-1]['name'])
    @unittest.skipUnless(os.environ.get('VIBES_QA_BIN'),'Set VIBES_QA_BIN for real regtest checks')
    def test_real_regtest_acceptance(self):
        job=vibes.Job('build');job.meta['acceptance']={'checks':[{'rpc':'getblockstats','path':'subsidy','op':'eq','expected':5000000000}]}
        evidence=self.console.verify_regtest(job,Path(os.environ['VIBES_QA_BIN']));self.assertEqual(evidence[-1]['actual'],5000000000)
        job.meta['acceptance']['checks'][0]['expected']=1
        with self.assertRaisesRegex(RuntimeError,'Acceptance check failed'):self.console.verify_regtest(job,Path(os.environ['VIBES_QA_BIN']))
        self.assertEqual(job.meta['evidence'][-1]['status'],'failed')

if __name__=='__main__':unittest.main(verbosity=2)
