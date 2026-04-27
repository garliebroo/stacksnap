const path = require('path');
const fs = require('fs');
const os = require('os');

let tmpDir;
let mockSetAlias, mockRemoveAlias, mockListAliases, mockFormatAliasList;

function runCli(args) {
  const logs = [];
  const errors = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a) => logs.push(a.join(' '));
  console.error = (...a) => errors.push(a.join(' '));
  const prevCode = process.exitCode;
  process.exitCode = 0;
  try {
    jest.isolateModules(() => {
      jest.doMock('../snapshot-alias', () => ({
        setAlias: mockSetAlias,
        removeAlias: mockRemoveAlias,
        listAliases: mockListAliases,
        formatAliasList: mockFormatAliasList,
      }));
      const { run } = require('../cli-alias');
      run(args);
    });
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
  return { logs, errors, exitCode: process.exitCode };
}

beforeEach(() => {
  mockSetAlias = jest.fn();
  mockRemoveAlias = jest.fn();
  mockListAliases = jest.fn().mockReturnValue({});
  mockFormatAliasList = jest.fn().mockReturnValue('No aliases defined.');
});

test('prints usage when no args', () => {
  const { logs } = runCli([]);
  expect(logs.some(l => l.includes('Usage'))).toBe(true);
});

test('set alias calls setAlias and logs confirmation', () => {
  const { logs, exitCode } = runCli(['set', 'prod', 'snap-prod']);
  expect(mockSetAlias).toHaveBeenCalledWith('prod', 'snap-prod');
  expect(logs.some(l => l.includes('prod') && l.includes('snap-prod'))).toBe(true);
  expect(exitCode).toBe(0);
});

test('set alias without args prints error', () => {
  const { errors, exitCode } = runCli(['set', 'prod']);
  expect(errors.some(e => e.includes('requires'))).toBe(true);
  expect(exitCode).toBe(1);
});

test('set alias propagates error from setAlias', () => {
  mockSetAlias.mockImplementation(() => { throw new Error('bad alias'); });
  const { errors, exitCode } = runCli(['set', 'x', 'y']);
  expect(errors.some(e => e.includes('bad alias'))).toBe(true);
  expect(exitCode).toBe(1);
});

test('remove alias calls removeAlias', () => {
  const { logs, exitCode } = runCli(['remove', 'prod']);
  expect(mockRemoveAlias).toHaveBeenCalledWith('prod');
  expect(logs.some(l => l.includes('prod'))).toBe(true);
  expect(exitCode).toBe(0);
});

test('remove without alias arg prints error', () => {
  const { errors, exitCode } = runCli(['remove']);
  expect(errors.some(e => e.includes('requires'))).toBe(true);
  expect(exitCode).toBe(1);
});

test('remove propagates error', () => {
  mockRemoveAlias.mockImplementation(() => { throw new Error('not found'); });
  const { errors, exitCode } = runCli(['remove', 'ghost']);
  expect(errors.some(e => e.includes('not found'))).toBe(true);
  expect(exitCode).toBe(1);
});

test('list calls listAliases and formatAliasList', () => {
  mockListAliases.mockReturnValue({ dev: 'snap-dev' });
  mockFormatAliasList.mockReturnValue('  dev -> snap-dev');
  const { logs } = runCli(['list']);
  expect(mockListAliases).toHaveBeenCalled();
  expect(logs.some(l => l.includes('dev -> snap-dev'))).toBe(true);
});

test('unknown subcommand sets exit code 1', () => {
  const { errors, exitCode } = runCli(['oops']);
  expect(errors.some(e => e.includes('Unknown subcommand'))).toBe(true);
  expect(exitCode).toBe(1);
});
