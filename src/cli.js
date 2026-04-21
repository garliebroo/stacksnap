#!/usr/bin/env node

/**
 * Main CLI entry point for stacksnap.
 * Dispatches subcommands to their respective handlers.
 */

const path = require('path');
const { saveSnapshot, loadSnapshot, listSnapshots } = require('./snapshot');
const { restoreSnapshot } = require('./restore');
const { diffSnapshotsByName, formatDiff } = require('./diff');

const args = process.argv.slice(2);
const command = args[0];

function printUsage() {
  console.log(`
stacksnap — snapshot and restore local dev environment configs

Usage:
  stacksnap snapshot [name]       Save a new snapshot (auto-names if omitted)
  stacksnap restore <name>        Restore a snapshot by name
  stacksnap list                  List all saved snapshots
  stacksnap diff <name1> <name2>  Diff two snapshots
  stacksnap export <name>         Export a snapshot to a zip file
  stacksnap tag <subcommand>      Manage snapshot tags
  stacksnap search <query>        Search snapshots by name or tag
  stacksnap schedule <subcommand> Manage scheduled snapshots
  stacksnap help                  Show this help message
`);
}

async function main() {
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printUsage();
    process.exit(0);
  }

  try {
    switch (command) {
      case 'snapshot': {
        const name = args[1] || `snapshot-${Date.now()}`;
        const snapshot = await saveSnapshot(name);
        console.log(`✓ Snapshot saved: ${snapshot.name}`);
        break;
      }

      case 'restore': {
        const name = args[1];
        if (!name) {
          console.error('Error: restore requires a snapshot name');
          console.error('Usage: stacksnap restore <name>');
          process.exit(1);
        }
        await restoreSnapshot(name);
        console.log(`✓ Snapshot restored: ${name}`);
        break;
      }

      case 'list': {
        const snapshots = await listSnapshots();
        if (snapshots.length === 0) {
          console.log('No snapshots found.');
        } else {
          console.log(`Found ${snapshots.length} snapshot(s):\n`);
          snapshots.forEach((s) => {
            const date = new Date(s.createdAt).toLocaleString();
            console.log(`  ${s.name.padEnd(40)} ${date}`);
          });
        }
        break;
      }

      case 'diff': {
        const [, name1, name2] = args;
        if (!name1 || !name2) {
          console.error('Error: diff requires two snapshot names');
          console.error('Usage: stacksnap diff <name1> <name2>');
          process.exit(1);
        }
        const diff = await diffSnapshotsByName(name1, name2);
        console.log(formatDiff(diff));
        break;
      }

      case 'export': {
        // Delegate to cli-export
        require('./cli-export');
        break;
      }

      case 'tag': {
        // Delegate to cli-tag
        require('./cli-tag');
        break;
      }

      case 'search': {
        // Delegate to cli-search
        require('./cli-search');
        break;
      }

      case 'schedule': {
        // Delegate to cli-schedule
        require('./cli-schedule');
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
