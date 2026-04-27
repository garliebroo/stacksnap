const fs = require('fs');
const path = require('path');
const { ensureSnapshotDir } = require('./snapshot');

function getMetadataFilePath(snapshotDir) {
  return path.join(snapshotDir, 'metadata.json');
}

function loadMetadata(snapshotDir) {
  const filePath = getMetadataFilePath(snapshotDir);
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

function saveMetadata(snapshotDir, metadata) {
  ensureSnapshotDir(snapshotDir);
  fs.writeFileSync(getMetadataFilePath(snapshotDir), JSON.stringify(metadata, null, 2));
}

function setMetadata(snapshotDir, snapshotName, key, value) {
  const metadata = loadMetadata(snapshotDir);
  if (!metadata[snapshotName]) metadata[snapshotName] = {};
  metadata[snapshotName][key] = value;
  metadata[snapshotName].updatedAt = new Date().toISOString();
  saveMetadata(snapshotDir, metadata);
  return metadata[snapshotName];
}

function getMetadata(snapshotDir, snapshotName) {
  const metadata = loadMetadata(snapshotDir);
  return metadata[snapshotName] || null;
}

function removeMetadata(snapshotDir, snapshotName) {
  const metadata = loadMetadata(snapshotDir);
  if (!metadata[snapshotName]) return false;
  delete metadata[snapshotName];
  saveMetadata(snapshotDir, metadata);
  return true;
}

function formatMetadata(entry) {
  if (!entry) return '(no metadata)';
  const lines = Object.entries(entry)
    .filter(([k]) => k !== 'updatedAt')
    .map(([k, v]) => `  ${k}: ${v}`);
  if (entry.updatedAt) lines.push(`  updatedAt: ${entry.updatedAt}`);
  return lines.join('\n');
}

module.exports = {
  getMetadataFilePath,
  loadMetadata,
  saveMetadata,
  setMetadata,
  getMetadata,
  removeMetadata,
  formatMetadata,
};
