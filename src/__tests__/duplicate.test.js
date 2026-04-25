const path = require('path');
const fs = require('fs');
const os = require('os');
const { duplicateSnapshot } = require('../duplicate');
const { saveSnapshot, listSnapshots } = require('../snapshot');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-dup-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const makeSnap = async (name) => {
  await saveSnapshot(name, { name, configs: { '.nvmrc': '18' }, createdAt: '2024-01-01T00:00:00.000Z' }, tmpDir);
};

test('duplicates a snapshot with a new name', async () => {
  await makeSnap('alpha');
  const result = await duplicateSnapshot('alpha', 'alpha-copy', tmpDir);
  expect(result.success).toBe(true);
  expect(result.message).toMatch(/duplicated/);
  const snapshots = await listSnapshots(tmpDir);
  expect(snapshots).toContain('alpha-copy');
});

test('new duplicate has updated createdAt and duplicatedFrom fields', async () => {
  await makeSnap('base');
  await duplicateSnapshot('base', 'base-v2', tmpDir);
  const { loadSnapshot } = require('../snapshot');
  const dup = await loadSnapshot('base-v2', tmpDir);
  expect(dup.duplicatedFrom).toBe('base');
  expect(dup.name).toBe('base-v2');
  expect(dup.createdAt).not.toBe('2024-01-01T00:00:00.000Z');
});

test('fails when source does not exist', async () => {
  const result = await duplicateSnapshot('ghost', 'ghost-copy', tmpDir);
  expect(result.success).toBe(false);
  expect(result.message).toMatch(/not found/);
});

test('fails when target already exists', async () => {
  await makeSnap('snap1');
  await makeSnap('snap2');
  const result = await duplicateSnapshot('snap1', 'snap2', tmpDir);
  expect(result.success).toBe(false);
  expect(result.message).toMatch(/already exists/);
});

test('fails when source and target names are the same', async () => {
  await makeSnap('same');
  const result = await duplicateSnapshot('same', 'same', tmpDir);
  expect(result.success).toBe(false);
  expect(result.message).toMatch(/different/);
});

test('fails when names are missing', async () => {
  const result = await duplicateSnapshot('', 'target', tmpDir);
  expect(result.success).toBe(false);
  expect(result.message).toMatch(/required/);
});
