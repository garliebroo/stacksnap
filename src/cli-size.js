#!/usr/bin/env node
const path = require('path');
const { getSizeReport, formatSizeReport } = require('./snapshot-size');

const DEFAULT_SNAPSHOTS_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.stacksnap', 'snapshots');

function printUsage() {
  console.log('Usage: stacksnap size [--dir <path>] [--json]');
  console.log('');
  console.log('Options:');
  console.log('  --dir <path>   Path to snapshots directory (default: ~/.stacksnap/snapshots)');
  console.log('  --json         Output raw JSON report');
  console.log('  --help         Show this help message');
}

function run(argv = process.argv.slice(2)) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printUsage();
    return;
  }

  let snapshotsDir = DEFAULT_SNAPSHOTS_DIR;
  let jsonOutput = false;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dir' && argv[i + 1]) {
      snapshotsDir = argv[i + 1];
      i++;
    } else if (argv[i] === '--json') {
      jsonOutput = true;
    }
  }

  let report;
  try {
    report = getSizeReport(snapshotsDir);
  } catch (err) {
    console.error(`Error reading snapshots: ${err.message}`);
    process.exit(1);
  }

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatSizeReport(report));
  }
}

if (require.main === module) {
  run();
}

module.exports = { run, printUsage };
