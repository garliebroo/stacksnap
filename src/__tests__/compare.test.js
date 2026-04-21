const { compareSnapshots, formatComparison } = require('../compare');
const { loadSnapshot } = require('../snapshot');

jest.mock('../snapshot');

const snapA = {
  createdAt: '2024-01-01T00:00:00.000Z',
  configs: {
    '.nvmrc': '18',
    '.eslintrc': '{ "semi": true }',
    '.prettierrc': '{ "tabWidth": 2 }',
  },
};

const snapB = {
  createdAt: '2024-02-01T00:00:00.000Z',
  configs: {
    '.nvmrc': '20',
    '.eslintrc': '{ "semi": true }',
    '.editorconfig': '[*]\nindent_size=2',
  },
};

beforeEach(() => {
  loadSnapshot.mockImplementation(async name => {
    if (name === 'snap-a') return snapA;
    if (name === 'snap-b') return snapB;
    return null;
  });
});

describe('compareSnapshots', () => {
  it('returns correct summary counts', async () => {
    const result = await compareSnapshots('snap-a', 'snap-b');
    expect(result.summary.matches).toBe(1);
    expect(result.summary.added).toBe(1);
    expect(result.summary.removed).toBe(1);
    expect(result.summary.changed).toBe(1);
  });

  it('identifies added keys correctly', async () => {
    const result = await compareSnapshots('snap-a', 'snap-b');
    expect(result.details.added).toContain('.editorconfig');
  });

  it('identifies removed keys correctly', async () => {
    const result = await compareSnapshots('snap-a', 'snap-b');
    expect(result.details.removed).toContain('.prettierrc');
  });

  it('identifies changed keys correctly', async () => {
    const result = await compareSnapshots('snap-a', 'snap-b');
    expect(result.details.changed[0].key).toBe('.nvmrc');
    expect(result.details.changed[0].from).toBe('18');
    expect(result.details.changed[0].to).toBe('20');
  });

  it('identifies matching keys correctly', async () => {
    const result = await compareSnapshots('snap-a', 'snap-b');
    expect(result.details.matches).toContain('.eslintrc');
  });

  it('throws if snapshot A not found', async () => {
    await expect(compareSnapshots('missing', 'snap-b')).rejects.toThrow('Snapshot not found: missing');
  });

  it('throws if snapshot B not found', async () => {
    await expect(compareSnapshots('snap-a', 'missing')).rejects.toThrow('Snapshot not found: missing');
  });
});

describe('formatComparison', () => {
  it('includes both snapshot names in output', async () => {
    const result = await compareSnapshots('snap-a', 'snap-b');
    const output = formatComparison(result);
    expect(output).toContain('snap-a');
    expect(output).toContain('snap-b');
  });

  it('includes summary line', async () => {
    const result = await compareSnapshots('snap-a', 'snap-b');
    const output = formatComparison(result);
    expect(output).toContain('Summary:');
  });

  it('marks added, removed, changed with symbols', async () => {
    const result = await compareSnapshots('snap-a', 'snap-b');
    const output = formatComparison(result);
    expect(output).toContain('+ .editorconfig');
    expect(output).toContain('- .prettierrc');
    expect(output).toContain('~ .nvmrc');
  });
});
