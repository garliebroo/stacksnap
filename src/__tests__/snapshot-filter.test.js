const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { saveSnapshot } = require('../snapshot');
const { filterSnapshots, formatFilterResults } = require('../snapshot-filter');

let tmpDir;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'snapfilter-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

async function makeSnap(dir, name, configs, timestamp) {
  const snap = { timestamp: timestamp || new Date().toISOString(), configs };
  await saveSnapshot(dir, name, snap);
  return snap;
}

test('returns all snapshots when no criteria given', async () => {
  await makeSnap(tmpDir, 'snap-a', { '.bashrc': 'a' });
  await makeSnap(tmpDir, 'snap-b', { '.zshrc': 'b' });
  const results = await filterSnapshots(tmpDir, {});
  expect(results.length).toBe(2);
});

test('filters by nameContains', async () => {
  await makeSnap(tmpDir, 'work-setup', { '.bashrc': 'x' });
  await makeSnap(tmpDir, 'home-setup', { '.bashrc': 'y' });
  const results = await filterSnapshots(tmpDir, { nameContains: 'work' });
  expect(results.length).toBe(1);
  expect(results[0].name).toBe('work-setup');
});

test('filters by hasConfig', async () => {
  await makeSnap(tmpDir, 'snap-a', { '.bashrc': 'a', '.vimrc': 'v' });
  await makeSnap(tmpDir, 'snap-b', { '.zshrc': 'z' });
  const results = await filterSnapshots(tmpDir, { hasConfig: '.vimrc' });
  expect(results.length).toBe(1);
  expect(results[0].name).toBe('snap-a');
});

test('filters by minConfigs', async () => {
  await makeSnap(tmpDir, 'snap-a', { '.bashrc': 'a', '.vimrc': 'v', '.tmux.conf': 't' });
  await makeSnap(tmpDir, 'snap-b', { '.zshrc': 'z' });
  const results = await filterSnapshots(tmpDir, { minConfigs: 2 });
  expect(results.length).toBe(1);
  expect(results[0].name).toBe('snap-a');
});

test('filters by before date', async () => {
  await makeSnap(tmpDir, 'old-snap', {}, '2023-01-01T00:00:00.000Z');
  await makeSnap(tmpDir, 'new-snap', {}, '2025-01-01T00:00:00.000Z');
  const results = await filterSnapshots(tmpDir, { before: '2024-01-01' });
  expect(results.length).toBe(1);
  expect(results[0].name).toBe('old-snap');
});

test('formatFilterResults shows no match message', () => {
  const out = formatFilterResults([]);
  expect(out).toMatch(/No snapshots matched/);
});

test('formatFilterResults lists matched snapshots', () => {
  const results = [
    { name: 'snap-x', snapshot: { timestamp: '2024-06-01T00:00:00.000Z', configs: { '.bashrc': 'x' } } }
  ];
  const out = formatFilterResults(results);
  expect(out).toMatch('snap-x');
  expect(out).toMatch('Configs: 1');
  expect(out).toMatch('Found 1 matching');
});
