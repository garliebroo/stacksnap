const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('../snapshot', () => ({
  ensureSnapshotDir: jest.fn(),
  loadSnapshot: jest.fn(),
  saveSnapshot: jest.fn(),
}));

const { ensureSnapshotDir, loadSnapshot } = require('../snapshot');
const { tagSnapshot, removeTag, getSnapshotsByTag, getTagsForSnapshot, listAllTags } = require('../tag');

describe('tag module', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-tag-test-'));
    ensureSnapshotDir.mockReturnValue(tmpDir);
    loadSnapshot.mockReturnValue({ name: 'test', configs: {} });
    jest.clearAllMocks();
    ensureSnapshotDir.mockReturnValue(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('tagSnapshot adds a tag to a snapshot', () => {
    loadSnapshot.mockReturnValue({ name: 'snap1', configs: {} });
    const result = tagSnapshot('snap1', 'work');
    expect(result).toContain('snap1');
  });

  test('tagSnapshot throws if snapshot not found', () => {
    loadSnapshot.mockReturnValue(null);
    expect(() => tagSnapshot('missing', 'work')).toThrow('Snapshot "missing" not found');
  });

  test('tagSnapshot does not duplicate entries', () => {
    loadSnapshot.mockReturnValue({ name: 'snap1', configs: {} });
    tagSnapshot('snap1', 'work');
    const result = tagSnapshot('snap1', 'work');
    expect(result.filter(s => s === 'snap1').length).toBe(1);
  });

  test('getSnapshotsByTag returns snapshots for a tag', () => {
    loadSnapshot.mockReturnValue({ name: 'snap1', configs: {} });
    tagSnapshot('snap1', 'personal');
    const snaps = getSnapshotsByTag('personal');
    expect(snaps).toContain('snap1');
  });

  test('getSnapshotsByTag returns empty array for unknown tag', () => {
    expect(getSnapshotsByTag('nope')).toEqual([]);
  });

  test('getTagsForSnapshot returns all tags for a snapshot', () => {
    loadSnapshot.mockReturnValue({ name: 'snap1', configs: {} });
    tagSnapshot('snap1', 'work');
    tagSnapshot('snap1', 'stable');
    const tags = getTagsForSnapshot('snap1');
    expect(tags).toContain('work');
    expect(tags).toContain('stable');
  });

  test('removeTag removes a snapshot from a tag', () => {
    loadSnapshot.mockReturnValue({ name: 'snap1', configs: {} });
    tagSnapshot('snap1', 'work');
    const removed = removeTag('snap1', 'work');
    expect(removed).toBe(true);
    expect(getSnapshotsByTag('work')).not.toContain('snap1');
  });

  test('removeTag returns false for non-existent tag', () => {
    expect(removeTag('snap1', 'ghost')).toBe(false);
  });

  test('listAllTags returns full tags map', () => {
    loadSnapshot.mockReturnValue({ name: 'snap1', configs: {} });
    tagSnapshot('snap1', 'mytag');
    const all = listAllTags();
    expect(all).toHaveProperty('mytag');
  });
});
