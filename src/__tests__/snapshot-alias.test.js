const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-alias-'));
  jest.resetModules();
  jest.doMock('../snapshot', () => ({
    ensureSnapshotDir: () => tmpDir,
  }));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  jest.resetModules();
});

function getModule() {
  return require('../snapshot-alias');
}

test('loadAliases returns empty object when file missing', () => {
  const { loadAliases } = getModule();
  expect(loadAliases()).toEqual({});
});

test('setAlias creates alias entry', () => {
  const { setAlias, loadAliases } = getModule();
  setAlias('prod', 'snapshot-2024-01-01');
  expect(loadAliases()).toEqual({ prod: 'snapshot-2024-01-01' });
});

test('setAlias throws on missing args', () => {
  const { setAlias } = getModule();
  expect(() => setAlias('', 'snap')).toThrow('alias and snapshotName are required');
  expect(() => setAlias('myalias', '')).toThrow('alias and snapshotName are required');
});

test('setAlias overwrites existing alias', () => {
  const { setAlias, loadAliases } = getModule();
  setAlias('dev', 'snap-old');
  setAlias('dev', 'snap-new');
  expect(loadAliases().dev).toBe('snap-new');
});

test('removeAlias removes existing alias', () => {
  const { setAlias, removeAlias, loadAliases } = getModule();
  setAlias('staging', 'snap-staging');
  removeAlias('staging');
  expect(loadAliases()).toEqual({});
});

test('removeAlias throws if alias not found', () => {
  const { removeAlias } = getModule();
  expect(() => removeAlias('nonexistent')).toThrow('Alias "nonexistent" not found');
});

test('resolveAlias returns snapshot name for known alias', () => {
  const { setAlias, resolveAlias } = getModule();
  setAlias('latest', 'snapshot-xyz');
  expect(resolveAlias('latest')).toBe('snapshot-xyz');
});

test('resolveAlias returns original string if not an alias', () => {
  const { resolveAlias } = getModule();
  expect(resolveAlias('snapshot-abc')).toBe('snapshot-abc');
});

test('formatAliasList returns message when empty', () => {
  const { formatAliasList } = getModule();
  expect(formatAliasList({})).toBe('No aliases defined.');
});

test('formatAliasList formats entries correctly', () => {
  const { formatAliasList } = getModule();
  const result = formatAliasList({ prod: 'snap-prod', dev: 'snap-dev' });
  expect(result).toContain('prod -> snap-prod');
  expect(result).toContain('dev -> snap-dev');
});
