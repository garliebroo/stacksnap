const { diffSnapshots, formatDiff } = require('../diff');

const snapshotA = {
  name: 'snap-a',
  configs: {
    '.nvmrc': '18.0.0',
    '.eslintrc': '{"semi": true}',
    '.prettierrc': '{"singleQuote": true}',
  },
};

const snapshotB = {
  name: 'snap-b',
  configs: {
    '.nvmrc': '20.0.0',
    '.eslintrc': '{"semi": true}',
    '.babelrc': '{"presets": ["@babel/preset-env"]}',
  },
};

describe('diffSnapshots', () => {
  let diff;

  beforeEach(() => {
    diff = diffSnapshots(snapshotA, snapshotB);
  });

  test('detects added files', () => {
    expect(diff.added).toHaveLength(1);
    expect(diff.added[0].file).toBe('.babelrc');
  });

  test('detects removed files', () => {
    expect(diff.removed).toHaveLength(1);
    expect(diff.removed[0].file).toBe('.prettierrc');
  });

  test('detects changed files', () => {
    expect(diff.changed).toHaveLength(1);
    expect(diff.changed[0].file).toBe('.nvmrc');
    expect(diff.changed[0].from).toBe('18.0.0');
    expect(diff.changed[0].to).toBe('20.0.0');
  });

  test('detects unchanged files', () => {
    expect(diff.unchanged).toContain('.eslintrc');
  });

  test('returns no diff for identical snapshots', () => {
    const result = diffSnapshots(snapshotA, snapshotA);
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
    expect(result.changed).toHaveLength(0);
    expect(result.unchanged).toHaveLength(3);
  });
});

describe('formatDiff', () => {
  test('formats a diff with changes', () => {
    const diff = diffSnapshots(snapshotA, snapshotB);
    const output = formatDiff(diff);
    expect(output).toContain('+ .babelrc');
    expect(output).toContain('- .prettierrc');
    expect(output).toContain('~ .nvmrc');
  });

  test('shows no differences message for identical snapshots', () => {
    const diff = diffSnapshots(snapshotA, snapshotA);
    const output = formatDiff(diff);
    expect(output).toBe('No differences found.');
  });
});
