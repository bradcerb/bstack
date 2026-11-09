import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const base = mkdtempSync(join(tmpdir(), 'bstack-vendor-test-'));
const source = join(base, 'source');
execFileSync('git', ['clone','--quiet','--shared',root,source]);
copyFileSync(join(root,'scripts/vendor.mjs'),join(source,'scripts/vendor.mjs'));
const git = (...args) => execFileSync('git',args,{cwd:source,stdio:'pipe'});
const vendor = out => spawnSync(process.execPath,['scripts/vendor.mjs','--out',out,'--allow','thinking/action-method'],{cwd:source,encoding:'utf8'});
function directory(name) { const dir=join(base,name);mkdirSync(dir);return dir; }

test('vendoring is verbatim, repeatable, and removes dropped skills', () => {
  const out=directory('normal');
  assert.equal(vendor(out).status,0);
  const bytes=readFileSync(join(source,'plugins/thinking/skills/action-method/SKILL.md'));
  assert.deepEqual(readFileSync(join(out,'action-method/SKILL.md')),bytes);
  assert.equal(vendor(out).status,0);
  const extra=join(out,'dropped');mkdirSync(extra);writeFileSync(join(extra,'SKILL.md'),'old');
  const lock=JSON.parse(readFileSync(join(out,'bstack.lock.json')));lock.skills.push('dropped');
  writeFileSync(join(out,'bstack.lock.json'),JSON.stringify(lock));
  assert.equal(vendor(out).status,0);assert(!existsSync(extra));
});

test('a tampered lock cannot delete outside the output', () => {
  const out=directory('bad-lock'), victim=directory('victim');
  writeFileSync(join(victim,'keep'),'unchanged');
  writeFileSync(join(out,'bstack.lock.json'),JSON.stringify({repo:'bradcerb/bstack',skills:['../victim']}));
  const r=vendor(out);assert.notEqual(r.status,0);assert.match(r.stderr,/invalid skill names/);
  assert.equal(readFileSync(join(victim,'keep'),'utf8'),'unchanged');
});

test('destination symlinks cannot redirect writes', () => {
  const out=directory('dest-link'), victim=directory('outside');
  writeFileSync(join(victim,'SKILL.md'),'unchanged');
  symlinkSync(victim,join(out,'action-method'));
  const r=vendor(out);assert.notEqual(r.status,0);assert.match(r.stderr,/symlink/);
  assert.equal(readFileSync(join(victim,'SKILL.md'),'utf8'),'unchanged');
  const alias=join(base,'output-link');symlinkSync(victim,alias);
  assert.notEqual(vendor(alias).status,0);
});

test('tracked source links are refused rather than copying untracked target content', () => {
  const secret=join(source,'untracked-fixture');writeFileSync(secret,'must not ship');
  const link='plugins/thinking/skills/action-method/linked.txt';symlinkSync(secret,join(source,link));
  git('add',link);git('-c','user.name=Fixture','-c','user.email=fixture@example.test','commit','-qm','fixture source link');
  const out=directory('source-link');const r=vendor(out);
  assert.notEqual(r.status,0);assert.match(r.stderr,/regular tracked files/);assert(!existsSync(join(out,'action-method')));
  git('rm','-q',link);git('-c','user.name=Fixture','-c','user.email=fixture@example.test','commit','-qm','remove fixture source link');
});

test('ancestor symlinks cannot redirect creation or cleanup', () => {
  const outside=directory('ancestor-outside'), alias=join(base,'parent-alias');symlinkSync(outside,alias);
  const missing=vendor(join(alias,'missing'));
  assert.notEqual(missing.status,0);assert.match(missing.stderr,/symlink/);assert(!existsSync(join(outside,'missing')));
  const existing=join(outside,'existing');mkdirSync(join(existing,'precious'),{recursive:true});
  writeFileSync(join(existing,'precious/keep'),'unchanged');
  writeFileSync(join(existing,'bstack.lock.json'),JSON.stringify({repo:'bradcerb/bstack',skills:['precious']}));
  const r=vendor(join(alias,'existing'));
  assert.notEqual(r.status,0);assert.match(r.stderr,/symlink/);
  assert.equal(readFileSync(join(existing,'precious/keep'),'utf8'),'unchanged');
});

test('hard-linked metadata cannot overwrite another file', () => {
  for(const name of ['SOURCES.md','bstack.lock.json']) {
    const out=directory('hard-'+name), sentinel=join(base,'sentinel-'+name);
    const original=name==='SOURCES.md'?'unchanged':JSON.stringify({repo:'bradcerb/bstack',skills:[]});
    writeFileSync(sentinel,original);linkSync(sentinel,join(out,name));
    const r=vendor(out);assert.notEqual(r.status,0);assert.match(r.stderr,/hard link/);
    assert.equal(readFileSync(sentinel,'utf8'),original);
  }
});

test('reference-style and angle-bracket links outside the skill are refused', () => {
  const file='plugins/thinking/skills/action-method/SKILL.md';const original=readFileSync(join(source,file),'utf8');
  for(const [index,suffix] of ['\n[method][external]\n[external]: ../../references/missing.md\n','\n[method](<../../references/missing.md>)\n','\n[method][external]\n[external]: ..&#47;..&#47;references/missing.md\n','\n[method](..&#47;..&#47;references/missing.md)\n'].entries()) {
    writeFileSync(join(source,file),original+suffix);git('add',file);git('-c','user.name=Fixture','-c','user.email=fixture@example.test','commit','-qm','fixture link');
    const r=vendor(directory('reference-'+index));
    assert.notEqual(r.status,0);assert.match(r.stderr,/links outside|unsupported escaped local link/);
  }
});
