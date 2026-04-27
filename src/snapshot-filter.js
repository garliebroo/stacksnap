const { listSnapshots, loadSnapshot } = require('./snapshot');

/**
 * Filter snapshots by various criteria
 */
async function filterSnapshots(snapshotDir, criteria = {}) {
  const names = await listSnapshots(snapshotDir);
  const results = [];

  for (const name of names) {
    const snapshot = await loadSnapshot(snapshotDir, name);
    if (!snapshot) continue;

    if (criteria.before && new Date(snapshot.timestamp) >= new Date(criteria.before)) continue;
    if (criteria.after && new Date(snapshot.timestamp) <= new Date(criteria.after)) continue;

    if (criteria.hasConfig) {
      const keys = Object.keys(snapshot.configs || {});
      if (!keys.includes(criteria.hasConfig)) continue;
    }

    if (criteria.nameContains) {
      if (!name.toLowerCase().includes(criteria.nameContains.toLowerCase())) continue;
    }

    if (criteria.minConfigs !== undefined) {
      const count = Object.keys(snapshot.configs || {}).length;
      if (count < criteria.minConfigs) continue;
    }

    if (criteria.maxConfigs !== undefined) {
      const count = Object.keys(snapshot.configs || {}).length;
      if (count > criteria.maxConfigs) continue;
    }

    results.push({ name, snapshot });
  }

  return results;
}

function formatFilterResults(results) {
  if (results.length === 0) return 'No snapshots matched the filter criteria.';

  const lines = [`Found ${results.length} matching snapshot(s):`, ''];
  for (const { name, snapshot } of results) {
    const ts = snapshot.timestamp ? new Date(snapshot.timestamp).toLocaleString() : 'unknown';
    const configCount = Object.keys(snapshot.configs || {}).length;
    lines.push(`  ${name}`);
    lines.push(`    Created: ${ts}`);
    lines.push(`    Configs: ${configCount}`);
  }
  return lines.join('\n');
}

module.exports = { filterSnapshots, formatFilterResults };
