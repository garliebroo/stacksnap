const fs = require('fs');
const path = require('path');
const { loadSnapshot, saveSnapshot } = require('./snapshot');

/**
 * Merge two snapshots into a new one.
 * Keys from snapshotB override keys from snapshotA on conflict.
 */
async function mergeSnapshots(nameA, nameB, outputName, options = {}) {
  const snapA = await loadSnapshot(nameA);
  const snapB = await loadSnapshot(nameB);

  if (!snapA) throw new Error(`Snapshot not found: ${nameA}`);
  if (!snapB) throw new Error(`Snapshot not found: ${nameB}`);

  const { strategy = 'overwrite' } = options;

  const mergedConfigs = mergeConfigs(snapA.configs, snapB.configs, strategy);

  const merged = {
    name: outputName,
    createdAt: new Date().toISOString(),
    mergedFrom: [nameA, nameB],
    strategy,
    configs: mergedConfigs,
  };

  await saveSnapshot(outputName, merged);
  return merged;
}

function mergeConfigs(configsA, configsB, strategy) {
  const result = { ...configsA };

  for (const [key, valueB] of Object.entries(configsB)) {
    if (!(key in result)) {
      result[key] = valueB;
    } else if (strategy === 'overwrite') {
      result[key] = valueB;
    } else if (strategy === 'keep') {
      // keep A's value, do nothing
    } else if (strategy === 'combine') {
      result[key] = combineValues(result[key], valueB);
    }
  }

  return result;
}

function combineValues(a, b) {
  if (typeof a === 'string' && typeof b === 'string') {
    const linesA = a.split('\n');
    const linesB = b.split('\n');
    const combined = Array.from(new Set([...linesA, ...linesB]));
    return combined.join('\n');
  }
  // fallback: B wins
  return b;
}

function formatMergeResult(merged) {
  const lines = [
    `Merged snapshot: ${merged.name}`,
    `Sources: ${merged.mergedFrom.join(' + ')}`,
    `Strategy: ${merged.strategy}`,
    `Configs merged: ${Object.keys(merged.configs).length}`,
    `Created: ${merged.createdAt}`,
  ];
  return lines.join('\n');
}

module.exports = { mergeSnapshots, mergeConfigs, combineValues, formatMergeResult };
