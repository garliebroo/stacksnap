#!/usr/bin/env node
const { addSchedule, removeSchedule, loadSchedule, runDueSnapshots } = require('./schedule');

function printUsage() {
  console.log(`
Usage: stacksnap schedule <command> [options]

Commands:
  add <name> <hours>   Schedule auto-snapshot every <hours> hours
  remove <name>        Remove a schedule
  list                 List all schedules
  run                  Run any due scheduled snapshots now

Examples:
  stacksnap schedule add myenv 24
  stacksnap schedule remove myenv
  stacksnap schedule list
  stacksnap schedule run
`);
}

async function main(args) {
  const [cmd, ...rest] = args;

  if (!cmd || cmd === '--help' || cmd === '-h') {
    printUsage();
    return;
  }

  if (cmd === 'add') {
    const [name, hours] = rest;
    if (!name || !hours) {
      console.error('Usage: stacksnap schedule add <name> <hours>');
      process.exit(1);
    }
    try {
      const entry = addSchedule(name, hours);
      console.log(`Scheduled "${entry.name}" every ${entry.intervalHours}h`);
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
    return;
  }

  if (cmd === 'remove') {
    const [name] = rest;
    if (!name) { console.error('Usage: stacksnap schedule remove <name>'); process.exit(1); }
    try {
      removeSchedule(name);
      console.log(`Removed schedule "${name}"`);
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
    return;
  }

  if (cmd === 'list') {
    const entries = loadSchedule();
    if (!entries.length) { console.log('No schedules configured.'); return; }
    entries.forEach(e => {
      const last = e.lastRun ? new Date(e.lastRun).toLocaleString() : 'never';
      console.log(`  ${e.name} — every ${e.intervalHours}h | last run: ${last}`);
    });
    return;
  }

  if (cmd === 'run') {
    const ran = await runDueSnapshots();
    if (!ran.length) { console.log('No snapshots due.'); return; }
    ran.forEach(r => console.log(`  Saved: ${r}`));
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  printUsage();
  process.exit(1);
}

main(process.argv.slice(2)).catch(e => { console.error(e.message); process.exit(1); });
