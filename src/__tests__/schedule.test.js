const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('../snapshot', () => ({
  ensureSnapshotDir: jest.fn(),
  saveSnapshot: jest.fn().mockResolvedValue(undefined),
}));

const MOCK_SCHEDULE = path.join(os.tmpdir(), 'stacksnap-test-schedule.json');
jest.mock('os', () => ({ ...jest.requireActual('os'), homedir: () => require('os').tmpdir() }));

const { addSchedule, removeSchedule, loadSchedule, getDueSchedules, runDueSnapshots } = require('../schedule');

beforeEach(() => {
  if (fs.existsSync(MOCK_SCHEDULE)) fs.unlinkSync(MOCK_SCHEDULE);
  jest.clearAllMocks();
});

test('addSchedule adds a new entry', () => {
  const entry = addSchedule('myenv', 24);
  expect(entry.name).toBe('myenv');
  expect(entry.intervalHours).toBe(24);
  const all = loadSchedule();
  expect(all).toHaveLength(1);
});

test('addSchedule updates existing entry', () => {
  addSchedule('myenv', 24);
  addSchedule('myenv', 12);
  const all = loadSchedule();
  expect(all).toHaveLength(1);
  expect(all[0].intervalHours).toBe(12);
});

test('addSchedule throws on invalid name', () => {
  expect(() => addSchedule('', 24)).toThrow('Schedule name is required');
});

test('addSchedule throws on invalid interval', () => {
  expect(() => addSchedule('myenv', -1)).toThrow('Interval must be a positive number');
  expect(() => addSchedule('myenv', 'abc')).toThrow('Interval must be a positive number');
});

test('removeSchedule removes an entry', () => {
  addSchedule('myenv', 24);
  removeSchedule('myenv');
  expect(loadSchedule()).toHaveLength(0);
});

test('removeSchedule throws if not found', () => {
  expect(() => removeSchedule('ghost')).toThrow('No schedule found');
});

test('getDueSchedules returns entries with no lastRun', () => {
  addSchedule('myenv', 24);
  const due = getDueSchedules();
  expect(due).toHaveLength(1);
});

test('getDueSchedules skips recently run entries', () => {
  addSchedule('myenv', 24);
  const entries = loadSchedule();
  entries[0].lastRun = new Date().toISOString();
  const { saveSchedule } = require('../schedule');
  saveSchedule(entries);
  expect(getDueSchedules()).toHaveLength(0);
});

test('runDueSnapshots runs and updates lastRun', async () => {
  addSchedule('myenv', 24);
  const results = await runDueSnapshots();
  expect(results).toHaveLength(1);
  expect(results[0]).toMatch(/myenv-auto-/);
  const entries = loadSchedule();
  expect(entries[0].lastRun).not.toBeNull();
});
