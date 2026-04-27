const fs = require('fs');
const os = require('os');
const path = require('path');

let tmpDir;

function runCli(argv) {
  jest.resetModules();
  process.exitCode = 0;
  const originalHome = process.env.HOME;
  process.env.HOME = tmpDir;
  const { run } = require('../cli-metadata');
  const logs = [];
  const errors = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a) => logs.push(a.join(' '));
  console.error = (...a) => errors.push(a.join(' '));
  run(argv);
  console.log = origLog;
  console.error = origErr;
  process.env.HOME = originalHome;
  return { logs, errors };
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-cli-meta-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('prints usage with no args', () => {
  const { logs } = runCli([]);
  expect(logs.some(l => l.includes('Usage'))).toBe(true);
});

test('set stores metadata and prints it', () => {
  const { logs } = runCli(['set', 'mysnap', 'author', 'alice']);
  expect(logs.some(l => l.includes('author: alice'))).toBe(true);
});

test('get shows metadata after set', () => {
  runCli(['set', 'mysnap', 'env', 'dev']);
  const { logs } = runCli(['get', 'mysnap']);
  expect(logs.some(l => l.includes('env: dev'))).toBe(true);
});

test('get prints no metadata message for unknown snapshot', () => {
  const { logs } = runCli(['get', 'ghost']);
  expect(logs.some(l => l.includes('No metadata found'))).toBe(true);
});

test('remove deletes metadata', () => {
  runCli(['set', 'mysnap', 'author', 'bob']);
  const { logs } = runCli(['remove', 'mysnap']);
  expect(logs.some(l => l.includes('removed'))).toBe(true);
});

test('remove prints message for unknown snapshot', () => {
  const { logs } = runCli(['remove', 'nobody']);
  expect(logs.some(l => l.includes('No metadata found'))).toBe(true);
});

test('set without key/value sets exitCode 1', () => {
  runCli(['set', 'mysnap']);
  expect(process.exitCode).toBe(1);
});

test('unknown command sets exitCode 1', () => {
  runCli(['bogus']);
  expect(process.exitCode).toBe(1);
});
