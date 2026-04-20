const fs = require('fs');
const path = require('path');
const { loadSnapshot } = require('./snapshot');

/**
 * Compare two snapshot objects and return a diff summary
 * @param {Object} snapshotA
 * @param {Object} snapshotB
 * @returns {Object} diff result
 */
function diffSnapshots(snapshotA, snapshotB) {
  const result = {
    added: [],
    removed: [],
    changed: [],
    unchanged: [],
  };

  const keysA = new Set(Object.keys(snapshotA.configs || {}));
  const keysB = new Set(Object.keys(snapshotB.configs || {}));

  for (const key of keysB) {
    if (!keysA.has(key)) {
      result.added.push({ file: key, content: snapshotB.configs[key] });
    }
  }

  for (const key of keysA) {
    if (!keysB.has(key)) {
      result.removed.push({ file: key, content: snapshotA.configs[key] });
    } else {
      const contentA = snapshotA.configs[key];
      const contentB = snapshotB.configs[key];
      if (contentA !== contentB) {
        result.changed.push({ file: key, from: contentA, to: contentB });
      } else {
        result.unchanged.push(key);
      }
    }
  }

  return result;
}

/**
 * Load two snapshots by name and diff them
 * @param {string} nameA
 * @param {string} nameB
 * @returns {Object}
 */
function diffSnapshotsByName(nameA, nameB) {
  const snapshotA = loadSnapshot(nameA);
  const snapshotB = loadSnapshot(nameB);

  if (!snapshotA) throw new Error(`Snapshot not found: ${nameA}`);
  if (!snapshotB) throw new Error(`Snapshot not found: ${nameB}`);

  return diffSnapshots(snapshotA, snapshotB);
}

/**
 * Format a diff result into a human-readable string
 * @param {Object} diff
 * @returns {string}
 */
function formatDiff(diff) {
  const lines = [];

  if (diff.added.length) {
    lines.push('Added:');
    diff.added.forEach(({ file }) => lines.push(`  + ${file}`));
  }

  if (diff.removed.length) {
    lines.push('Removed:');
    diff.removed.forEach(({ file }) => lines.push(`  - ${file}`));
  }

  if (diff.changed.length) {
    lines.push('Changed:');
    diff.changed.forEach(({ file }) => lines.push(`  ~ ${file}`));
  }

  if (!diff.added.length && !diff.removed.length && !diff.changed.length) {
    lines.push('No differences found.');
  }

  return lines.join('\n');
}

module.exports = { diffSnapshots, diffSnapshotsByName, formatDiff };
