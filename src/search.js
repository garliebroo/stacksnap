const { listSnapshots, loadSnapshot } = require('./snapshot');

/**
 * Search snapshots by metadata: name, tags, or config keys present.
 */
async function searchSnapshots(query = {}, snapshotDir) {
  const { name, tag, configKey, before, after } = query;
  const names = await listSnapshots(snapshotDir);

  const results = [];

  for (const snapshotName of names) {
    const snapshot = await loadSnapshot(snapshotName, snapshotDir);
    if (!snapshot) continue;

    if (name && !snapshotName.toLowerCase().includes(name.toLowerCase())) {
      continue;
    }

    if (tag) {
      const tags = snapshot.tags || [];
      if (!tags.includes(tag)) continue;
    }

    if (configKey) {
      const configs = snapshot.configs || {};
      if (!Object.keys(configs).some(k => k.toLowerCase().includes(configKey.toLowerCase()))) {
        continue;
      }
    }

    const createdAt = snapshot.createdAt ? new Date(snapshot.createdAt) : null;

    if (after && createdAt && createdAt < new Date(after)) continue;
    if (before && createdAt && createdAt > new Date(before)) continue;

    results.push({ name: snapshotName, snapshot });
  }

  return results;
}

/**
 * Format search results for display.
 */
function formatSearchResults(results) {
  if (results.length === 0) {
    return 'No snapshots matched your query.';
  }

  return results
    .map(({ name, snapshot }) => {
      const date = snapshot.createdAt
        ? new Date(snapshot.createdAt).toLocaleString()
        : 'unknown date';
      const tags = (snapshot.tags || []).length
        ? `  tags: ${snapshot.tags.join(', ')}`
        : '';
      const keys = Object.keys(snapshot.configs || {}).join(', ') || 'none';
      return `• ${name} (${date})\n  configs: ${keys}${tags ? '\n' + tags : ''}`;
    })
    .join('\n\n');
}

module.exports = { searchSnapshots, formatSearchResults };
