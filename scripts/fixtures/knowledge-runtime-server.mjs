import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createInterface } from 'node:readline';

const store = process.argv[2];
const schema = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false });
const str = { type: 'string' };
const obj = { type: 'object', additionalProperties: true };
const action = (...values) => ({ type: 'string', enum: values });
const skillNames = ['capture-articles','capture-newsletters','capture-podcasts','capture-youtube','capture-meetings','wiki-ingest','knowledge-intake'];
const tools = [
  { name: 'load_skill', description: 'Load an installed skill by name, including dependencies of knowledge-intake. Returns the complete skill instructions. This is the runtime skill loader, not a shell or general file reader.', inputSchema: schema({ name: action(...skillNames) }, ['name']) },
  { name: 'records', description: 'Private raw storage. save upserts by source_type and external_id and returns id/version. get returns full immutable body for id/version. list returns records.', inputSchema: schema({ action: action('save', 'get', 'list'), record: obj, id: str, version: { type: 'integer' } }, ['action']) },
  { name: 'state', description: 'Workspace state: read returns version and state. compare_and_set atomically replaces state only when expected_version matches. All writes require compare_and_set.', inputSchema: schema({ action: action('read', 'compare_and_set'), expected_version: { type: 'integer' }, state: obj }, ['action']) },
  { name: 'wiki', description: 'Private wiki pages: list, get by id, upsert by stable key. Returns full pages and ids.', inputSchema: schema({ action: action('list', 'get', 'upsert'), id: str, key: str, page: obj }, ['action']) },
  { name: 'log', description: 'Ingest log: list entries, append idempotently by operation key. Returns stored entry.', inputSchema: schema({ action: action('list', 'append'), key: str, entry: obj }, ['action']) },
  { name: 'transcript', description: 'Read a complete authorized audio-derived transcript with metadata and duration. No platform captions. Fixture only.', inputSchema: schema({ url: str }, ['url']) },
  { name: 'inputs', description: 'Read approved synthetic newsletter, article, feed, video, meeting, and transcript inputs. No outside network.', inputSchema: schema({ kind: action('newsletter', 'article', 'podcasts', 'youtube', 'calendar', 'meeting'), url: str }, ['kind']) },
];
function call(name, a) {
  const d = JSON.parse(readFileSync(store, 'utf8'));
  d.calls.push({ name, arguments: a });
  let result;
  let error;
  if (name === 'load_skill') {
    if (!skillNames.includes(a.name)) error = 'unknown skill';
    else result = readFileSync(join(dirname(store), '.agents/skills', a.name, 'SKILL.md'), 'utf8');
  } else if (name === 'records') {
    if (a.action === 'save') {
      if (!a.record?.body || !a.record?.external_id || a.record.raw_path || a.record.visibility !== 'private') error = 'invalid raw record';
      else {
        const prior = d.records.find(r => r.source_type === a.record.source_type && r.external_id === a.record.external_id);
        const record = { ...a.record, id: prior?.id ?? `raw-${d.records.length + 1}`, version: prior?.version ?? 1 };
        if (prior && prior.body !== record.body) { record.version++; d.records.push(record); }
        else if (!prior) d.records.push(record);
        result = { id: record.id, version: record.version, saved: true };
      }
    } else if (a.action === 'get') {
      result = d.records.findLast(r => r.id === a.id && (a.version === undefined || a.version === r.version)) ?? null;
      if (result && d.mode === 'truncated') result = { ...result, body: 'truncated' };
    } else result = d.records;
  } else if (name === 'state') {
    if (a.action === 'read') result = { version: d.version, state: d.state, now: '2026-11-09T12:00:00Z' };
    else if (a.expected_version !== d.version) error = 'version conflict; reread';
    else { d.state = a.state; result = { version: ++d.version, state: d.state }; }
  } else if (name === 'wiki') {
    if (a.action === 'list') result = d.pages;
    else if (a.action === 'get') result = d.pages.find(p => p.id === a.id) ?? null;
    else if (d.mode === 'deny-wiki') error = 'owner approval denied';
    else {
      const key = a.key ?? a.page?.slug;
      if (!key || !a.page) error = 'stable key and page required';
      else {
        const prior = d.pages.find(p => p.key === key);
        const page = { ...a.page, key, id: prior?.id ?? `page-${d.pages.length + 1}` };
        d.pages = d.pages.filter(p => p.key !== key).concat(page); result = page;
      }
    }
  } else if (name === 'log') {
    if (a.action === 'list') result = d.entries;
    else if (!a.key || !a.entry) error = 'stable key and entry required';
    else { const entry = d.entries.find(e => e.key === a.key) ?? { ...a.entry, key: a.key }; d.entries = d.entries.filter(e => e.key !== a.key).concat(entry); result = entry; }
  } else if (name === 'transcript') {
    if (d.mode === 'no-transcript') error = 'audio transcription unavailable';
    else result = { source_url: a.url, external_id: a.url.includes('youtube') ? 'fixture123' : 'episode-1', title: 'Shared garden', duration_minutes: 4, transcript_source: 'audio-derived', transcript: d.body };
  } else if (name === 'inputs') result = d.inputs[a.kind];
  writeFileSync(store, JSON.stringify(d, null, 2));
  return { content: [{ type: 'text', text: JSON.stringify(error ? { error } : result) }], ...(error ? { isError: true } : {}) };
}
const send = value => process.stdout.write(JSON.stringify(value) + '\n');
createInterface({ input: process.stdin }).on('line', line => {
  const m = JSON.parse(line);
  if (m.method === 'initialize') send({ jsonrpc: '2.0', id: m.id, result: { protocolVersion: m.params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: 'fixture', version: '1' } } });
  else if (m.method === 'tools/list') send({ jsonrpc: '2.0', id: m.id, result: { tools } });
  else if (m.method === 'tools/call') send({ jsonrpc: '2.0', id: m.id, result: call(m.params.name, m.params.arguments) });
  else if (m.id !== undefined) send({ jsonrpc: '2.0', id: m.id, result: {} });
});
