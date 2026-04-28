const fs = require('fs');
const path = require('path');
const os = require('os');
const { importSnapshot } = require('../snapshot-import');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-import-int-'));
  jest.mock('../snapshot', () => ({
    ensureSnapshotDir: jest.fn().mockResolvedValue(undefined),
    saveSnapshot: jest.fn().mockResolvedValue(undefined),
  }));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  jest.resetModules();
});

function writeSnap(name, data) {
  const f = path.join(tmpDir, `${name}.json`);
  fs.writeFileSync(f, JSON.stringify(data));
  return f;
}

test('imports snapshot and returns correct structure', async () => {
  const f = writeSnap('env1', { name: 'env1', configs: { '.nvmrc': '20', '.node-version': '20.0.0' } });
  const result = await importSnapshot(f, { snapshotDir: tmpDir });
  expect(result.name).toBe('env1');
  expect(result.configs).toEqual({ '.nvmrc': '20', '.node-version': '20.0.0' });
  expect(result.importedAt).toBeDefined();
  expect(result.createdAt).toBeDefined();
});

test('override name takes precedence over file name', async () => {
  const f = writeSnap('env2', { name: 'env2', configs: {} });
  const result = await importSnapshot(f, { name: 'my-override', snapshotDir: tmpDir });
  expect(result.name).toBe('my-override');
});

test('generates name if missing from file', async () => {
  const f = writeSnap('noname', { configs: { '.eslintrc': '{}' } });
  const result = await importSnapshot(f, { snapshotDir: tmpDir });
  expect(result.name).toMatch(/^imported-/);
});

test('throws on missing file', async () => {
  await expect(importSnapshot('/no/file.json', { snapshotDir: tmpDir })).rejects.toThrow('Import file not found');
});

test('throws on malformed JSON', async () => {
  const f = path.join(tmpDir, 'bad.json');
  fs.writeFileSync(f, '{ not valid json }');
  await expect(importSnapshot(f, { snapshotDir: tmpDir })).rejects.toThrow('Failed to parse import file');
});
