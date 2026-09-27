import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SNOOZE_DELAY_MS,
  defaultSnoozeWakeAt,
  parseLocalSnoozeTime,
  toLocalDateTimeValue,
  tomorrowMorningWakeAt
} from "../src/core/snooze-time.js";

test("default snooze wake time is exactly one hour from the supplied time", () => {
  assert.equal(defaultSnoozeWakeAt(1_000), 1_000 + DEFAULT_SNOOZE_DELAY_MS);
});

test("local datetime values round-trip to minute precision", () => {
  const wakeAt = 2_000_000_000_000;
  const value = toLocalDateTimeValue(wakeAt);
  const parsed = parseLocalSnoozeTime(value, wakeAt - 120_000);
  assert.equal(parsed.ok, true);
  assert.ok(Math.abs(parsed.wakeAt - wakeAt) < 60_000);
});

test("local snooze parsing rejects missing, invalid, and past deadlines", () => {
  assert.equal(parseLocalSnoozeTime("", 1_000).reason, "deadline-required");
  assert.equal(parseLocalSnoozeTime("not-a-date", 1_000).reason, "invalid-deadline");
  const past = toLocalDateTimeValue(60_000);
  assert.equal(parseLocalSnoozeTime(past, 120_000).reason, "deadline-not-in-future");
});

test("tomorrow morning resolves to the next local calendar day at the requested hour", () => {
  const now = new Date(2030, 3, 5, 22, 30, 0, 0).getTime();
  const wakeAt = tomorrowMorningWakeAt(now, 9);
  const date = new Date(wakeAt);
  assert.equal(date.getHours(), 9);
  assert.equal(date.getMinutes(), 0);
  assert.equal(date.getDate(), new Date(2030, 3, 6).getDate());
  assert.ok(wakeAt > now);
});
