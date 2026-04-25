const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  getHistoryFilePath,
  loadHistory,
  saveHistory,
  recordEvent,
  getSnapshotHistory,
  clearHistory,
  formatHistory
} = require('../history');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-history-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('getHistoryFilePath returns correct path', () => {
  expect(getHistoryFilePath(tmpDir)).toBe(path.join(tmpDir, 'history.json'));
});

test('loadHistory returns empty array when no file', () => {
  expect(loadHistory(tmpDir)).toEqual([]);
});

test('saveHistory and loadHistory round-trip', () => {
  const entries = [{ snapshotName: 'snap1', action: 'create', timestamp: '2024-01-01T00:00:00.000Z' }];
  saveHistory(tmpDir, entries);
  expect(loadHistory(tmpDir)).toEqual(entries);
});

test('recordEvent adds entry to history', () => {
  const history = recordEvent(tmpDir, 'snap1', 'create');
  expect(history).toHaveLength(1);
  expect(history[0].snapshotName).toBe('snap1');
  expect(history[0].action).toBe('create');
  expect(history[0].timestamp).toBeDefined();
});

test('recordEvent accumulates multiple events', () => {
  recordEvent(tmpDir, 'snap1', 'create');
  recordEvent(tmpDir, 'snap1', 'restore');
  const history = loadHistory(tmpDir);
  expect(history).toHaveLength(2);
});

test('getSnapshotHistory filters by name', () => {
  recordEvent(tmpDir, 'snap1', 'create');
  recordEvent(tmpDir, 'snap2', 'create');
  recordEvent(tmpDir, 'snap1', 'restore');
  const result = getSnapshotHistory(tmpDir, 'snap1');
  expect(result).toHaveLength(2);
  result.forEach(e => expect(e.snapshotName).toBe('snap1'));
});

test('clearHistory removes entries for specific snapshot', () => {
  recordEvent(tmpDir, 'snap1', 'create');
  recordEvent(tmpDir, 'snap2', 'create');
  const updated = clearHistory(tmpDir, 'snap1');
  expect(updated.find(e => e.snapshotName === 'snap1')).toBeUndefined();
  expect(updated.find(e => e.snapshotName === 'snap2')).toBeDefined();
});

test('clearHistory clears all when no name given', () => {
  recordEvent(tmpDir, 'snap1', 'create');
  recordEvent(tmpDir, 'snap2', 'create');
  const updated = clearHistory(tmpDir);
  expect(updated).toHaveLength(0);
});

test('formatHistory returns no history message when empty', () => {
  expect(formatHistory([])).toBe('No history found.');
});

test('formatHistory formats entries correctly', () => {
  const entries = [
    { timestamp: '2024-01-01T00:00:00.000Z', action: 'create', snapshotName: 'snap1' }
  ];
  const result = formatHistory(entries);
  expect(result).toContain('CREATE');
  expect(result).toContain('snap1');
  expect(result).toContain('2024-01-01');
});
