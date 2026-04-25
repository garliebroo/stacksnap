#!/usr/bin/env node
const path = require('path');
const { cleanupSnapshots, findStaleSnapshots, formatCleanupResult } = require('./cleanup');

const SNAPSHOT_DIR = path.join(process.env.HOME || '~', '.stacksnap', 'snapshots');

function printUsage() {
  console.log(`Usage: stacksnap cleanup [options]

Options:
  --older-than <days>   Remove snapshots older than N days (default: 30)
  --keep <count>        Always keep the N most recent snapshots
  --dry-run             Preview what would be removed without deleting
  --help                Show this help message
`);
}

async function run(argv = process.argv.slice(2)) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printUsage();
    return;
  }

  const dryRun = argv.includes('--dry-run');

  let olderThanDays = 30;
  const olderIdx = argv.indexOf('--older-than');
  if (olderIdx !== -1 && argv[olderIdx + 1]) {
    olderThanDays = parseInt(argv[olderIdx + 1], 10);
    if (isNaN(olderThanDays) || olderThanDays <= 0) {
      console.error('Error: --older-than must be a positive number');
      process.exit(1);
    }
  }

  let keepCount = null;
  const keepIdx = argv.indexOf('--keep');
  if (keepIdx !== -1 && argv[keepIdx + 1]) {
    keepCount = parseInt(argv[keepIdx + 1], 10);
    if (isNaN(keepCount) || keepCount < 0) {
      console.error('Error: --keep must be a non-negative number');
      process.exit(1);
    }
  }

  const options = { olderThanDays, keepCount };

  try {
    if (dryRun) {
      const stale = await findStaleSnapshots(SNAPSHOT_DIR, options);
      if (stale.length === 0) {
        console.log('Dry run: no snapshots would be removed.');
      } else {
        console.log(`Dry run: would remove ${stale.length} snapshot(s):`);
        stale.forEach(s => console.log(`  - ${s.name}`));
      }
    } else {
      const deleted = await cleanupSnapshots(SNAPSHOT_DIR, options);
      console.log(formatCleanupResult(deleted));
    }
  } catch (err) {
    console.error('Error during cleanup:', err.message);
    process.exit(1);
  }
}

if (require.main === module) run();

module.exports = { run, printUsage };
