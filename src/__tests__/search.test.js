const { searchSnapshots, formatSearchResults } = require('../search');
const { listSnapshots, loadSnapshot } = require('../snapshot');

jest.mock('../snapshot');

const mockSnapshots = {
  'snap-2024-01-01': {
    createdAt: '2024-01-01T10:00:00Z',
    tags: ['work', 'node18'],
    configs: { '.nvmrc': '18', '.npmrc': 'registry=...' }
  },
  'snap-2024-06-15': {
    createdAt: '2024-06-15T08:00:00Z',
    tags: ['personal'],
    configs: { '.zshrc': 'export PATH=...' }
  },
  'snap-2024-09-10': {
    createdAt: '2024-09-10T12:00:00Z',
    tags: ['work'],
    configs: { '.nvmrc': '20', '.gitconfig': '[user]...' }
  }
};

beforeEach(() => {
  listSnapshots.mockResolvedValue(Object.keys(mockSnapshots));
  loadSnapshot.mockImplementation((name) =>
    Promise.resolve(mockSnapshots[name] || null)
  );
});

test('returns all snapshots when no query filters given', async () => {
  const results = await searchSnapshots({});
  expect(results).toHaveLength(3);
});

test('filters by name substring', async () => {
  const results = await searchSnapshots({ name: '2024-06' });
  expect(results).toHaveLength(1);
  expect(results[0].name).toBe('snap-2024-06-15');
});

test('filters by tag', async () => {
  const results = await searchSnapshots({ tag: 'work' });
  expect(results).toHaveLength(2);
});

test('filters by configKey', async () => {
  const results = await searchSnapshots({ configKey: 'nvmrc' });
  expect(results).toHaveLength(2);
});

test('filters by after date', async () => {
  const results = await searchSnapshots({ after: '2024-06-01' });
  expect(results).toHaveLength(2);
});

test('filters by before date', async () => {
  const results = await searchSnapshots({ before: '2024-06-01' });
  expect(results).toHaveLength(1);
  expect(results[0].name).toBe('snap-2024-01-01');
});

test('formatSearchResults returns no-match message for empty array', () => {
  const output = formatSearchResults([]);
  expect(output).toMatch(/No snapshots matched/);
});

test('formatSearchResults includes name, date, configs, and tags', () => {
  const results = [{ name: 'snap-2024-01-01', snapshot: mockSnapshots['snap-2024-01-01'] }];
  const output = formatSearchResults(results);
  expect(output).toContain('snap-2024-01-01');
  expect(output).toContain('.nvmrc');
  expect(output).toContain('work');
});
