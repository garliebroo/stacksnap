#!/usr/bin/env node
const { renameSnapshot } = require('./rename');

function printUsage() {
  console.log(`
Usage: stacksnap rename <old-name> <new-name>

Rename an existing snapshot.

Arguments:
  old-name   Current name of the snapshot
  new-name   New name for the snapshot

Examples:
  stacksnap rename my-setup work-setup
  stacksnap rename dev-2023 dev-2024
`.trim());
}

async function main(argv) {
  const args = argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const [oldName, newName] = args;

  if (!oldName || !newName) {
    console.error('Error: both old-name and new-name are required.');
    printUsage();
    process.exit(1);
  }

  try {
    const result = await renameSnapshot(oldName, newName);
    console.log(`Snapshot "${result.oldName}" renamed to "${result.newName}" successfully.`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main(process.argv);
}

module.exports = { main, printUsage };
