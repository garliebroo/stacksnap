const path = require('path');
const fs = require('fs');
const os = require('os');

let tmpDir;

function runCli(args) {
  const original = process.env.HOME;
  process.env.HOME = tmpDir;
  // Patch SNAPSHOT_DIR inside the module by re-requiring with env set
  jest.resetModules();
  const { run } = require('../cli-lock');
  const logs = [];
  const errors = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a) => logs.push(a.join(' '));
  console.error = (...a) => errors.push(a.join(' '));
  process.exitCode = 0;
  run(args);
  console.log = origLog;
  console.error = origErr;
  process.env.HOME = original;
  return { logs, errors, exitCode: process.exitCode };
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-cli-lock-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  jest.resetModules();
});

test('prints usage with no args', () => {
  const { logs } = runCli([]);
  expect(logs.some(l => l.includes('Usage'))).toBe(true);
});

test('lock command locks a snapshot', () => {
  const { logs } = runCli(['lock', 'mysnap', 'important']);
  expect(logs[0]).toMatch(/locked/);
});

test('lock command fails without name', () => {
  const { errors, exitCode } = runCli(['lock']);
  expect(errors[0]).toMatch(/name required/);
  expect(exitCode).toBe(1);
});

test('unlock command unlocks a snapshot', () => {
  runCli(['lock', 'mysnap']);
  const { logs } = runCli(['unlock', 'mysnap']);
  expect(logs[0]).toMatch(/unlocked/);
});

test('unlock command fails for unlocked snapshot', () => {
  const { exitCode } = runCli(['unlock', 'ghost']);
  expect(exitCode).toBe(1);
});

test('list shows locked snapshots', () => {
  runCli(['lock', 'snap1']);
  runCli(['lock', 'snap2']);
  const { logs } = runCli(['list']);
  expect(logs.some(l => l.includes('snap1'))).toBe(true);
  expect(logs.some(l => l.includes('snap2'))).toBe(true);
});

test('list shows message when none locked', () => {
  const { logs } = runCli(['list']);
  expect(logs[0]).toMatch(/No locked/);
});

test('info shows lock details', () => {
  runCli(['lock', 'snap1', 'keep this']);
  const { logs } = runCli(['info', 'snap1']);
  expect(logs.some(l => l.includes('keep this'))).toBe(true);
});

test('unknown command sets exit code 1', () => {
  const { exitCode } = runCli(['frobnicate']);
  expect(exitCode).toBe(1);
});
