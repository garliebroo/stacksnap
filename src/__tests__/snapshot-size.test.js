const { getSnapshotSize, formatBytes, getSizeReport, formatSizeReport } = require('../snapshot-size');
const { saveSnapshot, ensureSnapshotDir } = require('../snapshot');
const fs = require('fs');
const os = require('os');
const path = require('path');

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-size-test-'));
}

describe('formatBytes', () => {
  it('formats bytes under 1024 as B', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  it('formats bytes in KB range', () => {
    expect(formatBytes(2048)).toBe('2.0 KB');
  });

  it('formats bytes in MB range', () => {
    expect(formatBytes(1048576)).toBe('1.00 MB');
  });
});

describe('getSnapshotSize', () => {
  it('returns byte size of serialized snapshot', () => {
    const snapshot = { name: 'test', configs: { '.nvmrc': '18' } };
    const size = getSnapshotSize(snapshot);
    expect(size).toBe(Buffer.byteLength(JSON.stringify(snapshot), 'utf8'));
  });
});

describe('getSizeReport', () => {
  it('returns empty report when no snapshots', () => {
    const dir = makeTmpDir();
    ensureSnapshotDir(dir);
    const report = getSizeReport(dir);
    expect(report.snapshots).toHaveLength(0);
    expect(report.total).toBe(0);
    expect(report.totalFormatted).toBe('0 B');
  });

  it('returns sizes for each snapshot', () => {
    const dir = makeTmpDir();
    ensureSnapshotDir(dir);
    saveSnapshot(dir, 'snap-a', { name: 'snap-a', configs: { '.nvmrc': '18' } });
    saveSnapshot(dir, 'snap-b', { name: 'snap-b', configs: { '.nvmrc': '20', '.npmrc': 'registry=https://registry.npmjs.org' } });
    const report = getSizeReport(dir);
    expect(report.snapshots).toHaveLength(2);
    expect(report.total).toBeGreaterThan(0);
    const names = report.snapshots.map((s) => s.name);
    expect(names).toContain('snap-a');
    expect(names).toContain('snap-b');
  });
});

describe('formatSizeReport', () => {
  it('returns message when no snapshots', () => {
    const result = formatSizeReport({ snapshots: [], total: 0, totalFormatted: '0 B' });
    expect(result).toBe('No snapshots found.');
  });

  it('includes snapshot names and total line', () => {
    const report = {
      snapshots: [
        { name: 'snap-a', bytes: 200, formatted: '200 B' },
        { name: 'snap-b', bytes: 500, formatted: '500 B' },
      ],
      total: 700,
      totalFormatted: '700 B',
    };
    const output = formatSizeReport(report);
    expect(output).toContain('snap-a');
    expect(output).toContain('snap-b');
    expect(output).toContain('Total: 700 B');
  });
});
