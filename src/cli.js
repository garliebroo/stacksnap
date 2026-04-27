#!/usr/bin/env node
const { saveSnapshot, loadSnapshot, listSnapshots } = require('./snapshot');
const { restoreSnapshot } = require('./restore');
const { diffSnapshotsByName } = require('./diff');
const path = require('path');

const SNAPSHOT_DIR = path.join(process.env.HOME || '.', '.stacksnap', 'snapshots');

function printUsage() {
  console.log('Usage: stacksnap <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  save <name>              Save current environment as a snapshot');
  console.log('  restore <name>           Restore a snapshot');
  console.log('  list                     List all snapshots');
  console.log('  diff <snap1> <snap2>     Diff two snapshots');
  console.log('  export                   Export snapshots (see cli-export)');
  console.log('  tag                      Manage tags (see cli-tag)');
  console.log('  search                   Search snapshots (see cli-search)');
  console.log('  schedule                 Manage schedules (see cli-schedule)');
  console.log('  compare                  Compare snapshots (see cli-compare)');
  console.log('  rename                   Rename a snapshot (see cli-rename)');
  console.log('  notes                    Manage notes (see cli-notes)');
  console.log('  pin                      Pin/unpin snapshots (see cli-pin)');
  console.log('  archive                  Archive snapshots (see cli-archive)');
  console.log('  validate                 Validate snapshots (see cli-validate)');
  console.log('  merge                    Merge snapshots (see cli-merge)');
  console.log('  history                  View snapshot history (see cli-history)');
  console.log('  cleanup                  Clean up old snapshots (see cli-cleanup)');
  console.log('  duplicate                Duplicate a snapshot (see cli-duplicate)');
  console.log('  size                     Show snapshot sizes (see cli-size)');
  console.log('  filter                   Filter snapshots (see cli-filter)');
  console.log('  metadata                 Manage snapshot metadata (see cli-metadata)');
  console.log('  lock                     Lock/unlock snapshots (see cli-lock)');
}

function run(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv;

  if (!command || command === '--help' || command === '-h') {
    printUsage();
    return;
  }

  if (command === 'save') {
    const [name] = rest;
    if (!name) { console.error('Snapshot name required.'); process.exitCode = 1; return; }
    saveSnapshot(SNAPSHOT_DIR, name);
    console.log(`Snapshot "${name}" saved.`);
    return;
  }

  if (command === 'restore') {
    const [name] = rest;
    if (!name) { console.error('Snapshot name required.'); process.exitCode = 1; return; }
    restoreSnapshot(SNAPSHOT_DIR, name);
    console.log(`Snapshot "${name}" restored.`);
    return;
  }

  if (command === 'list') {
    const snaps = listSnapshots(SNAPSHOT_DIR);
    if (!snaps.length) { console.log('No snapshots found.'); return; }
    snaps.forEach(s => console.log(` - ${s}`));
    return;
  }

  if (command === 'diff') {
    const [a, b] = rest;
    if (!a || !b) { console.error('Two snapshot names required.'); process.exitCode = 1; return; }
    const result = diffSnapshotsByName(SNAPSHOT_DIR, a, b);
    const { formatDiff } = require('./diff');
    console.log(formatDiff(result));
    return;
  }

  const subClis = {
    export: './cli-export', tag: './cli-tag', search: './cli-search',
    schedule: './cli-schedule', compare: './cli-compare', rename: './cli-rename',
    notes: './cli-notes', pin: './cli-pin', archive: './cli-archive',
    validate: './cli-validate', merge: './cli-merge', history: './cli-history',
    cleanup: './cli-cleanup', duplicate: './cli-duplicate', size: './cli-size',
    filter: './cli-filter', metadata: './cli-metadata', lock: './cli-lock',
  };

  if (subClis[command]) {
    const sub = require(subClis[command]);
    if (typeof sub.run === 'function') { sub.run(rest); return; }
  }

  console.error(`Unknown command: ${command}`);
  printUsage();
  process.exitCode = 1;
}

if (require.main === module) run();

module.exports = { printUsage, run };
