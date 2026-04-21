const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('fs');

const { saveSnapshot, loadSnapshot, listSnapshots } = require('../snapshot');

const MOCK_HOME = '/mock/home';
const SNAPSHOT_DIR = path.join(MOCK_HOME, '.stacksnap');

beforeEach(() => {
  jest.clearAllMocks();
  os.homedir = jest.fn(() => MOCK_HOME);
  os.hostname = jest.fn(() => 'test-machine');
});

describe('saveSnapshot', () => {
  it('writes a snapshot json file', () => {
    fs.existsSync.mockImplementation((p) => p.includes('.nvmrc'));
    fs.readFileSync.mockReturnValue('v18.0.0');
    fs.mkdirSync.mockImplementation(() => {});
    fs.writeFileSync.mockImplementation(() => {});

    const outPath = saveSnapshot('mystack', { nvmrc: '~/.nvmrc' });

    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    const [writtenPath, writtenContent] = fs.writeFileSync.mock.calls[0];
    expect(writtenPath).toContain('mystack.json');
    const parsed = JSON.parse(writtenContent);
    expect(parsed.configs.nvmrc.content).toBe('v18.0.0');
    expect(parsed.machine).toBe('test-machine');
  });

  it('skips files that do not exist', () => {
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockImplementation(() => {});
    fs.writeFileSync.mockImplementation(() => {});
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    saveSnapshot('empty', { missing: '~/.missing' });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Skipping 'missing'"));
  });

  it('creates the snapshot directory if it does not exist', () => {
    fs.existsSync.mockImplementation((p) => p.includes('.nvmrc'));
    fs.readFileSync.mockReturnValue('v18.0.0');
    fs.mkdirSync.mockImplementation(() => {});
    fs.writeFileSync.mockImplementation(() => {});

    saveSnapshot('mystack', { nvmrc: '~/.nvmrc' });

    expect(fs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining('.stacksnap'),
      expect.objectContaining({ recursive: true })
    );
  });
});

describe('listSnapshots', () => {
  it('returns snapshot names without .json extension', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readdirSync.mockReturnValue(['work.json', 'home.json', 'notes.txt']);

    const list = listSnapshots();
    expect(list).toEqual(['work', 'home']);
  });

  it('returns empty array when snapshot directory does not exist', () => {
    fs.existsSync.mockReturnValue(false);

    const list = listSnapshots();
    expect(list).toEqual([]);
  });
});

describe('loadSnapshot', () => {
  it('throws if snapshot does not exist', () => {
    fs.existsSync.mockReturnValue(false);
    expect(() => loadSnapshot('ghost')).toThrow("Snapshot 'ghost' not found");
  });

  it('parses and returns snapshot data', () => {
    const mockData = { createdAt: '2024-01-01', configs: {} };
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

    const result = loadSnapshot('mystack');
    expect(result.createdAt).toBe('2024-01-01');
  });
});
