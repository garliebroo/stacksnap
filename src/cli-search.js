#!/usr/bin/env node
'use strict';

const { searchSnapshots, formatSearchResults } = require('./search');

function printUsage() {
  console.log(`
Usage: stacksnap search [options]

Options:
  --name <substring>     Filter snapshots by name
  --tag <tag>            Filter snapshots by tag
  --config <key>         Filter snapshots containing a config key
  --after <date>         Only snapshots created after this date (ISO format)
  --before <date>        Only snapshots created before this date (ISO format)
  --help                 Show this help message
`.trim());
}

async function main(argv = process.argv.slice(2)) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printUsage();
    return;
  }

  const query = {};

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--name':
        query.name = argv[++i];
        break;
      case '--tag':
        query.tag = argv[++i];
        break;
      case '--config':
        query.configKey = argv[++i];
        break;
      case '--after':
        query.after = argv[++i];
        break;
      case '--before':
        query.before = argv[++i];
        break;
      default:
        console.error(`Unknown option: ${argv[i]}`);
        printUsage();
        process.exit(1);
    }
  }

  try {
    const results = await searchSnapshots(query);
    console.log(formatSearchResults(results));
  } catch (err) {
    console.error('Search failed:', err.message);
    process.exit(1);
  }
}

main();

module.exports = { main };
