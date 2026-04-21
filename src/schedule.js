const fs = require('fs');
const path = require('path');
const { ensureSnapshotDir, saveSnapshot } = require('./snapshot');

const SCHEDULE_FILE = path.join(require('os').homedir(), '.stacksnap', 'schedule.json');

function getScheduleFilePath() {
  return SCHEDULE_FILE;
}

function loadSchedule() {
  if (!fs.existsSync(SCHEDULE_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveSchedule(entries) {
  ensureSnapshotDir();
  fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(entries, null, 2));
}

function addSchedule(name, intervalHours) {
  if (!name || typeof name !== 'string') throw new Error('Schedule name is required');
  const hours = parseFloat(intervalHours);
  if (isNaN(hours) || hours <= 0) throw new Error('Interval must be a positive number of hours');

  const entries = loadSchedule();
  const existing = entries.findIndex(e => e.name === name);
  const entry = { name, intervalHours: hours, createdAt: new Date().toISOString(), lastRun: null };

  if (existing >= 0) {
    entries[existing] = { ...entries[existing], ...entry };
  } else {
    entries.push(entry);
  }

  saveSchedule(entries);
  return entry;
}

function removeSchedule(name) {
  const entries = loadSchedule();
  const filtered = entries.filter(e => e.name !== name);
  if (filtered.length === entries.length) throw new Error(`No schedule found for "${name}"`);
  saveSchedule(filtered);
}

function getDueSchedules() {
  const entries = loadSchedule();
  const now = Date.now();
  return entries.filter(e => {
    if (!e.lastRun) return true;
    const elapsed = (now - new Date(e.lastRun).getTime()) / (1000 * 60 * 60);
    return elapsed >= e.intervalHours;
  });
}

async function runDueSnapshots() {
  const due = getDueSchedules();
  const results = [];
  for (const entry of due) {
    const label = `${entry.name}-auto-${Date.now()}`;
    await saveSnapshot(label);
    const entries = loadSchedule();
    const idx = entries.findIndex(e => e.name === entry.name);
    if (idx >= 0) entries[idx].lastRun = new Date().toISOString();
    saveSchedule(entries);
    results.push(label);
  }
  return results;
}

module.exports = { getScheduleFilePath, loadSchedule, saveSchedule, addSchedule, removeSchedule, getDueSchedules, runDueSnapshots };
