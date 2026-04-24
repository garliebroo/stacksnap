const { validateSnapshotStructure, validateConfigFiles, validateSnapshot, formatValidationResult } = require('../validate');
const { saveSnapshot, loadSnapshot } = require('../snapshot');
const path = require('path');
const os = require('os');
const fs = require('fs');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-validate-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('validateSnapshotStructure', () => {
  test('returns no errors for valid snapshot', () => {
    const snapshot = { name: 'test', timestamp: new Date().toISOString(), configs: { '.nvmrc': '18' } };
    expect(validateSnapshotStructure(snapshot)).toEqual([]);
  });

  test('returns error for missing name', () => {
    const snapshot = { timestamp: new Date().toISOString(), configs: {} };
    const errors = validateSnapshotStructure(snapshot);
    expect(errors).toContain('Missing required field: name');
  });

  test('returns error for missing configs', () => {
    const snapshot = { name: 'test', timestamp: new Date().toISOString() };
    const errors = validateSnapshotStructure(snapshot);
    expect(errors).toContain('Missing required field: configs');
  });

  test('returns error for invalid timestamp', () => {
    const snapshot = { name: 'test', timestamp: 'not-a-date', configs: {} };
    const errors = validateSnapshotStructure(snapshot);
    expect(errors).toContain('Field "timestamp" is not a valid date');
  });

  test('returns error for non-object configs', () => {
    const snapshot = { name: 'test', timestamp: new Date().toISOString(), configs: 'bad' };
    const errors = validateSnapshotStructure(snapshot);
    expect(errors).toContain('Field "configs" must be an object');
  });
});

describe('validateConfigFiles', () => {
  test('returns no warnings for valid configs', () => {
    const snapshot = { configs: { '.nvmrc': '18', '.npmrc': 'registry=https://registry.npmjs.org' } };
    expect(validateConfigFiles(snapshot)).toEqual([]);
  });

  test('warns on empty config value', () => {
    const snapshot = { configs: { '.nvmrc': '' } };
    const warnings = validateConfigFiles(snapshot);
    expect(warnings).toContain('Config ".nvmrc" is empty');
  });

  test('warns on non-string config value', () => {
    const snapshot = { configs: { '.nvmrc': 18 } };
    const warnings = validateConfigFiles(snapshot);
    expect(warnings).toContain('Config ".nvmrc" has non-string content');
  });
});

describe('validateSnapshot', () => {
  test('returns valid for a saved snapshot', async () => {
    await saveSnapshot('mysnap', { '.nvmrc': '18' }, tmpDir);
    const result = await validateSnapshot('mysnap', tmpDir);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('returns invalid for missing snapshot', async () => {
    const result = await validateSnapshot('ghost', tmpDir);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/Could not load snapshot/);
  });
});

describe('formatValidationResult', () => {
  test('includes valid message when no errors', () => {
    const result = { valid: true, errors: [], warnings: [] };
    const output = formatValidationResult(result, 'mysnap');
    expect(output).toContain('✓ Structure is valid');
  });

  test('includes error lines when invalid', () => {
    const result = { valid: false, errors: ['Missing required field: name'], warnings: [] };
    const output = formatValidationResult(result, 'mysnap');
    expect(output).toContain('ERROR: Missing required field: name');
  });

  test('includes warning lines', () => {
    const result = { valid: true, errors: [], warnings: ['Config ".nvmrc" is empty'] };
    const output = formatValidationResult(result, 'mysnap');
    expect(output).toContain('WARN: Config ".nvmrc" is empty');
  });
});
