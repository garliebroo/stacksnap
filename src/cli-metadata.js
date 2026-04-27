#!/usr/bin/env node
const path = require('path');
const { setMetadata, getMetadata, removeMetadata, formatMetadata } = require('./snapshot-metadata');

const SNAPSHOT_DIR = path.join(process.env.HOME || '.', '.stacksnap', 'snapshots');

function printUsage() {
  console.log('Usage: stacksnap metadata <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  set <snapshot> <key> <value>   Set a metadata key on a snapshot');
  console.log('  get <snapshot>                 Show all metadata for a snapshot');
  console.log('  remove <snapshot>              Remove all metadata for a snapshot');
}

function run(argv = process.argv.slice(2)) {
  const [command, snapshotName, ...rest] = argv;

  if (!command || command === '--help' || command === '-h') {
    printUsage();
    return;
  }

  if (command === 'set') {
    const [key, value] = rest;
    if (!snapshotName || !key || value === undefined) {
      console.error('Usage: stacksnap metadata set <snapshot> <key> <value>');
      process.exitCode = 1;
      return;
    }
    const result = setMetadata(SNAPSHOT_DIR, snapshotName, key, value);
    console.log(`Metadata updated for "${snapshotName}":`);
    console.log(formatMetadata(result));
    return;
  }

  if (command === 'get') {
    if (!snapshotName) {
      console.error('Usage: stacksnap metadata get <snapshot>');
      process.exitCode = 1;
      return;
    }
    const meta = getMetadata(SNAPSHOT_DIR, snapshotName);
    if (!meta) {
      console.log(`No metadata found for "${snapshotName}".`);
      return;
    }
    console.log(`Metadata for "${snapshotName}":`);
    console.log(formatMetadata(meta));
    return;
  }

  if (command === 'remove') {
    if (!snapshotName) {
      console.error('Usage: stacksnap metadata remove <snapshot>');
      process.exitCode = 1;
      return;
    }
    const ok = removeMetadata(SNAPSHOT_DIR, snapshotName);
    if (ok) {
      console.log(`Metadata removed for "${snapshotName}".`);
    } else {
      console.log(`No metadata found for "${snapshotName}".`);
    }
    return;
  }

  console.error(`Unknown command: ${command}`);
  printUsage();
  process.exitCode = 1;
}

if (require.main === module) run();

module.exports = { printUsage, run };
