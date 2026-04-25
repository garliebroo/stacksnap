#!/usr/bin/env node
const path = require('path');
const { lockSnapshot, unlockSnapshot, listLocked, getLockInfo, isLocked } = require('./lock');

const SNAPSHOT_DIR = path.join(process.env.HOME || '.', '.stacksnap', 'snapshots');

function printUsage() {
  console.log(`Usage: stacksnap lock <command> [options]

Commands:
  lock <name> [reason]   Lock a snapshot to prevent modification or deletion
  unlock <name>          Unlock a previously locked snapshot
  list                   List all locked snapshots
  info <name>            Show lock details for a snapshot
`);
}

function run(args = process.argv.slice(2)) {
  const [command, name, ...rest] = args;

  if (!command || command === '--help' || command === '-h') {
    printUsage();
    return;
  }

  if (command === 'lock') {
    if (!name) {
      console.error('Error: snapshot name required.');
      process.exitCode = 1;
      return;
    }
    const reason = rest.join(' ');
    const result = lockSnapshot(SNAPSHOT_DIR, name, reason);
    console.log(result.message);
    if (!result.success) process.exitCode = 1;
    return;
  }

  if (command === 'unlock') {
    if (!name) {
      console.error('Error: snapshot name required.');
      process.exitCode = 1;
      return;
    }
    const result = unlockSnapshot(SNAPSHOT_DIR, name);
    console.log(result.message);
    if (!result.success) process.exitCode = 1;
    return;
  }

  if (command === 'list') {
    const locks = listLocked(SNAPSHOT_DIR);
    const names = Object.keys(locks);
    if (names.length === 0) {
      console.log('No locked snapshots.');
    } else {
      names.forEach(n => {
        const { lockedAt, reason } = locks[n];
        console.log(`  ${n}  (locked at ${lockedAt}${reason ? ', reason: ' + reason : ''})`);
      });
    }
    return;
  }

  if (command === 'info') {
    if (!name) {
      console.error('Error: snapshot name required.');
      process.exitCode = 1;
      return;
    }
    const info = getLockInfo(SNAPSHOT_DIR, name);
    if (!info) {
      console.log(`Snapshot "${name}" is not locked.`);
    } else {
      console.log(`Snapshot: ${name}`);
      console.log(`  Locked at: ${info.lockedAt}`);
      console.log(`  Reason:    ${info.reason || '(none)'}`);
    }
    return;
  }

  console.error(`Unknown command: ${command}`);
  printUsage();
  process.exitCode = 1;
}

if (require.main === module) run();

module.exports = { run, printUsage };
