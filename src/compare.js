const { loadSnapshot } = require('./snapshot');

/**
 * Compare two snapshots and return a structured result
 * @param {string} nameA - First snapshot name
 * @param {string} nameB - Second snapshot name
 * @returns {object} Comparison result with matches, added, removed, changed
 */
async function compareSnapshots(nameA, nameB) {
  const snapA = await loadSnapshot(nameA);
  const snapB = await loadSnapshot(nameB);

  if (!snapA) throw new Error(`Snapshot not found: ${nameA}`);
  if (!snapB) throw new Error(`Snapshot not found: ${nameB}`);

  const configsA = snapA.configs || {};
  const configsB = snapB.configs || {};

  const keysA = new Set(Object.keys(configsA));
  const keysB = new Set(Object.keys(configsB));

  const added = [...keysB].filter(k => !keysA.has(k));
  const removed = [...keysA].filter(k => !keysB.has(k));
  const common = [...keysA].filter(k => keysB.has(k));

  const changed = [];
  const matches = [];

  for (const key of common) {
    if (JSON.stringify(configsA[key]) !== JSON.stringify(configsB[key])) {
      changed.push({
        key,
        from: configsA[key],
        to: configsB[key],
      });
    } else {
      matches.push(key);
    }
  }

  return {
    snapshotA: { name: nameA, createdAt: snapA.createdAt },
    snapshotB: { name: nameB, createdAt: snapB.createdAt },
    summary: {
      total: keysA.size + added.length,
      matches: matches.length,
      added: added.length,
      removed: removed.length,
      changed: changed.length,
    },
    details: { matches, added, removed, changed },
  };
}

/**
 * Format a comparison result for terminal output
 * @param {object} result - Result from compareSnapshots
 * @returns {string} Formatted string
 */
function formatComparison(result) {
  const { snapshotA, snapshotB, summary, details } = result;
  const lines = [];

  lines.push(`Comparing: ${snapshotA.name} → ${snapshotB.name}`);
  lines.push(`  ${snapshotA.name} created: ${snapshotA.createdAt}`);
  lines.push(`  ${snapshotB.name} created: ${snapshotB.createdAt}`);
  lines.push('');
  lines.push(`Summary: ${summary.matches} match, ${summary.added} added, ${summary.removed} removed, ${summary.changed} changed`);

  if (details.added.length) {
    lines.push('\nAdded configs:');
    details.added.forEach(k => lines.push(`  + ${k}`));
  }

  if (details.removed.length) {
    lines.push('\nRemoved configs:');
    details.removed.forEach(k => lines.push(`  - ${k}`));
  }

  if (details.changed.length) {
    lines.push('\nChanged configs:');
    details.changed.forEach(({ key }) => lines.push(`  ~ ${key}`));
  }

  return lines.join('\n');
}

module.exports = { compareSnapshots, formatComparison };
