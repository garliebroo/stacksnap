const { main } = require('../cli-merge');
const { mergeSnapshots, formatMergeResult } = require('../merge');

jest.mock('../merge');

function runCli(...args) {
  return main(['node', 'cli-merge.js', ...args]);
}

describe('cli-merge', () => {
  let consoleSpy;
  let errorSpy;
  let exitSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    mergeSnapshots.mockResolvedValue({ name: 'merged', mergedFrom: ['a', 'b'], strategy: 'overwrite', configs: {}, createdAt: '' });
    formatMergeResult.mockReturnValue('Merge summary');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('prints usage with --help', async () => {
    await expect(runCli('--help')).rejects.toThrow('exit');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Usage'));
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('prints usage with no args', async () => {
    await expect(runCli()).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('errors if fewer than 3 positional args', async () => {
    await expect(runCli('snapA', 'snapB')).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('output name'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('merges with default strategy', async () => {
    await runCli('snapA', 'snapB', 'merged');
    expect(mergeSnapshots).toHaveBeenCalledWith('snapA', 'snapB', 'merged', { strategy: 'overwrite' });
    expect(consoleSpy).toHaveBeenCalledWith('Merge summary');
  });

  test('merges with custom strategy', async () => {
    await runCli('snapA', 'snapB', 'merged', '--strategy', 'combine');
    expect(mergeSnapshots).toHaveBeenCalledWith('snapA', 'snapB', 'merged', { strategy: 'combine' });
  });

  test('errors on invalid strategy', async () => {
    await expect(runCli('snapA', 'snapB', 'merged', '--strategy', 'bad')).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid strategy'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('handles merge error gracefully', async () => {
    mergeSnapshots.mockRejectedValue(new Error('Snapshot not found: snapA'));
    await expect(runCli('snapA', 'snapB', 'merged')).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Snapshot not found: snapA'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
