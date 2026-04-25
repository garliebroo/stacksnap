#!/usr/bin/env node
const { mergeSnapshots, formatMergeResult } = require('./merge');

function printUsage() {
  console.log(`
Usage: stacksnap merge <snapshotA> <snapshotB> <outputName> [options]

Options:
  --strategy <overwrite|keep|combine>   Conflict resolution strategy (default: overwrite)
  --help                                Show this help message

Examples:
  stacksnap merge work-setup home-setup combined
  stacksnap merge snapA snapB merged --strategy combine
  stacksnap merge snapA snapB merged --strategy keep
`.trim());
}

async function main(argv) {
  const args = argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    printUsage();
    process.exit(0);
  }

  const positional = args.filter((a) => !a.startsWith('--'));
  const [nameA, nameB, outputName] = positional;

  if (!nameA || !nameB || !outputName) {
    console.error('Error: Please provide two source snapshot names and an output name.');
    printUsage();
    process.exit(1);
  }

  const strategyIdx = args.indexOf('--strategy');
  const strategy = strategyIdx !== -1 ? args[strategyIdx + 1] : 'overwrite';

  const validStrategies = ['overwrite', 'keep', 'combine'];
  if (!validStrategies.includes(strategy)) {
    console.error(`Error: Invalid strategy "${strategy}". Must be one of: ${validStrategies.join(', ')}`);
    process.exit(1);
  }

  try {
    const merged = await mergeSnapshots(nameA, nameB, outputName, { strategy });
    console.log(formatMergeResult(merged));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main(process.argv);
}

module.exports = { main, printUsage };
