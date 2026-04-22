const path = require('path');
const fs = require('fs');
const os = require('os');

let tmpDir;

jest.mock('../snapshot', () => ({
  ensureSnapshotDir: () => tmpDir
}));

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-cli-notes-'));
  jest.resetModules();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function runCli(args) {
  const logs = [];
  const errors = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a) => logs.push(a.join(' '));
  console.error = (...a) => errors.push(a.join(' '));
  const { main } = require('../cli-notes');
  let exitCode = 0;
  const origExit = process.exit;
  process.exit = (code) => { exitCode = code; throw new Error('process.exit'); };
  try {
    main(args);
  } catch (e) {
    if (!e.message.includes('process.exit')) throw e;
  } finally {
    console.log = origLog;
    console.error = origErr;
    process.exit = origExit;
  }
  return { logs, errors, exitCode };
}

test('prints usage with no args', () => {
  const { logs } = runCli([]);
  expect(logs.join('\n')).toMatch(/Usage/);
});

test('add note outputs confirmation', () => {
  const { logs } = runCli(['add', 'snap1', 'my', 'note', 'text']);
  expect(logs[0]).toMatch('my note text');
  expect(logs[0]).toMatch('snap1');
});

test('list shows notes after adding', () => {
  runCli(['add', 'snap2', 'hello']);
  const { logs } = runCli(['list', 'snap2']);
  expect(logs.join('\n')).toMatch('hello');
});

test('remove deletes a note', () => {
  runCli(['add', 'snap3', 'removable']);
  const { logs } = runCli(['remove', 'snap3', '0']);
  expect(logs[0]).toMatch('Removed');
  const { logs: listLogs } = runCli(['list', 'snap3']);
  expect(listLogs.join('\n')).toMatch(/No notes/);
});

test('remove with bad index exits with error', () => {
  runCli(['add', 'snap4', 'keep']);
  const { errors, exitCode } = runCli(['remove', 'snap4', '99']);
  expect(exitCode).toBe(1);
  expect(errors[0]).toMatch('Error');
});

test('unknown command exits with error', () => {
  const { errors, exitCode } = runCli(['frobnicate']);
  expect(exitCode).toBe(1);
  expect(errors[0]).toMatch('Unknown command');
});

test('add with missing note exits with error', () => {
  const { errors, exitCode } = runCli(['add', 'snap5']);
  expect(exitCode).toBe(1);
  expect(errors[0]).toMatch('required');
});
