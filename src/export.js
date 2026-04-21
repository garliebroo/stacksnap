const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { loadSnapshot } = require('./snapshot');

/**
 * Export a snapshot to a portable .stacksnap archive file
 */
async function exportSnapshot(snapshotName, outputDir = process.cwd()) {
  const snapshot = await loadSnapshot(snapshotName);
  if (!snapshot) {
    throw new Error(`Snapshot "${snapshotName}" not found`);
  }

  const outputFile = path.join(outputDir, `${snapshotName}.stacksnap`);
  const output = fs.createWriteStream(outputFile);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => resolve(outputFile));
    archive.on('error', reject);

    archive.pipe(output);
    archive.append(JSON.stringify(snapshot, null, 2), { name: 'snapshot.json' });
    archive.finalize();
  });
}

/**
 * Import a snapshot from a .stacksnap archive file
 */
async function importSnapshot(archivePath, { overwrite = false } = {}) {
  if (!fs.existsSync(archivePath)) {
    throw new Error(`Archive not found: ${archivePath}`);
  }

  const StreamZip = require('node-stream-zip');
  const zip = new StreamZip.async({ file: archivePath });

  let snapshotData;
  try {
    const data = await zip.entryData('snapshot.json');
    snapshotData = JSON.parse(data.toString('utf8'));
  } finally {
    await zip.close();
  }

  if (!snapshotData || !snapshotData.name) {
    throw new Error('Invalid .stacksnap archive: missing snapshot metadata');
  }

  const { ensureSnapshotDir } = require('./snapshot');
  const snapshotDir = await ensureSnapshotDir();
  const destPath = path.join(snapshotDir, `${snapshotData.name}.json`);

  if (fs.existsSync(destPath) && !overwrite) {
    throw new Error(`Snapshot "${snapshotData.name}" already exists. Use --overwrite to replace it.`);
  }

  fs.writeFileSync(destPath, JSON.stringify(snapshotData, null, 2));
  return snapshotData.name;
}

module.exports = { exportSnapshot, importSnapshot };
