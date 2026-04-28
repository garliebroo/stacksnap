const fs = require('fs');
const path = require('path');
const os = require('os');
const { validateImportFile, parseImportFile, normalizeImportData, importSnapshot, formatImportResult } = require('../snapshot-import');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-import-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('validateImportFile', () => {
  it('throws if file does not exist', () => {
    expect(() => validateImportFile('/nonexistent/file.json')).toThrow('Import file not found');
  });

  it('throws if file is not .json', () => {
    const f = path.join(tmpDir, 'snap.txt');
    fs.writeFileSync(f, 'hello');
    expect(() => validateImportFile(f)).toThrow('Unsupported file format');
  });

  it('passes for a valid .json file', () => {
    const f = path.join(tmpDir, 'snap.json');
    fs.writeFileSync(f, '{}');
    expect(() => validateImportFile(f)).not.toThrow();
  });
});

describe('parseImportFile', () => {
  it('parses valid JSON', () => {
    const f = path.join(tmpDir, 'snap.json');
    fs.writeFileSync(f, JSON.stringify({ name: 'test', configs: {} }));
    expect(parseImportFile(f)).toEqual({ name: 'test', configs: {} });
  });

  it('throws on invalid JSON', () => {
    const f = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(f, 'not json');
    expect(() => parseImportFile(f)).toThrow('Failed to parse import file');
  });
});

describe('normalizeImportData', () => {
  it('uses overrideName when provided', () => {
    const result = normalizeImportData({ name: 'original', configs: { a: 1 } }, 'override');
    expect(result.name).toBe('override');
  });

  it('falls back to data.name', () => {
    const result = normalizeImportData({ name: 'mysnap', configs: {} });
    expect(result.name).toBe('mysnap');
  });

  it('generates a name if none provided', () => {
    const result = normalizeImportData({ configs: {} });
    expect(result.name).toMatch(/^imported-/);
  });

  it('throws on invalid data', () => {
    expect(() => normalizeImportData(null)).toThrow('Invalid snapshot format');
  });
});

describe('formatImportResult', () => {
  it('formats result message', () => {
    const snap = { name: 'mysnap', configs: { a: 1, b: 2 } };
    expect(formatImportResult(snap)).toBe('Imported snapshot "mysnap" with 2 config(s).');
  });
});
