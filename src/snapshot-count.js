const fs = require('fs');
const path = require('path');
const { listSnapshots } = require('./snapshot');

/**
 * Count total snapshots in the snapshot directory
 */
async function countSnapshots(snapshotDir) {
  const snapshots = await listSnapshots(snapshotDir);
  return snapshots.length;
}

/**
 * Count snapshots grouped by date (YYYY-MM-DD)
 */
async function countByDate(snapshotDir) {
  const snapshots = await listSnapshots(snapshotDir);
  const counts = {};

  for (const snap of snapshots) {
    const date = new Date(snap.createdAt);
    const key = date.toISOString().slice(0, 10);
    counts[key] = (counts[key] || 0) + 1;
  }

  return counts;
}

/**
 * Count snapshots created within the last N days
 */
async function countRecent(snapshotDir, days = 7) {
  const snapshots = await listSnapshots(snapshotDir);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  return snapshots.filter(snap => {
    const ts = new Date(snap.createdAt).getTime();
    return ts >= cutoff;
  }).length;
}

/**
 * Format a summary report of snapshot counts
 */
async function formatCountReport(snapshotDir) {
  const total = await countSnapshots(snapshotDir);
  const recent = await countRecent(snapshotDir, 7);
  const byDate = await countByDate(snapshotDir);

  const lines = [
    `Total snapshots: ${total}`,
    `Created in last 7 days: ${recent}`,
    '',
    'Snapshots per day:',
  ];

  const sortedDates = Object.keys(byDate).sort().reverse();
  if (sortedDates.length === 0) {
    lines.push('  (none)');
  } else {
    for (const date of sortedDates) {
      lines.push(`  ${date}: ${byDate[date]}`);
    }
  }

  return lines.join('\n');
}

module.exports = { countSnapshots, countByDate, countRecent, formatCountReport };
