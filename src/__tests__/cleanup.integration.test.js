const fs = require('fs');
const path = require('path');
const os = require('os');
const { cleanupSnapshots, findStaleSnapshots } = require('../cleanup');
const { pinSnapshot } = require('../pin');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-cleanup-int-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeSnap(name, daysAgo) {
  const ts = new Date(Date.now() - daysAgo * 86400000).toISOString();
  fs.writeFileSync(
    path.join(tmpDir, `${name}.json`),
    JSON.stringify({ name, timestamp: ts, configs: {} })
  );
}

test('full cleanup flow: stale removed, fresh kept', async () => {
  writeSnap('alpha', 50);
  writeSnap('beta', 10);
  const deleted = await cleanupSnapshots(tmpDir, { olderThanDays: 30 });
  expect(deleted).toEqual(['alpha']);
  expect(fs.existsSync(path.join(tmpDir, 'alpha.json'))).toBe(false);
  expect(fs.existsSync(path.join(tmpDir, 'beta.json'))).toBe(true);
});

test('pinned snapshot survives cleanup', async () => {
  writeSnap('important', 90);
  writeSnap('disposable', 90);
  await pinSnapshot(tmpDir, 'important');
  const deleted = await cleanupSnapshots(tmpDir, { olderThanDays: 30 });
  expect(deleted).not.toContain('important');
  expect(deleted).toContain('disposable');
  expect(fs.existsSync(path.join(tmpDir, 'important.json'))).toBe(true);
});

test('keepCount=2 preserves two most recent even if stale', async () => {
  writeSnap('snap-a', 100);
  writeSnap('snap-b', 80);
  writeSnap('snap-c', 60);
  const stale = await findStaleSnapshots(tmpDir, { olderThanDays: 30, keepCount: 2 });
  const names = stale.map(s => s.name);
  expect(names.length).toBe(1);
  expect(names).toContain('snap-a');
  expect(names).not.toContain('snap-b');
  expect(names).not.toContain('snap-c');
});

test('no snapshots returns empty deleted list', async () => {
  const deleted = await cleanupSnapshots(tmpDir, { olderThanDays: 30 });
  expect(deleted).toEqual([]);
});
