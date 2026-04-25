const path = require('path');
const fs = require('fs');
const os = require('os');

let tmpDir;

function runCli(args, snapshotDir) {
  jest.resetModules();
  jest.doMock('../history', () => require('../history'));

  const originalEnv = process.env.HOME;
  process.env.HOME = snapshotDir;

  const { run } = require('../cli-history');
  const logs = [];
  const errors = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a) => logs.push(a.join(' '));
  console.error = (...a) => errors.push(a.join(' '));

  let exitCode = 0;
  const origExit = process.exit;
  process.exit = (code) => { exitCode = code; throw new Error('process.exit'); };

  try {
    run(['node', 'cli-history.js', ...args]);
  } catch (e) {
    if (!e.message.includes('process.exit')) throw e;
  } finally {
    console.log = origLog;
    console.error = origErr;
    process.exit = origExit;
    process.env.HOME = originalEnv;
  }

  return { logs, errors, exitCode };
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-cli-history-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('shows usage when no args', () => {
  const { logs } = runCli([], tmpDir);
  expect(logs.join(' ')).toContain('Usage');
});

test('shows usage with --help', () => {
  const { logs } = runCli(['--help'], tmpDir);
  expect(logs.join(' ')).toContain('Usage');
});

test('list shows no history message when empty', () => {
  const { logs } = runCli(['list'], tmpDir);
  expect(logs.join(' ')).toContain('No history found');
});

test('list with --snapshot filters results', () => {
  const { recordEvent } = require('../history');
  recordEvent(tmpDir, 'mysnap', 'create');
  recordEvent(tmpDir, 'other', 'create');
  const { logs } = runCli(['list', '--snapshot', 'mysnap'], tmpDir);
  expect(logs.join(' ')).toContain('mysnap');
});

test('clear removes all history', () => {
  const { recordEvent, loadHistory } = require('../history');
  recordEvent(tmpDir, 'snap1', 'create');
  runCli(['clear'], tmpDir);
  expect(loadHistory(tmpDir)).toHaveLength(0);
});

test('clear with --snapshot removes only that snapshot', () => {
  const { recordEvent, loadHistory } = require('../history');
  recordEvent(tmpDir, 'snap1', 'create');
  recordEvent(tmpDir, 'snap2', 'create');
  runCli(['clear', '--snapshot', 'snap1'], tmpDir);
  const remaining = loadHistory(tmpDir);
  expect(remaining.find(e => e.snapshotName === 'snap1')).toBeUndefined();
  expect(remaining.find(e => e.snapshotName === 'snap2')).toBeDefined();
});

test('unknown command exits with error', () => {
  const { errors, exitCode } = runCli(['bogus'], tmpDir);
  expect(errors.join(' ')).toContain('Unknown command');
  expect(exitCode).toBe(1);
});
