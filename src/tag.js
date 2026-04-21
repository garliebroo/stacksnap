const fs = require('fs');
const path = require('path');
const { ensureSnapshotDir, loadSnapshot, saveSnapshot } = require('./snapshot');

const TAGS_FILE = 'tags.json';

function getTagsFilePath() {
  const dir = ensureSnapshotDir();
  return path.join(dir, TAGS_FILE);
}

function loadTags() {
  const tagsFile = getTagsFilePath();
  if (!fs.existsSync(tagsFile)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(tagsFile, 'utf8'));
  } catch {
    return {};
  }
}

function saveTags(tags) {
  const tagsFile = getTagsFilePath();
  fs.writeFileSync(tagsFile, JSON.stringify(tags, null, 2));
}

function tagSnapshot(snapshotName, tag) {
  const snapshot = loadSnapshot(snapshotName);
  if (!snapshot) {
    throw new Error(`Snapshot "${snapshotName}" not found`);
  }

  const tags = loadTags();
  if (!tags[tag]) {
    tags[tag] = [];
  }

  if (!tags[tag].includes(snapshotName)) {
    tags[tag].push(snapshotName);
  }

  saveTags(tags);
  return tags[tag];
}

function removeTag(snapshotName, tag) {
  const tags = loadTags();
  if (!tags[tag]) return false;

  const index = tags[tag].indexOf(snapshotName);
  if (index === -1) return false;

  tags[tag].splice(index, 1);
  if (tags[tag].length === 0) {
    delete tags[tag];
  }

  saveTags(tags);
  return true;
}

function getSnapshotsByTag(tag) {
  const tags = loadTags();
  return tags[tag] || [];
}

function getTagsForSnapshot(snapshotName) {
  const tags = loadTags();
  return Object.entries(tags)
    .filter(([, snapshots]) => snapshots.includes(snapshotName))
    .map(([tag]) => tag);
}

function listAllTags() {
  return loadTags();
}

module.exports = {
  tagSnapshot,
  removeTag,
  getSnapshotsByTag,
  getTagsForSnapshot,
  listAllTags,
};
