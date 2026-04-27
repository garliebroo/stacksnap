const fs = require('fs');
const path = require('path');
const { ensureSnapshotDir } = require('./snapshot');

function getGroupsFilePath(snapshotDir) {
  return path.join(snapshotDir, 'groups.json');
}

function loadGroups(snapshotDir) {
  const filePath = getGroupsFilePath(snapshotDir);
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

function saveGroups(snapshotDir, groups) {
  const filePath = getGroupsFilePath(snapshotDir);
  fs.writeFileSync(filePath, JSON.stringify(groups, null, 2));
}

function createGroup(snapshotDir, groupName) {
  const groups = loadGroups(snapshotDir);
  if (groups[groupName]) {
    throw new Error(`Group "${groupName}" already exists`);
  }
  groups[groupName] = [];
  saveGroups(snapshotDir, groups);
  return groups[groupName];
}

function addToGroup(snapshotDir, groupName, snapshotName) {
  const groups = loadGroups(snapshotDir);
  if (!groups[groupName]) {
    groups[groupName] = [];
  }
  if (groups[groupName].includes(snapshotName)) {
    throw new Error(`Snapshot "${snapshotName}" is already in group "${groupName}"`);
  }
  groups[groupName].push(snapshotName);
  saveGroups(snapshotDir, groups);
  return groups[groupName];
}

function removeFromGroup(snapshotDir, groupName, snapshotName) {
  const groups = loadGroups(snapshotDir);
  if (!groups[groupName]) {
    throw new Error(`Group "${groupName}" does not exist`);
  }
  const idx = groups[groupName].indexOf(snapshotName);
  if (idx === -1) {
    throw new Error(`Snapshot "${snapshotName}" not found in group "${groupName}"`);
  }
  groups[groupName].splice(idx, 1);
  saveGroups(snapshotDir, groups);
  return groups[groupName];
}

function deleteGroup(snapshotDir, groupName) {
  const groups = loadGroups(snapshotDir);
  if (!groups[groupName]) {
    throw new Error(`Group "${groupName}" does not exist`);
  }
  delete groups[groupName];
  saveGroups(snapshotDir, groups);
}

function getGroup(snapshotDir, groupName) {
  const groups = loadGroups(snapshotDir);
  return groups[groupName] || null;
}

function listGroups(snapshotDir) {
  const groups = loadGroups(snapshotDir);
  return Object.entries(groups).map(([name, snapshots]) => ({ name, snapshots }));
}

module.exports = {
  getGroupsFilePath,
  loadGroups,
  saveGroups,
  createGroup,
  addToGroup,
  removeFromGroup,
  deleteGroup,
  getGroup,
  listGroups,
};
