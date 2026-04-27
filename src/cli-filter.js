#!/usr/bin/env node
const path = require('path');
const { filterSnapshots, formatFilterResults } = require('./snapshot-filter');

const SNAPSHOT_DIR = path.join(process.env.HOME || '.', '.stacksnap', 'snapshots');

function printUsage() {
  console.log(`Usage: stacksnap filter [options]

Options:
  --name-contains <str>   Filter snapshots whose name contains <str>
  --has-config <file>     Filter snapshots that include a specific config file
  --before <date>         Filter snapshots created before <date> (ISO or locale)
  --after <date>          Filter snapshots created after <date>
  --min-configs <n>       Filter snapshots with at least <n> config files
  --max-configs <n>       Filter snapshots with at most <n> config files
  --help                  Show this help message
`);
}

async function run(argv = process.argv.slice(2)) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printUsage();
    return;
  }

  const criteria = {};

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--name-contains':
        criteria.nameContains = argv[++i];
        break;
      case '--has-config':
        criteria.hasConfig = argv[++i];
        break;
      case '--before':
        criteria.before = argv[++i];
        break;
      case '--after':
        criteria.after = argv[++i];
        break;
      case '--min-configs':
        criteria.minConfigs = parseInt(argv[++i], 10);
        break;
      case '--max-configs':
        criteria.maxConfigs = parseInt(argv[++i], 10);
        break;
      default:
        console.error(`Unknown option: ${argv[i]}`);
        printUsage();
        process.exitCode = 1;
        return;
    }
  }

  try {
    const results = await filterSnapshots(SNAPSHOT_DIR, criteria);
    console.log(formatFilterResults(results));
  } catch (err) {
    console.error('Error filtering snapshots:', err.message);
    process.exitCode = 1;
  }
}

if (require.main === module) run();

module.exports = { run, printUsage };
