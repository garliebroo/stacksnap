const fs = require('fs');
const path = require('path');
const os = require('os');

let tmpDir;

function runCli(args) {
  const logs = [];
  const errors = [];
  const origLog = console.log;
  const origErr = console.error;
  const origExit = process.exitCode;
  console.log = (...a) => logs.push(a.join(' '));
  console.error = (...a) => errors.push(a.join(' '));
  process.exitCode = 0;

  const { run } = require('../cli-import');
  return run(args).then(() => {
    console.log = origLog;
    console.error = origErr;
    const code = process.exitCode;
    process.exitCode = origExit;
    return { logs, errors, code };
  });
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-cli-import-'));
  jest.resetModules();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('prints usage with --help', async () => {
  const { logs } = await runCli(['--help']);
  expect(logs.some(l => l.includes('Usage'))).toBe(true);
});

test('prints usage with no args', async () => {
  const { logs } = await runCli([]);
  expect(logs.some(l => l.includes('Usage'))).toBe(true);
});

test('errors when no file path given', async () => {
  const { errors, code } = await runCli(['--name', 'foo']);
  expect(errors.some(e => e.includes('please provide a file path'))).toBe(true);
  expect(code).toBe(1);
});

test('errors when --name has no value', async () => {
  const f = path.join(tmpDir, 'snap.json');
  fs.writeFileSync(f, JSON.stringify({ name: 'x', configs: {} }));
  const { errors, code } = await runCli([f, '--name']);
  expect(errors.some(e => e.includes('--name requires a value'))).toBe(true);
  expect(code).toBe(1);
});

test('errors on nonexistent file', async () => {
  const { errors, code } = await runCli(['/no/such/file.json']);
  expect(errors.some(e => e.includes('Error:'))).toBe(true);
  expect(code).toBe(1);
});

test('imports a valid snapshot file', async () => {
  const f = path.join(tmpDir, 'snap.json');
  const data = { name: 'mysnap', configs: { '.nvmrc': '18', '.npmrc': 'registry=https://registry.npmjs.org' } };
  fs.writeFileSync(f, JSON.stringify(data));

  jest.mock('../snapshot', () => ({
    ensureSnapshotDir: jest.fn().mockResolvedValue(undefined),
    saveSnapshot: jest.fn().mockResolvedValue(undefined),
  }));

  const { logs, code } = await runCli([f]);
  expect(logs.some(l => l.includes('Imported snapshot'))).toBe(true);
  expect(code).toBe(0);
});
