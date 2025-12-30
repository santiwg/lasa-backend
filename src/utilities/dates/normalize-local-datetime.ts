// Helper to treat an incoming Date as a "local" time and store it
// without the timezone offset shift (useful when the client sends
// local time but the backend / DB work in UTC).
export function normalizeLocalDateTime(date: Date | null | undefined): Date {
  if (!date) {
    return new Date();
  }
  // Subtract the local timezone offset so that the stored timestamp
  // matches the wall-clock time the user selected in their locale.
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
}
