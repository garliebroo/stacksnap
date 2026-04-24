const fs = require('fs');
const path = require('path');
const os = require('os');
const { archiveSnapshot, unarchiveSnapshot, listArchived, isArchived, getArchiveDir } = require('../archive');
const { loadSnapshot } = require('../snapshot');

jest.mock('../snapshot');

const TMP_DIR = path.join(os.tmpdir(), 'stacksnap-archive-test-' + Date.now());

beforeEach(() => {
  jest.resetAllMocks();
  process.env.HOME = TMP_DIR;
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true });
  }
});

afterAll(() => {
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true });
  }
});

test('archiveSnapshot saves snapshot to archive dir', () => {
  loadSnapshot.mockReturnValue({ name: 'mysnap', configs: {} });
  const archivePath = archiveSnapshot('mysnap');
  expect(fs.existsSync(archivePath)).toBe(true);
  const data = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
  expect(data.name).toBe('mysnap');
  expect(data.archivedAt).toBeDefined();
});

test('archiveSnapshot throws if snapshot not found', () => {
  loadSnapshot.mockReturnValue(null);
  expect(() => archiveSnapshot('ghost')).toThrow('Snapshot "ghost" not found');
});

test('archiveSnapshot throws if already archived', () => {
  loadSnapshot.mockReturnValue({ name: 'mysnap', configs: {} });
  archiveSnapshot('mysnap');
  expect(() => archiveSnapshot('mysnap')).toThrow('already archived');
});

test('unarchiveSnapshot returns data and removes archive file', () => {
  loadSnapshot.mockReturnValue({ name: 'mysnap', configs: {} });
  archiveSnapshot('mysnap');
  const data = unarchiveSnapshot('mysnap');
  expect(data.name).toBe('mysnap');
  expect(data.archivedAt).toBeUndefined();
  expect(isArchived('mysnap')).toBe(false);
});

test('unarchiveSnapshot throws if not archived', () => {
  expect(() => unarchiveSnapshot('nope')).toThrow('No archived snapshot found');
});

test('listArchived returns all archived snapshots', () => {
  loadSnapshot.mockReturnValue({ name: 'snap1', configs: {} });
  archiveSnapshot('snap1');
  loadSnapshot.mockReturnValue({ name: 'snap2', configs: {} });
  archiveSnapshot('snap2');
  const list = listArchived();
  expect(list).toHaveLength(2);
  expect(list.map(s => s.name)).toContain('snap1');
  expect(list.map(s => s.name)).toContain('snap2');
});

test('isArchived returns false for non-archived snapshot', () => {
  expect(isArchived('missing')).toBe(false);
});
