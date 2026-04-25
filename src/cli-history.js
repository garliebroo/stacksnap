#!/usr/bin/env node
const path = require('path');
const { loadHistory, getSnapshotHistory, clearHistory, formatHistory } = require('./history');

const SNAPSHOT_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.stacksnap');

function printUsage() {
  console.log(`
Usage: stacksnap history <command> [options]

Commands:
  list [--snapshot <name>]   List history events, optionally filtered by snapshot
  clear [--snapshot <name>]  Clear history, optionally for a specific snapshot

Options:
  --snapshot <name>   Target a specific snapshot by name
  --help              Show this help message
`.trim());
}

function run(argv) {
  const args = argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    printUsage();
    return;
  }

  const command = args[0];
  const snapshotIndex = args.indexOf('--snapshot');
  const snapshotName = snapshotIndex !== -1 ? args[snapshotIndex + 1] : null;

  if (command === 'list') {
    const entries = snapshotName
      ? getSnapshotHistory(SNAPSHOT_DIR, snapshotName)
      : loadHistory(SNAPSHOT_DIR);
    console.log(formatHistory(entries));
    return;
  }

  if (command === 'clear') {
    const updated = clearHistory(SNAPSHOT_DIR, snapshotName || undefined);
    if (snapshotName) {
      console.log(`Cleared history for snapshot "${snapshotName}".`);
    } else {
      console.log('All history cleared.');
    }
    return;
  }

  console.error(`Unknown command: ${command}`);
  printUsage();
  process.exit(1);
}

if (require.main === module) {
  run(process.argv);
}

module.exports = { run, printUsage };
