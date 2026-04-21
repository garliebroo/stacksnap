#!/usr/bin/env node
const { tagSnapshot, removeTag, getSnapshotsByTag, getTagsForSnapshot, listAllTags } = require('./tag');

const [,, command, ...args] = process.argv;

function printUsage() {
  console.log('Usage:');
  console.log('  stacksnap tag add <snapshot> <tag>');
  console.log('  stacksnap tag remove <snapshot> <tag>');
  console.log('  stacksnap tag list [<tag>]');
  console.log('  stacksnap tag show <snapshot>');
}

try {
  if (command === 'add') {
    const [snapshotName, tag] = args;
    if (!snapshotName || !tag) {
      console.error('Error: snapshot name and tag are required');
      printUsage();
      process.exit(1);
    }
    const snapshots = tagSnapshot(snapshotName, tag);
    console.log(`Tagged "${snapshotName}" with "${tag}"`);
    console.log(`Snapshots with tag "${tag}": ${snapshots.join(', ')}`);

  } else if (command === 'remove') {
    const [snapshotName, tag] = args;
    if (!snapshotName || !tag) {
      console.error('Error: snapshot name and tag are required');
      printUsage();
      process.exit(1);
    }
    const removed = removeTag(snapshotName, tag);
    if (removed) {
      console.log(`Removed tag "${tag}" from "${snapshotName}"`);
    } else {
      console.log(`Tag "${tag}" not found on "${snapshotName}"`);
    }

  } else if (command === 'list') {
    const [tag] = args;
    if (tag) {
      const snapshots = getSnapshotsByTag(tag);
      if (snapshots.length === 0) {
        console.log(`No snapshots found with tag "${tag}"`);
      } else {
        console.log(`Snapshots tagged "${tag}": ${snapshots.join(', ')}`);
      }
    } else {
      const all = listAllTags();
      const entries = Object.entries(all);
      if (entries.length === 0) {
        console.log('No tags defined.');
      } else {
        entries.forEach(([t, snaps]) => {
          console.log(`  ${t}: ${snaps.join(', ')}`);
        });
      }
    }

  } else if (command === 'show') {
    const [snapshotName] = args;
    if (!snapshotName) {
      console.error('Error: snapshot name is required');
      printUsage();
      process.exit(1);
    }
    const tags = getTagsForSnapshot(snapshotName);
    if (tags.length === 0) {
      console.log(`No tags for snapshot "${snapshotName}"`);
    } else {
      console.log(`Tags for "${snapshotName}": ${tags.join(', ')}`);
    }

  } else {
    printUsage();
    process.exit(1);
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
