const fs = require('fs');
const path = require('path');
const { ensureSnapshotDir, loadSnapshot, saveSnapshot, listSnapshots } = require('./snapshot');
const { loadTags, saveTags } = require('./tag');

async function renameSnapshot(oldName, newName) {
  if (!oldName || !newName) {
    throw new Error('Both old and new names are required');
  }

  if (oldName === newName) {
    throw new Error('New name must be different from the old name');
  }

  const snapshotDir = await ensureSnapshotDir();
  const oldPath = path.join(snapshotDir, `${oldName}.json`);
  const newPath = path.join(snapshotDir, `${newName}.json`);

  if (!fs.existsSync(oldPath)) {
    throw new Error(`Snapshot "${oldName}" not found`);
  }

  if (fs.existsSync(newPath)) {
    throw new Error(`Snapshot "${newName}" already exists`);
  }

  const snapshot = await loadSnapshot(oldName);
  snapshot.name = newName;
  snapshot.renamedFrom = oldName;
  snapshot.renamedAt = new Date().toISOString();

  await saveSnapshot(newName, snapshot);
  fs.unlinkSync(oldPath);

  await updateTagsAfterRename(oldName, newName);

  return { oldName, newName };
}

async function updateTagsAfterRename(oldName, newName) {
  try {
    const tags = await loadTags();
    let changed = false;

    for (const [tag, names] of Object.entries(tags)) {
      const idx = names.indexOf(oldName);
      if (idx !== -1) {
        names[idx] = newName;
        changed = true;
      }
    }

    if (changed) {
      await saveTags(tags);
    }
  } catch (err) {
    // tags file may not exist, that's fine
  }
}

module.exports = { renameSnapshot, updateTagsAfterRename };
