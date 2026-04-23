const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('../snapshot', () => ({
  ensureSnapshotDir: () => tmpDir
}));

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-pin-test-'));
  jest.resetModules();
  jest.mock('../snapshot', () => ({
    ensureSnapshotDir: () => tmpDir
  }));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function getPin() {
  return require('../pin');
}

test('loadPins returns empty object when no file exists', () => {
  const { loadPins } = getPin();
  expect(loadPins()).toEqual({});
});

test('pinSnapshot adds a snapshot to pins', () => {
  const { pinSnapshot, loadPins } = getPin();
  pinSnapshot('snap-001');
  const pins = loadPins();
  expect(pins['snap-001']).toBeDefined();
  expect(pins['snap-001'].pinnedAt).toBeDefined();
  expect(pins['snap-001'].label).toBeNull();
});

test('pinSnapshot stores optional label', () => {
  const { pinSnapshot, loadPins } = getPin();
  pinSnapshot('snap-002', 'stable build');
  const pins = loadPins();
  expect(pins['snap-002'].label).toBe('stable build');
});

test('pinSnapshot throws if already pinned', () => {
  const { pinSnapshot } = getPin();
  pinSnapshot('snap-003');
  expect(() => pinSnapshot('snap-003')).toThrow('already pinned');
});

test('unpinSnapshot removes a pinned snapshot', () => {
  const { pinSnapshot, unpinSnapshot, loadPins } = getPin();
  pinSnapshot('snap-004');
  unpinSnapshot('snap-004');
  expect(loadPins()['snap-004']).toBeUndefined();
});

test('unpinSnapshot throws if snapshot is not pinned', () => {
  const { unpinSnapshot } = getPin();
  expect(() => unpinSnapshot('ghost-snap')).toThrow('not pinned');
});

test('isPinned returns true for pinned snapshot', () => {
  const { pinSnapshot, isPinned } = getPin();
  pinSnapshot('snap-005');
  expect(isPinned('snap-005')).toBe(true);
});

test('isPinned returns false for unpinned snapshot', () => {
  const { isPinned } = getPin();
  expect(isPinned('not-there')).toBe(false);
});

test('listPinned returns all pinned snapshots as array', () => {
  const { pinSnapshot, listPinned } = getPin();
  pinSnapshot('snap-006', 'first');
  pinSnapshot('snap-007', 'second');
  const list = listPinned();
  expect(list).toHaveLength(2);
  expect(list.map(p => p.name)).toContain('snap-006');
  expect(list.map(p => p.name)).toContain('snap-007');
});
