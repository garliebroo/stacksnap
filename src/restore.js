const fs = require('fs');
const path = require('path');
const os = require('os');
const { loadSnapshot } = require('./snapshot');

function restoreSnapshot(name, options = {}) {
  const { dryRun = false, backup = true } = options;
  const snapshot = loadSnapshot(name);

  console.log(`[stacksnap] Restoring snapshot '${name}' (created ${snapshot.createdAt} on ${snapshot.machine})`);

  const results = { restored: [], skipped: [], backed_up: [] };

  for (const [label, entry] of Object.entries(snapshot.configs)) {
    const resolved = entry.path.replace('~', os.homedir());
    const dir = path.dirname(resolved);

    if (dryRun) {
      console.log(`[dry-run] Would restore '${label}' -> ${resolved}`);
      results.skipped.push(label);
      continue;
    }

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (backup && fs.existsSync(resolved)) {
      const backupPath = `${resolved}.stacksnap.bak`;
      fs.copyFileSync(resolved, backupPath);
      results.backed_up.push(backupPath);
      console.log(`[stacksnap] Backed up existing file to ${backupPath}`);
    }

    fs.writeFileSync(resolved, entry.content, 'utf8');
    console.log(`[stacksnap] Restored '${label}' -> ${resolved}`);
    results.restored.push(label);
  }

  return results;
}

module.exports = { restoreSnapshot };
