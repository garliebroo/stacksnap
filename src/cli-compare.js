#!/usr/bin/env node

const { compareSnapshots, formatComparison } = require('./compare');

function printUsage() {
  console.log(`
Usage: stacksnap compare <snapshot-a> <snapshot-b> [options]

Options:
  --json       Output result as JSON
  --summary    Show summary only, no details
  --help       Show this help message

Examples:
  stacksnap compare work-setup home-setup
  stacksnap compare snap-2024-01 snap-2024-02 --json
  stacksnap compare old new --summary
`.trim());
}

async function main(args = process.argv.slice(2)) {
  if (args.includes('--help') || args.length === 0) {
    printUsage();
    process.exit(0);
  }

  const flags = args.filter(a => a.startsWith('--'));
  const positional = args.filter(a => !a.startsWith('--'));

  const outputJson = flags.includes('--json');
  const summaryOnly = flags.includes('--summary');

  const [nameA, nameB] = positional;

  if (!nameA || !nameB) {
    console.error('Error: two snapshot names are required.');
    printUsage();
    process.exit(1);
  }

  try {
    const result = await compareSnapshots(nameA, nameB);

    if (outputJson) {
      if (summaryOnly) {
        console.log(JSON.stringify({ snapshotA: result.snapshotA, snapshotB: result.snapshotB, summary: result.summary }, null, 2));
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
      return;
    }

    if (summaryOnly) {
      const { summary, snapshotA, snapshotB } = result;
      console.log(`${snapshotA.name} vs ${snapshotB.name}: ${summary.matches} match, ${summary.added} added, ${summary.removed} removed, ${summary.changed} changed`);
      return;
    }

    console.log(formatComparison(result));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, printUsage };
