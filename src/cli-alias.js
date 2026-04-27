#!/usr/bin/env node
const {
  setAlias,
  removeAlias,
  listAliases,
  formatAliasList,
} = require('./snapshot-alias');

function printUsage() {
  console.log(`Usage: stacksnap alias <subcommand> [options]

Subcommands:
  set <alias> <snapshot>   Create or update an alias pointing to a snapshot
  remove <alias>           Remove an alias
  list                     List all defined aliases

Examples:
  stacksnap alias set prod snapshot-2024-06-01
  stacksnap alias remove prod
  stacksnap alias list
`);
}

function run(args) {
  const [sub, ...rest] = args;

  if (!sub || sub === '--help' || sub === '-h') {
    printUsage();
    return;
  }

  if (sub === 'set') {
    const [alias, snapshotName] = rest;
    if (!alias || !snapshotName) {
      console.error('Error: set requires <alias> and <snapshot> arguments');
      process.exitCode = 1;
      return;
    }
    try {
      setAlias(alias, snapshotName);
      console.log(`Alias "${alias}" -> "${snapshotName}" saved.`);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exitCode = 1;
    }
    return;
  }

  if (sub === 'remove') {
    const [alias] = rest;
    if (!alias) {
      console.error('Error: remove requires <alias> argument');
      process.exitCode = 1;
      return;
    }
    try {
      removeAlias(alias);
      console.log(`Alias "${alias}" removed.`);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exitCode = 1;
    }
    return;
  }

  if (sub === 'list') {
    const aliases = listAliases();
    console.log(formatAliasList(aliases));
    return;
  }

  console.error(`Unknown subcommand: ${sub}`);
  printUsage();
  process.exitCode = 1;
}

module.exports = { printUsage, run };
