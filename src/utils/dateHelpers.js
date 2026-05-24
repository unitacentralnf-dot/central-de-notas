// src/utils/dateHelpers.js
// Utility functions for date calculations used by generate_faturas.js

/**
 * Adds n months to a Date object, preserving the day when possible.
 * If the resulting month has fewer days, it rolls back to the last day of that month.
 */
export function addMonths(date, n) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + n);
  // Handle month overflow (e.g., 31st March + 1 month => 30th April)
  if (d.getDate() < day) {
    d.setDate(0); // last day of previous month
  }
  return d;
}

/**
 * Formats a Date as YYYY-MM-DD (ISO date string without time).
 */
export function formatDateISO(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the next due date for a fixed account based on its `dia_vencimento`
 * and a reference month (typically the current month).
 * If the day does not exist in the reference month (e.g., 31st in February),
 * it returns the last valid day of that month.
 */
export function nextDueDate(dia, referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth(); // 0‑based
  const tentative = new Date(year, month, dia);
  if (tentative.getMonth() !== month) {
    // Day overflow – use last day of month
    return new Date(year, month + 1, 0);
  }
  // If tentative date is already past today, move to next month
  const today = new Date();
  if (tentative < today) {
    return addMonths(tentative, 1);
  }
  return tentative;
}
