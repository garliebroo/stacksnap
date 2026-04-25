const fs = require('fs');
const path = require('path');
const os = require('os');
const { findStaleSnapshots, deleteSnapshot, cleanupSnapshots, formatCleanupResult } = require('../cleanup');

const { saveSnapshot } = require('../snapshot');
const { pinSnapshot } = require('../pin');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-cleanup-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function makeSnapshot(name, daysAgo) {
  const ts = new Date(Date.now() - daysAgo * 86400000).toISOString();
  const data = { name, timestamp: ts, configs: {} };
  fs.writeFileSync(path.join(tmpDir, `${name}.json`), JSON.stringify(data));
}

test('finds snapshots older than threshold', async () => {
  makeSnapshot('old-snap', 40);
  makeSnapshot('new-snap', 5);
  const stale = await findStaleSnapshots(tmpDir, { olderThanDays: 30 });
  expect(stale.map(s => s.name)).toContain('old-snap');
  expect(stale.map(s => s.name)).not.toContain('new-snap');
});

test('pinned snapshots are excluded from stale list', async () => {
  makeSnapshot('pinned-old', 60);
  await pinSnapshot(tmpDir, 'pinned-old');
  const stale = await findStaleSnapshots(tmpDir, { olderThanDays: 30 });
  expect(stale.map(s => s.name)).not.toContain('pinned-old');
});

test('keepCount protects most recent snapshots', async () => {
  makeSnapshot('oldest', 90);
  makeSnapshot('older', 60);
  makeSnapshot('recent', 40);
  const stale = await findStaleSnapshots(tmpDir, { olderThanDays: 30, keepCount: 1 });
  const names = stale.map(s => s.name);
  expect(names).not.toContain('recent');
  expect(names).toContain('oldest');
});

test('deleteSnapshot removes file', async () => {
  makeSnapshot('to-delete', 5);
  await deleteSnapshot(tmpDir, 'to-delete');
  expect(fs.existsSync(path.join(tmpDir, 'to-delete.json'))).toBe(false);
});

test('deleteSnapshot throws if snapshot missing', async () => {
  await expect(deleteSnapshot(tmpDir, 'ghost')).rejects.toThrow('not found');
});

test('cleanupSnapshots deletes stale and returns names', async () => {
  makeSnapshot('stale1', 45);
  makeSnapshot('stale2', 50);
  makeSnapshot('fresh', 2);
  const deleted = await cleanupSnapshots(tmpDir, { olderThanDays: 30 });
  expect(deleted).toContain('stale1');
  expect(deleted).toContain('stale2');
  expect(deleted).not.toContain('fresh');
});

test('formatCleanupResult with no deletions', () => {
  expect(formatCleanupResult([])).toBe('No snapshots removed.');
});

test('formatCleanupResult lists deleted names', () => {
  const result = formatCleanupResult(['snap-a', 'snap-b']);
  expect(result).toContain('2 snapshot(s)');
  expect(result).toContain('snap-a');
  expect(result).toContain('snap-b');
});
