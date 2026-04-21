#!/usr/bin/env node
'use strict';

const path = require('path');
const { exportSnapshot, importSnapshot } = require('./export');

const [,, command, target, ...flags] = process.argv;
const overwrite = flags.includes('--overwrite');

async function run() {
  if (!command || !target) {
    console.error('Usage:');
    console.error('  stacksnap export <snapshot-name> [output-dir]');
    console.error('  stacksnap import <file.stacksnap> [--overwrite]');
    process.exit(1);
  }

  if (command === 'export') {
    const outputDir = flags.find(f => !f.startsWith('--')) || process.cwd();
    try {
      const outFile = await exportSnapshot(target, outputDir);
      console.log(`✓ Exported snapshot to ${outFile}`);
    } catch (err) {
      console.error(`✗ Export failed: ${err.message}`);
      process.exit(1);
    }
  } else if (command === 'import') {
    const archivePath = path.resolve(target);
    try {
      const name = await importSnapshot(archivePath, { overwrite });
      console.log(`✓ Imported snapshot "${name}"`);
      if (overwrite) {
        console.log('  (existing snapshot was overwritten)');
      }
    } catch (err) {
      console.error(`✗ Import failed: ${err.message}`);
      process.exit(1);
    }
  } else {
    console.error(`Unknown command: ${command}`);
    console.error('Expected "export" or "import"');
    process.exit(1);
  }
}

run();
