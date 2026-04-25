const fs = require('fs');
const path = require('path');
const { loadSnapshot, saveSnapshot } = require('./snapshot');

const TEMPLATES_FILE = path.join(require('os').homedir(), '.stacksnap', 'templates.json');

function getTemplatesFilePath() {
  return TEMPLATES_FILE;
}

function loadTemplates() {
  if (!fs.existsSync(TEMPLATES_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(TEMPLATES_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveTemplates(templates) {
  const dir = path.dirname(TEMPLATES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2));
}

function saveAsTemplate(snapshotName, templateName, description = '') {
  const snapshot = loadSnapshot(snapshotName);
  if (!snapshot) throw new Error(`Snapshot "${snapshotName}" not found`);

  const templates = loadTemplates();
  if (templates[templateName]) {
    throw new Error(`Template "${templateName}" already exists`);
  }

  templates[templateName] = {
    name: templateName,
    description,
    createdAt: new Date().toISOString(),
    sourceSnapshot: snapshotName,
    configs: snapshot.configs || {}
  };

  saveTemplates(templates);
  return templates[templateName];
}

function applyTemplate(templateName, newSnapshotName) {
  const templates = loadTemplates();
  const template = templates[templateName];
  if (!template) throw new Error(`Template "${templateName}" not found`);

  const snapshot = {
    name: newSnapshotName,
    createdAt: new Date().toISOString(),
    fromTemplate: templateName,
    configs: template.configs
  };

  saveSnapshot(newSnapshotName, snapshot);
  return snapshot;
}

function deleteTemplate(templateName) {
  const templates = loadTemplates();
  if (!templates[templateName]) throw new Error(`Template "${templateName}" not found`);
  delete templates[templateName];
  saveTemplates(templates);
  return true;
}

function listTemplates() {
  return Object.values(loadTemplates());
}

module.exports = {
  getTemplatesFilePath,
  loadTemplates,
  saveTemplates,
  saveAsTemplate,
  applyTemplate,
  deleteTemplate,
  listTemplates
};
