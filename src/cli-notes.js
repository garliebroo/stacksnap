#!/usr/bin/env node
const { addNote, removeNote, getNotesForSnapshot, formatNotes } = require('./notes');

function printUsage() {
  console.log(`
Usage: stacksnap notes <command> [options]

Commands:
  add <snapshot> <note>    Add a note to a snapshot
  remove <snapshot> <idx>  Remove note by index from a snapshot
  list <snapshot>          List all notes for a snapshot

Examples:
  stacksnap notes add my-snap "fresh macOS setup"
  stacksnap notes list my-snap
  stacksnap notes remove my-snap 0
  `.trim());
}

async function main(argv) {
  const [command, snapshotName, ...rest] = argv;

  if (!command || command === '--help' || command === '-h') {
    printUsage();
    return;
  }

  if (command === 'add') {
    if (!snapshotName || !rest[0]) {
      console.error('Error: snapshot name and note text are required.');
      process.exit(1);
    }
    const noteText = rest.join(' ');
    const entry = addNote(snapshotName, noteText);
    console.log(`Note added to "${snapshotName}": ${entry.text}`);
    return;
  }

  if (command === 'remove') {
    const idx = parseInt(rest[0], 10);
    if (!snapshotName || isNaN(idx)) {
      console.error('Error: snapshot name and numeric index are required.');
      process.exit(1);
    }
    try {
      const removed = removeNote(snapshotName, idx);
      console.log(`Removed note [${idx}] from "${snapshotName}": ${removed.text}`);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
    return;
  }

  if (command === 'list') {
    if (!snapshotName) {
      console.error('Error: snapshot name is required.');
      process.exit(1);
    }
    const notes = getNotesForSnapshot(snapshotName);
    console.log(formatNotes(snapshotName, notes));
    return;
  }

  console.error(`Unknown command: ${command}`);
  printUsage();
  process.exit(1);
}

if (require.main === module) {
  main(process.argv.slice(2));
}

module.exports = { main, printUsage };
