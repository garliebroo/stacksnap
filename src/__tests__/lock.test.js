const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  getLockFilePath,
  lockSnapshot,
  unlockSnapshot,
  isLocked,
  getLockInfo,
  listLocked,
} = require('../lock');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-lock-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('getLockFilePath returns correct path', () => {
  expect(getLockFilePath(tmpDir)).toBe(path.join(tmpDir, 'locks.json'));
});

test('lockSnapshot locks a snapshot', () => {
  const result = lockSnapshot(tmpDir, 'snap1', 'stable release');
  expect(result.success).toBe(true);
  expect(isLocked(tmpDir, 'snap1')).toBe(true);
});

test('lockSnapshot fails if already locked', () => {
  lockSnapshot(tmpDir, 'snap1');
  const result = lockSnapshot(tmpDir, 'snap1');
  expect(result.success).toBe(false);
  expect(result.message).toMatch(/already locked/);
});

test('unlockSnapshot removes lock', () => {
  lockSnapshot(tmpDir, 'snap1');
  const result = unlockSnapshot(tmpDir, 'snap1');
  expect(result.success).toBe(true);
  expect(isLocked(tmpDir, 'snap1')).toBe(false);
});

test('unlockSnapshot fails if not locked', () => {
  const result = unlockSnapshot(tmpDir, 'snap1');
  expect(result.success).toBe(false);
  expect(result.message).toMatch(/not locked/);
});

test('getLockInfo returns lock metadata', () => {
  lockSnapshot(tmpDir, 'snap1', 'do not touch');
  const info = getLockInfo(tmpDir, 'snap1');
  expect(info).not.toBeNull();
  expect(info.reason).toBe('do not touch');
  expect(info.lockedAt).toBeDefined();
});

test('getLockInfo returns null for unlocked snapshot', () => {
  expect(getLockInfo(tmpDir, 'snap1')).toBeNull();
});

test('listLocked returns all locked snapshots', () => {
  lockSnapshot(tmpDir, 'snap1');
  lockSnapshot(tmpDir, 'snap2');
  const all = listLocked(tmpDir);
  expect(Object.keys(all)).toContain('snap1');
  expect(Object.keys(all)).toContain('snap2');
});

test('isLocked returns false when no lock file exists', () => {
  expect(isLocked(tmpDir, 'nonexistent')).toBe(false);
});
