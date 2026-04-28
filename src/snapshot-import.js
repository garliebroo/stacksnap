const fs = require('fs');
const path = require('path');
const { ensureSnapshotDir, saveSnapshot } = require('./snapshot');

function validateImportFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Import file not found: ${filePath}`);
  }
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.json') {
    throw new Error(`Unsupported file format: ${ext}. Only .json is supported.`);
  }
}

function parseImportFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Failed to parse import file: ${e.message}`);
  }
  return data;
}

function normalizeImportData(data, overrideName) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid snapshot format: expected an object.');
  }
  const name = overrideName || data.name || `imported-${Date.now()}`;
  const configs = data.configs || data;
  return { name, configs, importedAt: new Date().toISOString() };
}

async function importSnapshot(filePath, options = {}) {
  const { name: overrideName, snapshotDir } = options;
  validateImportFile(filePath);
  const raw = parseImportFile(filePath);
  const { name, configs, importedAt } = normalizeImportData(raw, overrideName);
  await ensureSnapshotDir(snapshotDir);
  const snapshot = { name, configs, importedAt, createdAt: new Date().toISOString() };
  await saveSnapshot(snapshot, snapshotDir);
  return snapshot;
}

function formatImportResult(snapshot) {
  return `Imported snapshot "${snapshot.name}" with ${Object.keys(snapshot.configs || {}).length} config(s).`;
}

module.exports = { validateImportFile, parseImportFile, normalizeImportData, importSnapshot, formatImportResult };
