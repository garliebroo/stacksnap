const { mergeSnapshots, mergeConfigs, combineValues, formatMergeResult } = require('../merge');
const { loadSnapshot, saveSnapshot } = require('../snapshot');

jest.mock('../snapshot');

describe('mergeConfigs', () => {
  const configsA = { '.bashrc': 'export A=1', '.vimrc': 'set number' };
  const configsB = { '.bashrc': 'export B=2', '.zshrc': 'alias ll=ls' };

  test('overwrite strategy: B overrides A on conflict', () => {
    const result = mergeConfigs(configsA, configsB, 'overwrite');
    expect(result['.bashrc']).toBe('export B=2');
    expect(result['.vimrc']).toBe('set number');
    expect(result['.zshrc']).toBe('alias ll=ls');
  });

  test('keep strategy: A is preserved on conflict', () => {
    const result = mergeConfigs(configsA, configsB, 'keep');
    expect(result['.bashrc']).toBe('export A=1');
    expect(result['.zshrc']).toBe('alias ll=ls');
  });

  test('combine strategy: merges unique lines', () => {
    const result = mergeConfigs(configsA, configsB, 'combine');
    expect(result['.bashrc']).toContain('export A=1');
    expect(result['.bashrc']).toContain('export B=2');
  });
});

describe('combineValues', () => {
  test('deduplicates lines from two strings', () => {
    const a = 'line1\nline2';
    const b = 'line2\nline3';
    const result = combineValues(a, b);
    expect(result).toContain('line1');
    expect(result).toContain('line2');
    expect(result).toContain('line3');
    expect(result.split('\n').length).toBe(3);
  });

  test('non-string fallback returns b', () => {
    expect(combineValues(1, 2)).toBe(2);
  });
});

describe('mergeSnapshots', () => {
  beforeEach(() => {
    loadSnapshot.mockImplementation(async (name) => {
      if (name === 'snapA') return { name: 'snapA', configs: { '.bashrc': 'A' } };
      if (name === 'snapB') return { name: 'snapB', configs: { '.zshrc': 'B' } };
      return null;
    });
    saveSnapshot.mockResolvedValue(undefined);
  });

  test('merges two snapshots and saves result', async () => {
    const result = await mergeSnapshots('snapA', 'snapB', 'merged');
    expect(result.name).toBe('merged');
    expect(result.configs['.bashrc']).toBe('A');
    expect(result.configs['.zshrc']).toBe('B');
    expect(result.mergedFrom).toEqual(['snapA', 'snapB']);
    expect(saveSnapshot).toHaveBeenCalledWith('merged', expect.objectContaining({ name: 'merged' }));
  });

  test('throws if snapshotA not found', async () => {
    loadSnapshot.mockResolvedValueOnce(null);
    await expect(mergeSnapshots('missing', 'snapB', 'out')).rejects.toThrow('Snapshot not found: missing');
  });

  test('throws if snapshotB not found', async () => {
    loadSnapshot.mockResolvedValueOnce({ name: 'snapA', configs: {} });
    loadSnapshot.mockResolvedValueOnce(null);
    await expect(mergeSnapshots('snapA', 'missing', 'out')).rejects.toThrow('Snapshot not found: missing');
  });
});

describe('formatMergeResult', () => {
  test('returns formatted string with all fields', () => {
    const merged = {
      name: 'out',
      mergedFrom: ['a', 'b'],
      strategy: 'overwrite',
      configs: { '.bashrc': 'x', '.vimrc': 'y' },
      createdAt: '2024-01-01T00:00:00.000Z',
    };
    const output = formatMergeResult(merged);
    expect(output).toContain('out');
    expect(output).toContain('a + b');
    expect(output).toContain('overwrite');
    expect(output).toContain('2');
  });
});
