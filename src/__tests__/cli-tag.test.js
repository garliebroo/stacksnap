jest.mock('../tag', () => ({
  tagSnapshot: jest.fn(),
  removeTag: jest.fn(),
  getSnapshotsByTag: jest.fn(),
  getTagsForSnapshot: jest.fn(),
  listAllTags: jest.fn(),
}));

const { tagSnapshot, removeTag, getSnapshotsByTag, getTagsForSnapshot, listAllTags } = require('../tag');

function runCli(...args) {
  const originalArgv = process.argv;
  const originalExit = process.exit;
  const originalLog = console.log;
  const originalError = console.error;

  const logs = [];
  const errors = [];
  let exitCode = 0;

  process.argv = ['node', 'cli-tag.js', ...args];
  process.exit = (code) => { exitCode = code; throw new Error(`EXIT:${code}`); };
  console.log = (...a) => logs.push(a.join(' '));
  console.error = (...a) => errors.push(a.join(' '));

  try {
    jest.resetModules();
    require('../cli-tag');
  } catch (e) {
    if (!e.message.startsWith('EXIT:')) throw e;
  } finally {
    process.argv = originalArgv;
    process.exit = originalExit;
    console.log = originalLog;
    console.error = originalError;
  }

  return { logs, errors, exitCode };
}

describe('cli-tag', () => {
  beforeEach(() => jest.resetModules());

  test('add command calls tagSnapshot and logs result', () => {
    const { tagSnapshot: ts } = require('../tag');
    ts.mockReturnValue(['snap1']);
    const { logs } = runCli('add', 'snap1', 'work');
    expect(logs.some(l => l.includes('Tagged'))).toBe(true);
  });

  test('remove command calls removeTag', () => {
    const { removeTag: rmt } = require('../tag');
    rmt.mockReturnValue(true);
    const { logs } = runCli('remove', 'snap1', 'work');
    expect(logs.some(l => l.includes('Removed tag'))).toBe(true);
  });

  test('list command with tag calls getSnapshotsByTag', () => {
    const { getSnapshotsByTag: gsbt } = require('../tag');
    gsbt.mockReturnValue(['snap1', 'snap2']);
    const { logs } = runCli('list', 'work');
    expect(logs.some(l => l.includes('snap1'))).toBe(true);
  });

  test('list command without tag calls listAllTags', () => {
    const { listAllTags: lat } = require('../tag');
    lat.mockReturnValue({ work: ['snap1'], personal: ['snap2'] });
    const { logs } = runCli('list');
    expect(logs.some(l => l.includes('work'))).toBe(true);
  });

  test('show command calls getTagsForSnapshot', () => {
    const { getTagsForSnapshot: gtfs } = require('../tag');
    gtfs.mockReturnValue(['work', 'stable']);
    const { logs } = runCli('show', 'snap1');
    expect(logs.some(l => l.includes('work'))).toBe(true);
  });
});
