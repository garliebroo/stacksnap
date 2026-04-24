#!/usr/bin/env node
const path = require('path');
const { validateSnapshot, formatValidationResult } = require('./validate');
const { listSnapshots } = require('./snapshot');

const DEFAULT_SNAPSHOT_DIR = path.join(require('os').homedir(), '.stacksnap', 'snapshots');

function printUsage() {
  console.log('Usage: stacksnap validate <snapshot-name|--all>');
  console.log('');
  console.log('Options:');
  console.log('  <snapshot-name>   Validate a specific snapshot');
  console.log('  --all             Validate all snapshots');
  console.log('  --help            Show this help message');
}

async function validateOne(name, snapshotDir) {
  const result = await validateSnapshot(name, snapshotDir);
  console.log(formatValidationResult(result, name));
  return result.valid;
}

async function main(argv = process.argv.slice(2), snapshotDir = DEFAULT_SNAPSHOT_DIR) {
  if (argv.length === 0 || argv.includes('--help')) {
    printUsage();
    return;
  }

  if (argv[0] === '--all') {
    let snapshots;
    try {
      snapshots = await listSnapshots(snapshotDir);
    } catch (err) {
      console.error('Failed to list snapshots:', err.message);
      process.exitCode = 1;
      return;
    }

    if (snapshots.length === 0) {
      console.log('No snapshots found.');
      return;
    }

    let allValid = true;
    for (const snap of snapshots) {
      const valid = await validateOne(snap.name, snapshotDir);
      if (!valid) allValid = false;
    }

    if (!allValid) process.exitCode = 1;
    return;
  }

  const name = argv[0];
  const valid = await validateOne(name, snapshotDir);
  if (!valid) process.exitCode = 1;
}

if (require.main === module) {
  main().catch(err => {
    console.error('Unexpected error:', err.message);
    process.exitCode = 1;
  });
}

module.exports = { main, printUsage };
