const fs = require('fs');
const path = require('path');
const { loadSnapshot } = require('./snapshot');

const REQUIRED_FIELDS = ['name', 'timestamp', 'configs'];

function validateSnapshotStructure(snapshot) {
  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    if (snapshot[field] === undefined || snapshot[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (snapshot.name && typeof snapshot.name !== 'string') {
    errors.push('Field "name" must be a string');
  }

  if (snapshot.timestamp && isNaN(Date.parse(snapshot.timestamp))) {
    errors.push('Field "timestamp" is not a valid date');
  }

  if (snapshot.configs && typeof snapshot.configs !== 'object') {
    errors.push('Field "configs" must be an object');
  }

  return errors;
}

function validateConfigFiles(snapshot) {
  const warnings = [];

  if (!snapshot.configs || typeof snapshot.configs !== 'object') {
    return warnings;
  }

  for (const [key, value] of Object.entries(snapshot.configs)) {
    if (typeof value !== 'string') {
      warnings.push(`Config "${key}" has non-string content`);
    }
    if (value === '') {
      warnings.push(`Config "${key}" is empty`);
    }
  }

  return warnings;
}

async function validateSnapshot(name, snapshotDir) {
  let snapshot;
  try {
    snapshot = await loadSnapshot(name, snapshotDir);
  } catch (err) {
    return { valid: false, errors: [`Could not load snapshot "${name}": ${err.message}`], warnings: [] };
  }

  const errors = validateSnapshotStructure(snapshot);
  const warnings = validateConfigFiles(snapshot);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    snapshot
  };
}

function formatValidationResult(result, name) {
  const lines = [`Validation result for "${name}":`];

  if (result.valid) {
    lines.push('  ✓ Structure is valid');
  } else {
    lines.push('  ✗ Validation failed');
    for (const err of result.errors) {
      lines.push(`    ERROR: ${err}`);
    }
  }

  for (const warn of result.warnings) {
    lines.push(`    WARN: ${warn}`);
  }

  return lines.join('\n');
}

module.exports = { validateSnapshotStructure, validateConfigFiles, validateSnapshot, formatValidationResult };
