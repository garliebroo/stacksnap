const fs = require('fs');
const path = require('path');
const { ensureSnapshotDir } = require('./snapshot');

function getAliasFilePath() {
  const dir = ensureSnapshotDir();
  return path.join(dir, 'aliases.json');
}

function loadAliases() {
  const filePath = getAliasFilePath();
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

function saveAliases(aliases) {
  const filePath = getAliasFilePath();
  fs.writeFileSync(filePath, JSON.stringify(aliases, null, 2));
}

function setAlias(alias, snapshotName) {
  if (!alias || !snapshotName) throw new Error('alias and snapshotName are required');
  const aliases = loadAliases();
  aliases[alias] = snapshotName;
  saveAliases(aliases);
  return aliases;
}

function removeAlias(alias) {
  const aliases = loadAliases();
  if (!aliases[alias]) throw new Error(`Alias "${alias}" not found`);
  delete aliases[alias];
  saveAliases(aliases);
  return aliases;
}

function resolveAlias(aliasOrName) {
  const aliases = loadAliases();
  return aliases[aliasOrName] || aliasOrName;
}

function listAliases() {
  return loadAliases();
}

function formatAliasList(aliases) {
  const entries = Object.entries(aliases);
  if (entries.length === 0) return 'No aliases defined.';
  return entries.map(([alias, name]) => `  ${alias} -> ${name}`).join('\n');
}

module.exports = {
  getAliasFilePath,
  loadAliases,
  saveAliases,
  setAlias,
  removeAlias,
  resolveAlias,
  listAliases,
  formatAliasList,
};
