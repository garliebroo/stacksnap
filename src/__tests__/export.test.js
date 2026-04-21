const fs = require('fs');
const path = require('path');
const os = require('os');
const { exportSnapshot, importSnapshot } = require('../export');
const { saveSnapshot, loadSnapshot } = require('../snapshot');

jest.mock('../snapshot');

describe('exportSnapshot', () => {
  const mockSnapshot = {
    name: 'test-snap',
    createdAt: '2024-01-01T00:00:00.000Z',
    configs: { '.nvmrc': '18.0.0', '.npmrc': 'registry=https://registry.npmjs.org' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('throws if snapshot not found', async () => {
    loadSnapshot.mockResolvedValue(null);
    await expect(exportSnapshot('nonexistent')).rejects.toThrow('Snapshot "nonexistent" not found');
  });

  test('creates a .stacksnap file in the specified output dir', async () => {
    loadSnapshot.mockResolvedValue(mockSnapshot);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-'));

    const outputFile = await exportSnapshot('test-snap', tmpDir);

    expect(outputFile).toBe(path.join(tmpDir, 'test-snap.stacksnap'));
    expect(fs.existsSync(outputFile)).toBe(true);

    fs.rmSync(tmpDir, { recursive: true });
  });
});

describe('importSnapshot', () => {
  test('throws if archive file does not exist', async () => {
    await expect(importSnapshot('/nonexistent/path.stacksnap')).rejects.toThrow('Archive not found');
  });

  test('throws if archive is missing snapshot.json', async () => {
    const archiver = require('archiver');
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-'));
    const badArchive = path.join(tmpDir, 'bad.stacksnap');
    const output = fs.createWriteStream(badArchive);
    const archive = archiver('zip');
    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      archive.append('nothing', { name: 'other.txt' });
      archive.finalize();
    });

    await expect(importSnapshot(badArchive)).rejects.toThrow('Invalid .stacksnap archive');
    fs.rmSync(tmpDir, { recursive: true });
  });
});
