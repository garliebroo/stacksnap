const { listSnapshots } = require('./snapshot');

const SORT_FIELDS = ['name', 'date', 'size'];
const SORT_ORDERS = ['asc', 'desc'];

/**
 * Sort snapshots by a given field and order.
 * @param {Array} snapshots - array of snapshot metadata objects
 * @param {string} field - 'name' | 'date' | 'size'
 * @param {string} order - 'asc' | 'desc'
 * @returns {Array} sorted snapshots
 */
function sortSnapshots(snapshots, field = 'date', order = 'asc') {
  if (!SORT_FIELDS.includes(field)) {
    throw new Error(`Invalid sort field: "${field}". Must be one of: ${SORT_FIELDS.join(', ')}`);
  }
  if (!SORT_ORDERS.includes(order)) {
    throw new Error(`Invalid sort order: "${order}". Must be one of: ${SORT_ORDERS.join(', ')}`);
  }

  const sorted = [...snapshots].sort((a, b) => {
    let valA, valB;

    if (field === 'name') {
      valA = (a.name || '').toLowerCase();
      valB = (b.name || '').toLowerCase();
      return order === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    if (field === 'date') {
      valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    } else if (field === 'size') {
      valA = typeof a.size === 'number' ? a.size : 0;
      valB = typeof b.size === 'number' ? b.size : 0;
    }

    return order === 'asc' ? valA - valB : valB - valA;
  });

  return sorted;
}

/**
 * Format sorted snapshots for display.
 * @param {Array} snapshots
 * @param {string} field
 * @param {string} order
 * @returns {string}
 */
function formatSortedList(snapshots, field, order) {
  if (!snapshots || snapshots.length === 0) {
    return 'No snapshots found.';
  }
  const lines = [`Snapshots sorted by ${field} (${order}):`, ''];
  snapshots.forEach((snap, i) => {
    const date = snap.createdAt ? new Date(snap.createdAt).toLocaleString() : 'unknown date';
    const size = typeof snap.size === 'number' ? ` [${snap.size}B]` : '';
    lines.push(`  ${i + 1}. ${snap.name}  —  ${date}${size}`);
  });
  return lines.join('\n');
}

module.exports = { sortSnapshots, formatSortedList, SORT_FIELDS, SORT_ORDERS };
