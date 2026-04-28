#!/usr/bin/env node
const path = require('path');
const { importSnapshot, formatImportResult } = require('./snapshot-import');

function printUsage() {
  console.log('Usage: stacksnap import <file.json> [--name <snapshot-name>]');
  console.log('');
  console.log('Options:');
  console.log('  --name   Override the snapshot name from the import file');
  console.log('  --help   Show this help message');
}

async function run(args = process.argv.slice(2)) {
  if (args.includes('--help') || args.length === 0) {
    printUsage();
    return;
  }

  const filePath = args[0];
  if (!filePath || filePath.startsWith('--')) {
    console.error('Error: please provide a file path to import.');
    printUsage();
    process.exitCode = 1;
    return;
  }

  const nameIdx = args.indexOf('--name');
  const name = nameIdx !== -1 ? args[nameIdx + 1] : undefined;

  if (nameIdx !== -1 && !name) {
    console.error('Error: --name requires a value.');
    process.exitCode = 1;
    return;
  }

  try {
    const snapshot = await importSnapshot(path.resolve(filePath), { name });
    console.log(formatImportResult(snapshot));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  run();
}

module.exports = { run, printUsage };
