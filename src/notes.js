const fs = require('fs');
const path = require('path');
const { ensureSnapshotDir } = require('./snapshot');

function getNotesFilePath() {
  const dir = ensureSnapshotDir();
  return path.join(dir, 'notes.json');
}

function loadNotes() {
  const filePath = getNotesFilePath();
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

function saveNotes(notes) {
  const filePath = getNotesFilePath();
  fs.writeFileSync(filePath, JSON.stringify(notes, null, 2));
}

function addNote(snapshotName, note) {
  if (!snapshotName || !note) throw new Error('Snapshot name and note are required');
  const notes = loadNotes();
  if (!notes[snapshotName]) notes[snapshotName] = [];
  const entry = { text: note, createdAt: new Date().toISOString() };
  notes[snapshotName].push(entry);
  saveNotes(notes);
  return entry;
}

function removeNote(snapshotName, index) {
  const notes = loadNotes();
  if (!notes[snapshotName] || !notes[snapshotName][index]) {
    throw new Error(`No note at index ${index} for snapshot "${snapshotName}"`);
  }
  const removed = notes[snapshotName].splice(index, 1)[0];
  if (notes[snapshotName].length === 0) delete notes[snapshotName];
  saveNotes(notes);
  return removed;
}

function getNotesForSnapshot(snapshotName) {
  const notes = loadNotes();
  return notes[snapshotName] || [];
}

function formatNotes(snapshotName, notes) {
  if (!notes.length) return `No notes for snapshot "${snapshotName}".`;
  return [
    `Notes for "${snapshotName}":`,
    ...notes.map((n, i) => `  [${i}] ${n.text}  (${n.createdAt})`)
  ].join('\n');
}

module.exports = {
  getNotesFilePath,
  loadNotes,
  saveNotes,
  addNote,
  removeNote,
  getNotesForSnapshot,
  formatNotes
};
