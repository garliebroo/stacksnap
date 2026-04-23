#!/usr/bin/env node
const { pinSnapshot, unpinSnapshot, listPinned, isPinned } = require('./pin');

function printUsage() {
  console.log(`
Usage: stacksnap pin <command> [options]

Commands:
  add <snapshot> [label]   Pin a snapshot, optionally with a label
  remove <snapshot>        Unpin a snapshot
  list                     List all pinned snapshots
  check <snapshot>         Check if a snapshot is pinned

Examples:
  stacksnap pin add my-snap "stable env"
  stacksnap pin remove my-snap
  stacksnap pin list
  stacksnap pin check my-snap
`);
}

async function main(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;

  if (!command || command === '--help' || command === '-h') {
    printUsage();
    return;
  }

  try {
    if (command === 'add') {
      const [snapshotName, label] = args;
      if (!snapshotName) {
        console.error('Error: snapshot name is required.');
        process.exit(1);
      }
      const result = pinSnapshot(snapshotName, label || null);
      console.log(`Pinned "${snapshotName}" at ${result.pinnedAt}${result.label ? ` (${result.label})` : ''}`);
    } else if (command === 'remove') {
      const [snapshotName] = args;
      if (!snapshotName) {
        console.error('Error: snapshot name is required.');
        process.exit(1);
      }
      unpinSnapshot(snapshotName);
      console.log(`Unpinned "${snapshotName}".`);
    } else if (command === 'list') {
      const pins = listPinned();
      if (pins.length === 0) {
        console.log('No pinned snapshots.');
      } else {
        pins.forEach(p => {
          const labelStr = p.label ? ` — ${p.label}` : '';
          console.log(`  ${p.name}${labelStr}  (pinned ${p.pinnedAt})`);
        });
      }
    } else if (command === 'check') {
      const [snapshotName] = args;
      if (!snapshotName) {
        console.error('Error: snapshot name is required.');
        process.exit(1);
      }
      const pinned = isPinned(snapshotName);
      console.log(`"${snapshotName}" is ${pinned ? 'pinned' : 'not pinned'}.`);
    } else {
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { main, printUsage };

if (require.main === module) {
  main();
}
