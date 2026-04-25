const fs = require('fs');
const path = require('path');
const { ensureSnapshotDir } = require('./snapshot');

function getLockFilePath(snapshotDir) {
  return path.join(snapshotDir, 'locks.json');
}

function loadLocks(snapshotDir) {
  const lockFile = getLockFilePath(snapshotDir);
  if (!fs.existsSync(lockFile)) return {};
  try {
    return JSON.parse(fs.readFileSync(lockFile, 'utf8'));
  } catch {
    return {};
  }
}

function saveLocks(snapshotDir, locks) {
  ensureSnapshotDir(snapshotDir);
  fs.writeFileSync(getLockFilePath(snapshotDir), JSON.stringify(locks, null, 2));
}

function lockSnapshot(snapshotDir, snapshotName, reason = '') {
  const locks = loadLocks(snapshotDir);
  if (locks[snapshotName]) {
    return { success: false, message: `Snapshot "${snapshotName}" is already locked.` };
  }
  locks[snapshotName] = { lockedAt: new Date().toISOString(), reason };
  saveLocks(snapshotDir, locks);
  return { success: true, message: `Snapshot "${snapshotName}" locked.` };
}

function unlockSnapshot(snapshotDir, snapshotName) {
  const locks = loadLocks(snapshotDir);
  if (!locks[snapshotName]) {
    return { success: false, message: `Snapshot "${snapshotName}" is not locked.` };
  }
  delete locks[snapshotName];
  saveLocks(snapshotDir, locks);
  return { success: true, message: `Snapshot "${snapshotName}" unlocked.` };
}

function isLocked(snapshotDir, snapshotName) {
  const locks = loadLocks(snapshotDir);
  return !!locks[snapshotName];
}

function getLockInfo(snapshotDir, snapshotName) {
  const locks = loadLocks(snapshotDir);
  return locks[snapshotName] || null;
}

function listLocked(snapshotDir) {
  return loadLocks(snapshotDir);
}

module.exports = {
  getLockFilePath,
  loadLocks,
  saveLocks,
  lockSnapshot,
  unlockSnapshot,
  isLocked,
  getLockInfo,
  listLocked,
};
