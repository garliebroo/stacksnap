const { sortSnapshots, formatSortedList, SORT_FIELDS, SORT_ORDERS } = require('../snapshot-sort');

const SNAPSHOTS = [
  { name: 'beta', createdAt: '2024-03-10T10:00:00Z', size: 500 },
  { name: 'alpha', createdAt: '2024-01-05T08:00:00Z', size: 1200 },
  { name: 'gamma', createdAt: '2024-06-20T15:00:00Z', size: 300 },
];

describe('sortSnapshots', () => {
  test('sorts by name asc', () => {
    const result = sortSnapshots(SNAPSHOTS, 'name', 'asc');
    expect(result.map(s => s.name)).toEqual(['alpha', 'beta', 'gamma']);
  });

  test('sorts by name desc', () => {
    const result = sortSnapshots(SNAPSHOTS, 'name', 'desc');
    expect(result.map(s => s.name)).toEqual(['gamma', 'beta', 'alpha']);
  });

  test('sorts by date asc', () => {
    const result = sortSnapshots(SNAPSHOTS, 'date', 'asc');
    expect(result.map(s => s.name)).toEqual(['alpha', 'beta', 'gamma']);
  });

  test('sorts by date desc', () => {
    const result = sortSnapshots(SNAPSHOTS, 'date', 'desc');
    expect(result.map(s => s.name)).toEqual(['gamma', 'beta', 'alpha']);
  });

  test('sorts by size asc', () => {
    const result = sortSnapshots(SNAPSHOTS, 'size', 'asc');
    expect(result.map(s => s.name)).toEqual(['gamma', 'beta', 'alpha']);
  });

  test('sorts by size desc', () => {
    const result = sortSnapshots(SNAPSHOTS, 'size', 'desc');
    expect(result.map(s => s.name)).toEqual(['alpha', 'beta', 'gamma']);
  });

  test('does not mutate original array', () => {
    const original = [...SNAPSHOTS];
    sortSnapshots(SNAPSHOTS, 'name', 'asc');
    expect(SNAPSHOTS).toEqual(original);
  });

  test('throws on invalid field', () => {
    expect(() => sortSnapshots(SNAPSHOTS, 'invalid', 'asc')).toThrow('Invalid sort field');
  });

  test('throws on invalid order', () => {
    expect(() => sortSnapshots(SNAPSHOTS, 'name', 'random')).toThrow('Invalid sort order');
  });

  test('handles missing size gracefully (defaults to 0)', () => {
    const snaps = [{ name: 'a', createdAt: '2024-01-01T00:00:00Z' }, { name: 'b', createdAt: '2024-01-01T00:00:00Z', size: 100 }];
    const result = sortSnapshots(snaps, 'size', 'desc');
    expect(result[0].name).toBe('b');
  });
});

describe('formatSortedList', () => {
  test('returns no-snapshots message for empty array', () => {
    expect(formatSortedList([], 'date', 'asc')).toBe('No snapshots found.');
  });

  test('includes field and order in header', () => {
    const output = formatSortedList(SNAPSHOTS, 'name', 'asc');
    expect(output).toContain('name');
    expect(output).toContain('asc');
  });

  test('lists all snapshot names', () => {
    const output = formatSortedList(SNAPSHOTS, 'date', 'desc');
    expect(output).toContain('alpha');
    expect(output).toContain('beta');
    expect(output).toContain('gamma');
  });

  test('includes size when present', () => {
    const output = formatSortedList(SNAPSHOTS, 'size', 'asc');
    expect(output).toContain('300B');
  });
});
