const fs = require('fs');
const path = require('path');
const { listSnapshots, loadSnapshot } = require('./snapshot');

const HISTORY_FILE = 'history.json';

function getHistoryFilePath(snapshotDir) {
  return path.join(snapshotDir, HISTORY_FILE);
}

function loadHistory(snapshotDir) {
  const filePath = getHistoryFilePath(snapshotDir);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

function saveHistory(snapshotDir, history) {
  const filePath = getHistoryFilePath(snapshotDir);
  fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
}

function recordEvent(snapshotDir, snapshotName, action) {
  const history = loadHistory(snapshotDir);
  history.push({
    snapshotName,
    action,
    timestamp: new Date().toISOString()
  });
  saveHistory(snapshotDir, history);
  return history;
}

function getSnapshotHistory(snapshotDir, snapshotName) {
  const history = loadHistory(snapshotDir);
  return history.filter(entry => entry.snapshotName === snapshotName);
}

function clearHistory(snapshotDir, snapshotName) {
  const history = loadHistory(snapshotDir);
  const updated = snapshotName
    ? history.filter(e => e.snapshotName !== snapshotName)
    : [];
  saveHistory(snapshotDir, updated);
  return updated;
}

function formatHistory(entries) {
  if (!entries || entries.length === 0) return 'No history found.';
  return entries
    .map(e => `[${e.timestamp}] ${e.action.toUpperCase()} — ${e.snapshotName}`)
    .join('\n');
}

module.exports = {
  getHistoryFilePath,
  loadHistory,
  saveHistory,
  recordEvent,
  getSnapshotHistory,
  clearHistory,
  formatHistory
};
