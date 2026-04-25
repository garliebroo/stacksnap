const { countSnapshots, countByDate, countRecent, formatCountReport } = require('../snapshot-count');

jest.mock('../snapshot');
const { listSnapshots } = require('../snapshot');

const now = Date.now();
const daysAgo = (n) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString();

const mockSnapshots = [
  { name: 'snap-a', createdAt: daysAgo(0) },
  { name: 'snap-b', createdAt: daysAgo(1) },
  { name: 'snap-c', createdAt: daysAgo(3) },
  { name: 'snap-d', createdAt: daysAgo(10) },
  { name: 'snap-e', createdAt: daysAgo(10) },
];

beforeEach(() => {
  listSnapshots.mockResolvedValue(mockSnapshots);
});

test('countSnapshots returns total number of snapshots', async () => {
  const count = await countSnapshots('/fake/dir');
  expect(count).toBe(5);
});

test('countSnapshots returns 0 when no snapshots exist', async () => {
  listSnapshots.mockResolvedValueOnce([]);
  const count = await countSnapshots('/fake/dir');
  expect(count).toBe(0);
});

test('countByDate groups snapshots by date', async () => {
  const result = await countByDate('/fake/dir');
  expect(typeof result).toBe('object');
  const total = Object.values(result).reduce((a, b) => a + b, 0);
  expect(total).toBe(5);
});

test('countByDate returns empty object when no snapshots', async () => {
  listSnapshots.mockResolvedValueOnce([]);
  const result = await countByDate('/fake/dir');
  expect(result).toEqual({});
});

test('countRecent counts snapshots within last 7 days', async () => {
  const count = await countRecent('/fake/dir', 7);
  expect(count).toBe(3);
});

test('countRecent with 0 days returns only today snapshots', async () => {
  const count = await countRecent('/fake/dir', 0);
  expect(count).toBe(0);
});

test('countRecent with large window returns all snapshots', async () => {
  const count = await countRecent('/fake/dir', 30);
  expect(count).toBe(5);
});

test('formatCountReport returns a formatted string', async () => {
  const report = await formatCountReport('/fake/dir');
  expect(report).toContain('Total snapshots: 5');
  expect(report).toContain('Created in last 7 days: 3');
  expect(report).toContain('Snapshots per day:');
});

test('formatCountReport shows (none) when no snapshots', async () => {
  listSnapshots.mockResolvedValue([]);
  const report = await formatCountReport('/fake/dir');
  expect(report).toContain('Total snapshots: 0');
  expect(report).toContain('(none)');
});
