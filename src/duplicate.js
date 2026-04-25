const fs = require('fs');
const path = require('path');
const { loadSnapshot, saveSnapshot, listSnapshots } = require('./snapshot');

/**
 * Duplicate an existing snapshot under a new name.
 * @param {string} sourceName - Name of the snapshot to duplicate
 * @param {string} targetName - Name for the new duplicate snapshot
 * @param {string} snapshotDir - Directory where snapshots are stored
 * @returns {{ success: boolean, message: string }}
 */
async function duplicateSnapshot(sourceName, targetName, snapshotDir) {
  if (!sourceName || !targetName) {
    return { success: false, message: 'Source and target names are required.' };
  }

  if (sourceName === targetName) {
    return { success: false, message: 'Source and target names must be different.' };
  }

  const existing = await listSnapshots(snapshotDir);

  if (!existing.includes(sourceName)) {
    return { success: false, message: `Snapshot "${sourceName}" not found.` };
  }

  if (existing.includes(targetName)) {
    return { success: false, message: `Snapshot "${targetName}" already exists.` };
  }

  const sourceData = await loadSnapshot(sourceName, snapshotDir);

  if (!sourceData) {
    return { success: false, message: `Failed to load snapshot "${sourceName}".` };
  }

  const duplicated = {
    ...sourceData,
    name: targetName,
    createdAt: new Date().toISOString(),
    duplicatedFrom: sourceName,
  };

  await saveSnapshot(targetName, duplicated, snapshotDir);

  return { success: true, message: `Snapshot "${sourceName}" duplicated as "${targetName}".` };
}

module.exports = { duplicateSnapshot };
