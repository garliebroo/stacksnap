const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  getMetadataFilePath,
  loadMetadata,
  setMetadata,
  getMetadata,
  removeMetadata,
  formatMetadata,
} = require('../snapshot-metadata');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-meta-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('getMetadataFilePath returns correct path', () => {
  expect(getMetadataFilePath(tmpDir)).toBe(path.join(tmpDir, 'metadata.json'));
});

test('loadMetadata returns empty object when file missing', () => {
  expect(loadMetadata(tmpDir)).toEqual({});
});

test('setMetadata creates entry for snapshot', () => {
  const result = setMetadata(tmpDir, 'snap1', 'author', 'alice');
  expect(result.author).toBe('alice');
  expect(result.updatedAt).toBeDefined();
});

test('getMetadata retrieves stored metadata', () => {
  setMetadata(tmpDir, 'snap1', 'env', 'production');
  const meta = getMetadata(tmpDir, 'snap1');
  expect(meta.env).toBe('production');
});

test('getMetadata returns null for unknown snapshot', () => {
  expect(getMetadata(tmpDir, 'nonexistent')).toBeNull();
});

test('setMetadata merges multiple keys', () => {
  setMetadata(tmpDir, 'snap1', 'author', 'bob');
  setMetadata(tmpDir, 'snap1', 'project', 'myapp');
  const meta = getMetadata(tmpDir, 'snap1');
  expect(meta.author).toBe('bob');
  expect(meta.project).toBe('myapp');
});

test('removeMetadata deletes snapshot entry', () => {
  setMetadata(tmpDir, 'snap1', 'author', 'carol');
  const removed = removeMetadata(tmpDir, 'snap1');
  expect(removed).toBe(true);
  expect(getMetadata(tmpDir, 'snap1')).toBeNull();
});

test('removeMetadata returns false for unknown snapshot', () => {
  expect(removeMetadata(tmpDir, 'ghost')).toBe(false);
});

test('formatMetadata formats entry as string', () => {
  setMetadata(tmpDir, 'snap1', 'author', 'dave');
  const meta = getMetadata(tmpDir, 'snap1');
  const output = formatMetadata(meta);
  expect(output).toContain('author: dave');
  expect(output).toContain('updatedAt:');
});

test('formatMetadata handles null', () => {
  expect(formatMetadata(null)).toBe('(no metadata)');
});
