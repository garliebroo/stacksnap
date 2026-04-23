const fs = require('fs');
const path = require('path');
const { ensureSnapshotDir } = require('./snapshot');

const PINS_FILE = 'pins.json';

function getPinsFilePath() {
  const snapshotDir = ensureSnapshotDir();
  return path.join(snapshotDir, PINS_FILE);
}

function loadPins() {
  const filePath = getPinsFilePath();
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

function savePins(pins) {
  const filePath = getPinsFilePath();
  fs.writeFileSync(filePath, JSON.stringify(pins, null, 2));
}

function pinSnapshot(snapshotName, label = null) {
  const pins = loadPins();
  if (pins[snapshotName]) {
    throw new Error(`Snapshot "${snapshotName}" is already pinned.`);
  }
  pins[snapshotName] = {
    pinnedAt: new Date().toISOString(),
    label: label || null
  };
  savePins(pins);
  return pins[snapshotName];
}

function unpinSnapshot(snapshotName) {
  const pins = loadPins();
  if (!pins[snapshotName]) {
    throw new Error(`Snapshot "${snapshotName}" is not pinned.`);
  }
  delete pins[snapshotName];
  savePins(pins);
}

function isPinned(snapshotName) {
  const pins = loadPins();
  return Boolean(pins[snapshotName]);
}

function listPinned() {
  const pins = loadPins();
  return Object.entries(pins).map(([name, info]) => ({ name, ...info }));
}

module.exports = {
  getPinsFilePath,
  loadPins,
  savePins,
  pinSnapshot,
  unpinSnapshot,
  isPinned,
  listPinned
};
