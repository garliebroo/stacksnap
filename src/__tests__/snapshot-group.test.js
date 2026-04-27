const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  getGroupsFilePath,
  loadGroups,
  createGroup,
  addToGroup,
  removeFromGroup,
  deleteGroup,
  getGroup,
  listGroups,
} = require('../snapshot-group');

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stacksnap-group-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('getGroupsFilePath returns correct path', () => {
  expect(getGroupsFilePath(tmpDir)).toBe(path.join(tmpDir, 'groups.json'));
});

test('loadGroups returns empty object when file missing', () => {
  expect(loadGroups(tmpDir)).toEqual({});
});

test('createGroup creates a new empty group', () => {
  createGroup(tmpDir, 'work');
  const groups = loadGroups(tmpDir);
  expect(groups['work']).toEqual([]);
});

test('createGroup throws if group already exists', () => {
  createGroup(tmpDir, 'work');
  expect(() => createGroup(tmpDir, 'work')).toThrow('already exists');
});

test('addToGroup adds snapshot to group', () => {
  createGroup(tmpDir, 'work');
  const members = addToGroup(tmpDir, 'work', 'snap-1');
  expect(members).toContain('snap-1');
});

test('addToGroup creates group implicitly if missing', () => {
  addToGroup(tmpDir, 'new-group', 'snap-a');
  expect(getGroup(tmpDir, 'new-group')).toContain('snap-a');
});

test('addToGroup throws if snapshot already in group', () => {
  addToGroup(tmpDir, 'work', 'snap-1');
  expect(() => addToGroup(tmpDir, 'work', 'snap-1')).toThrow('already in group');
});

test('removeFromGroup removes snapshot from group', () => {
  addToGroup(tmpDir, 'work', 'snap-1');
  addToGroup(tmpDir, 'work', 'snap-2');
  const members = removeFromGroup(tmpDir, 'work', 'snap-1');
  expect(members).not.toContain('snap-1');
  expect(members).toContain('snap-2');
});

test('removeFromGroup throws if group missing', () => {
  expect(() => removeFromGroup(tmpDir, 'nope', 'snap-1')).toThrow('does not exist');
});

test('removeFromGroup throws if snapshot not in group', () => {
  createGroup(tmpDir, 'work');
  expect(() => removeFromGroup(tmpDir, 'work', 'ghost')).toThrow('not found in group');
});

test('deleteGroup removes the group', () => {
  createGroup(tmpDir, 'temp');
  deleteGroup(tmpDir, 'temp');
  expect(getGroup(tmpDir, 'temp')).toBeNull();
});

test('deleteGroup throws if group missing', () => {
  expect(() => deleteGroup(tmpDir, 'nope')).toThrow('does not exist');
});

test('listGroups returns all groups with members', () => {
  createGroup(tmpDir, 'alpha');
  addToGroup(tmpDir, 'beta', 'snap-x');
  const list = listGroups(tmpDir);
  expect(list.map(g => g.name)).toEqual(expect.arrayContaining(['alpha', 'beta']));
  const beta = list.find(g => g.name === 'beta');
  expect(beta.snapshots).toContain('snap-x');
});
