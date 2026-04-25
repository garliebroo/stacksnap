const fs = require('fs');
const path = require('path');
const { listSnapshots, loadSnapshot } = require('./snapshot');

function getSnapshotSize(snapshot) {
  const raw = JSON.stringify(snapshot);
  return Buffer.byteLength(raw, 'utf8');
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getSizeReport(snapshotsDir) {
  const names = listSnapshots(snapshotsDir);
  if (names.length === 0) {
    return { snapshots: [], total: 0, totalFormatted: '0 B' };
  }

  const snapshots = names.map((name) => {
    const snapshot = loadSnapshot(snapshotsDir, name);
    const bytes = getSnapshotSize(snapshot);
    return { name, bytes, formatted: formatBytes(bytes) };
  });

  const total = snapshots.reduce((sum, s) => sum + s.bytes, 0);

  return {
    snapshots,
    total,
    totalFormatted: formatBytes(total),
  };
}

function formatSizeReport(report) {
  if (report.snapshots.length === 0) {
    return 'No snapshots found.';
  }

  const lines = ['Snapshot sizes:'];
  const sorted = [...report.snapshots].sort((a, b) => b.bytes - a.bytes);
  for (const s of sorted) {
    lines.push(`  ${s.name.padEnd(30)} ${s.formatted}`);
  }
  lines.push('');
  lines.push(`Total: ${report.totalFormatted} across ${report.snapshots.length} snapshot(s)`);
  return lines.join('\n');
}

module.exports = { getSnapshotSize, formatBytes, getSizeReport, formatSizeReport };
