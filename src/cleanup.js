const fs = require('fs');
const path = require('path');
const { listSnapshots } = require('./snapshot');
const { loadPins } = require('./pin');

function getSnapshotAge(snapshot) {
  const ts = snapshot.timestamp || snapshot.createdAt;
  if (!ts) return Infinity;
  return Date.now() - new Date(ts).getTime();
}

function msFromDays(days) {
  return days * 24 * 60 * 60 * 1000;
}

async function findStaleSnapshots(snapshotDir, options = {}) {
  const { olderThanDays = 30, keepCount = null } = options;
  const snapshots = await listSnapshots(snapshotDir);
  const pins = await loadPins(snapshotDir);
  const pinnedNames = new Set(pins.map(p => p.name));

  const candidates = snapshots.filter(s => !pinnedNames.has(s.name));

  let stale = candidates.filter(
    s => getSnapshotAge(s) > msFromDays(olderThanDays)
  );

  if (keepCount !== null) {
    const sorted = [...candidates].sort(
      (a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt)
    );
    const toKeep = new Set(sorted.slice(0, keepCount).map(s => s.name));
    stale = stale.filter(s => !toKeep.has(s.name));
  }

  return stale;
}

async function deleteSnapshot(snapshotDir, name) {
  const filePath = path.join(snapshotDir, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Snapshot "${name}" not found`);
  }
  fs.unlinkSync(filePath);
  return name;
}

async function cleanupSnapshots(snapshotDir, options = {}) {
  const stale = await findStaleSnapshots(snapshotDir, options);
  const deleted = [];
  for (const snapshot of stale) {
    await deleteSnapshot(snapshotDir, snapshot.name);
    deleted.push(snapshot.name);
  }
  return deleted;
}

function formatCleanupResult(deleted) {
  if (deleted.length === 0) return 'No snapshots removed.';
  return `Removed ${deleted.length} snapshot(s):\n` +
    deleted.map(n => `  - ${n}`).join('\n');
}

module.exports = { findStaleSnapshots, deleteSnapshot, cleanupSnapshots, formatCleanupResult };
