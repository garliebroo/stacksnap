const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('../snapshot', () => ({
  ensureSnapshotDir: () => tmpDir
}));

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-notes-'));
  jest.resetModules();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function getNotes() {
  return require('../notes');
}

test('loadNotes returns empty object when no file exists', () => {
  const { loadNotes } = getNotes();
  expect(loadNotes()).toEqual({});
});

test('addNote creates a note for a snapshot', () => {
  const { addNote, getNotesForSnapshot } = getNotes();
  addNote('my-snap', 'initial node setup');
  const notes = getNotesForSnapshot('my-snap');
  expect(notes).toHaveLength(1);
  expect(notes[0].text).toBe('initial node setup');
  expect(notes[0].createdAt).toBeDefined();
});

test('addNote appends multiple notes', () => {
  const { addNote, getNotesForSnapshot } = getNotes();
  addNote('snap1', 'first note');
  addNote('snap1', 'second note');
  expect(getNotesForSnapshot('snap1')).toHaveLength(2);
});

test('addNote throws if name or note missing', () => {
  const { addNote } = getNotes();
  expect(() => addNote('', 'note')).toThrow();
  expect(() => addNote('snap', '')).toThrow();
});

test('removeNote deletes a note by index', () => {
  const { addNote, removeNote, getNotesForSnapshot } = getNotes();
  addNote('snap2', 'to remove');
  addNote('snap2', 'to keep');
  removeNote('snap2', 0);
  const notes = getNotesForSnapshot('snap2');
  expect(notes).toHaveLength(1);
  expect(notes[0].text).toBe('to keep');
});

test('removeNote cleans up snapshot key when empty', () => {
  const { addNote, removeNote, loadNotes } = getNotes();
  addNote('snap3', 'only note');
  removeNote('snap3', 0);
  expect(loadNotes()['snap3']).toBeUndefined();
});

test('removeNote throws on invalid index', () => {
  const { addNote, removeNote } = getNotes();
  addNote('snap4', 'a note');
  expect(() => removeNote('snap4', 5)).toThrow();
});

test('formatNotes returns message when no notes', () => {
  const { formatNotes } = getNotes();
  expect(formatNotes('empty-snap', [])).toMatch(/No notes/);
});

test('formatNotes lists notes with index and date', () => {
  const { addNote, getNotesForSnapshot, formatNotes } = getNotes();
  addNote('snap5', 'hello world');
  const notes = getNotesForSnapshot('snap5');
  const output = formatNotes('snap5', notes);
  expect(output).toMatch('[0]');
  expect(output).toMatch('hello world');
});
