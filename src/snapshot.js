const fs = require('fs');
const path = require('path');
const os = require('os');

const SNAPSHOT_DIR = path.join(os.homedir(), '.stacksnap');

function ensureSnapshotDir() {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
}

function collectConfigs(targets) {
  const snapshot = {
    createdAt: new Date().toISOString(),
    machine: os.hostname(),
    configs: {}
  };

  for (const [label, filePath] of Object.entries(targets)) {
    const resolved = filePath.replace('~', os.homedir());
    if (fs.existsSync(resolved)) {
      snapshot.configs[label] = {
        path: filePath,
        content: fs.readFileSync(resolved, 'utf8')
      };
    } else {
      console.warn(`[stacksnap] Skipping '${label}': file not found at ${resolved}`);
    }
  }

  return snapshot;
}

function saveSnapshot(name, targets) {
  ensureSnapshotDir();
  const snapshot = collectConfigs(targets);
  const outPath = path.join(SNAPSHOT_DIR, `${name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2));
  console.log(`[stacksnap] Snapshot '${name}' saved to ${outPath}`);
  return outPath;
}

function loadSnapshot(name) {
  const snapshotPath = path.join(SNAPSHOT_DIR, `${name}.json`);
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`Snapshot '${name}' not found at ${snapshotPath}`);
  }
  return JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
}

function listSnapshots() {
  ensureSnapshotDir();
  return fs.readdirSync(SNAPSHOT_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
}

/**
 * Deletes a snapshot by name. Throws if the snapshot doesn't exist.
 */
function deleteSnapshot(name) {
  const snapshotPath = path.join(SNAPSHOT_DIR, `${name}.json`);
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`Snapshot '${name}' not found at ${snapshotPath}`);
  }
  fs.unlinkSync(snapshotPath);
  console.log(`[stacksnap] Snapshot '${name}' deleted.`);
}

module.exports = { saveSnapshot, loadSnapshot, listSnapshots, deleteSnapshot, SNAPSHOT_DIR };
