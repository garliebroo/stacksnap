const fs = require('fs');
const path = require('path');
const { listSnapshots, loadSnapshot } = require('./snapshot');

const ARCHIVE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.stacksnap', 'archive');

function getArchiveDir() {
  return ARCHIVE_DIR;
}

function ensureArchiveDir() {
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }
}

function archiveSnapshot(snapshotName) {
  const snapshot = loadSnapshot(snapshotName);
  if (!snapshot) {
    throw new Error(`Snapshot "${snapshotName}" not found`);
  }

  ensureArchiveDir();

  const archivePath = path.join(ARCHIVE_DIR, `${snapshotName}.json`);
  if (fs.existsSync(archivePath)) {
    throw new Error(`Snapshot "${snapshotName}" is already archived`);
  }

  fs.writeFileSync(archivePath, JSON.stringify({ ...snapshot, archivedAt: new Date().toISOString() }, null, 2));
  return archivePath;
}

function unarchiveSnapshot(snapshotName) {
  const archivePath = path.join(ARCHIVE_DIR, `${snapshotName}.json`);
  if (!fs.existsSync(archivePath)) {
    throw new Error(`No archived snapshot found for "${snapshotName}"`);
  }

  const data = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
  delete data.archivedAt;
  fs.unlinkSync(archivePath);
  return data;
}

function listArchived() {
  ensureArchiveDir();
  return fs.readdirSync(ARCHIVE_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const name = f.replace('.json', '');
      const data = JSON.parse(fs.readFileSync(path.join(ARCHIVE_DIR, f), 'utf8'));
      return { name, archivedAt: data.archivedAt };
    });
}

function isArchived(snapshotName) {
  return fs.existsSync(path.join(ARCHIVE_DIR, `${snapshotName}.json`));
}

module.exports = { getArchiveDir, archiveSnapshot, unarchiveSnapshot, listArchived, isArchived };
