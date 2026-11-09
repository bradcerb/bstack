import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

function fixture(calls, mode) {
  const store=join(mkdtempSync(join(tmpdir(),'bstack-fixture-test-')),'store.json');
  writeFileSync(store,JSON.stringify({calls:[],records:[],pages:[],entries:[],state:{unrelated:'preserve'},version:0,mode}));
  const input=calls.map(([name,args],i)=>JSON.stringify({jsonrpc:'2.0',id:i+1,method:'tools/call',params:{name,arguments:args}})).join('\n')+'\n';
  const r=spawnSync(process.execPath,[fileURLToPath(new URL('./fixtures/knowledge-runtime-server.mjs',import.meta.url)),store],{input,encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const responses=r.stdout.trim().split('\n').map(line=>JSON.parse(line).result);
  return { state:JSON.parse(readFileSync(store)), responses, values:responses.map(r=>JSON.parse(r.content[0].text)) };
}
const record = body => ({source_type:'article',external_id:'https://example.test/article',visibility:'private',body});

test('recapture versions increase monotonically and every historical body remains readable',()=>{
  const r=fixture([
    ['records',{action:'save',record:record('first')}],
    ['records',{action:'save',record:record('second')}],
    ['records',{action:'save',record:record('third')}],
    ['records',{action:'save',record:record('third')}],
    ['records',{action:'get',id:'raw-1',version:1}],
    ['records',{action:'get',id:'raw-1',version:2}],
    ['records',{action:'get',id:'raw-1',version:3}],
  ]);
  assert.deepEqual(r.values.slice(0,4).map(x=>x.version),[1,2,3,3]);
  assert.deepEqual(r.values.slice(4).map(x=>x.body),['first','second','third']);
  assert.equal(r.state.records.length,3);
});

test('stale state tokens cannot replace a newer checkpoint',()=>{
  const r=fixture([
    ['state',{action:'compare_and_set',expected_version:0,state:{unrelated:'preserve',lease:{owner:'first'}}}],
    ['state',{action:'compare_and_set',expected_version:0,state:{lease:{owner:'second'}}}],
  ]);
  assert.equal(r.responses[1].isError,true);
  assert.equal(r.state.version,1);assert.equal(r.state.state.lease.owner,'first');assert.equal(r.state.state.unrelated,'preserve');
});

test('log retries are idempotent and denied wiki writes make no page',()=>{
  const r=fixture([
    ['log',{action:'append',key:'raw-1:v1:page-1',entry:{title:'Source'}}],
    ['log',{action:'append',key:'raw-1:v1:page-1',entry:{title:'Source'}}],
    ['wiki',{action:'upsert',key:'source',page:{title:'Source'}}],
  ],'deny-wiki');
  assert.equal(r.state.entries.length,1);assert.equal(r.state.pages.length,0);assert.equal(r.responses[2].isError,true);
});
