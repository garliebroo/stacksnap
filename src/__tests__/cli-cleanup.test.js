const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('../cleanup', () => ({
  cleanupSnapshots: jest.fn(),
  findStaleSnapshots: jest.fn(),
  formatCleanupResult: jest.fn(deleted =>
    deleted.length === 0 ? 'No snapshots removed.' : `Removed ${deleted.length} snapshot(s).`
  ),
}));

const { cleanupSnapshots, findStaleSnapshots, formatCleanupResult } = require('../cleanup');
const { run } = require('../cli-cleanup');

beforeEach(() => {
  jest.clearAllMocks();
  cleanupSnapshots.mockResolvedValue([]);
  findStaleSnapshots.mockResolvedValue([]);
});

async function runCli(args) {
  const logs = [];
  const errors = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a) => logs.push(a.join(' '));
  console.error = (...a) => errors.push(a.join(' '));
  const origExit = process.exit;
  let exitCode = null;
  process.exit = (code) => { exitCode = code; throw new Error(`exit:${code}`); };
  try {
    await run(args);
  } catch (e) {
    if (!e.message.startsWith('exit:')) throw e;
  } finally {
    console.log = origLog;
    console.error = origErr;
    process.exit = origExit;
  }
  return { logs, errors, exitCode };
}

test('prints usage with --help', async () => {
  const { logs } = await runCli(['--help']);
  expect(logs.some(l => l.includes('Usage'))).toBe(true);
});

test('calls cleanupSnapshots with defaults', async () => {
  cleanupSnapshots.mockResolvedValue([]);
  await runCli([]);
  expect(cleanupSnapshots).toHaveBeenCalledWith(expect.any(String), { olderThanDays: 30, keepCount: null });
});

test('passes --older-than option', async () => {
  await runCli(['--older-than', '60']);
  expect(cleanupSnapshots).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ olderThanDays: 60 }));
});

test('passes --keep option', async () => {
  await runCli(['--keep', '5']);
  expect(cleanupSnapshots).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ keepCount: 5 }));
});

test('dry-run uses findStaleSnapshots not cleanupSnapshots', async () => {
  findStaleSnapshots.mockResolvedValue([]);
  await runCli(['--dry-run']);
  expect(findStaleSnapshots).toHaveBeenCalled();
  expect(cleanupSnapshots).not.toHaveBeenCalled();
});

test('dry-run lists stale snapshots', async () => {
  findStaleSnapshots.mockResolvedValue([{ name: 'old-one' }, { name: 'old-two' }]);
  const { logs } = await runCli(['--dry-run']);
  expect(logs.some(l => l.includes('old-one'))).toBe(true);
});

test('invalid --older-than exits with error', async () => {
  const { exitCode } = await runCli(['--older-than', 'abc']);
  expect(exitCode).toBe(1);
});

test('outputs formatted result after cleanup', async () => {
  cleanupSnapshots.mockResolvedValue(['snap-x']);
  const { logs } = await runCli([]);
  expect(logs.some(l => l.includes('Removed'))).toBe(true);
});
