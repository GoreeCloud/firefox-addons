export const DEFAULT_SNOOZE_DELAY_MS = 60 * 60 * 1000;
export const DEFAULT_MORNING_HOUR = 9;

export function toLocalDateTimeValue(timestamp) {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function parseLocalSnoozeTime(value, now = Date.now()) {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false, reason: "deadline-required" };
  }
  const wakeAt = new Date(value).getTime();
  if (!Number.isFinite(wakeAt)) {
    return { ok: false, reason: "invalid-deadline" };
  }
  if (wakeAt <= now) {
    return { ok: false, reason: "deadline-not-in-future" };
  }
  return { ok: true, wakeAt: Math.trunc(wakeAt) };
}

export function defaultSnoozeWakeAt(now = Date.now()) {
  return now + DEFAULT_SNOOZE_DELAY_MS;
}

export function tomorrowMorningWakeAt(now = Date.now(), hour = DEFAULT_MORNING_HOUR) {
  const date = new Date(now);
  date.setDate(date.getDate() + 1);
  date.setHours(hour, 0, 0, 0);
  return date.getTime();
}
