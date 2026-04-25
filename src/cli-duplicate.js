#!/usr/bin/env node
const path = require('path');
const { duplicateSnapshot } = require('./duplicate');
const { ensureSnapshotDir } = require('./snapshot');

const DEFAULT_SNAPSHOT_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.stacksnap', 'snapshots');

function printUsage() {
  console.log('Usage: stacksnap duplicate <source> <target>');
  console.log('');
  console.log('  Duplicate an existing snapshot under a new name.');
  console.log('');
  console.log('Arguments:');
  console.log('  source   Name of the snapshot to duplicate');
  console.log('  target   Name for the new duplicate snapshot');
  console.log('');
  console.log('Example:');
  console.log('  stacksnap duplicate my-setup my-setup-backup');
}

async function run(argv, snapshotDir) {
  const dir = snapshotDir || DEFAULT_SNAPSHOT_DIR;
  const [source, target] = argv;

  if (!source || !target || source === '--help' || source === '-h') {
    printUsage();
    return;
  }

  await ensureSnapshotDir(dir);

  const result = await duplicateSnapshot(source, target, dir);

  if (result.success) {
    console.log(`✔ ${result.message}`);
  } else {
    console.error(`✖ ${result.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  run(process.argv.slice(2)).catch((err) => {
    console.error('Unexpected error:', err.message);
    process.exit(1);
  });
}

module.exports = { run, printUsage };
