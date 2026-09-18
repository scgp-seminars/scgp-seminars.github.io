const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

// Load the real browser script with a minimal DOM; no network or timers run.
const context = vm.createContext({
  document: { getElementById: () => ({setAttribute() {}}), querySelectorAll: () => [] },
  fetch: () => new Promise(() => {}), setInterval() {}, URL,
});
vm.runInContext(readFileSync(`${__dirname}/schedule.js`, 'utf8'), context);
const value = code => JSON.parse(JSON.stringify(vm.runInContext(code, context)));

test('previous events excludes today and future, with newest days first', () => {
  assert.deepEqual(value(`matchingEvents([
    {date:'2026-09-01', time:'11:00 AM', title:'Earlier'},
    {date:'2026-09-18', time:'8:00 AM', title:'Today'},
    {date:'2026-09-17', time:'2:00 PM', title:'Afternoon'},
    {date:'2026-09-17', time:'11:00 AM', title:'Morning'},
    {date:'2026-09-19', time:'11:00 AM', title:'Future'}
  ], 'previous', '2026-09-18').map(e => e.title)`), ['Morning', 'Afternoon', 'Earlier']);
});

test('week boundaries include Monday and exclude the following Monday', () => {
  assert.deepEqual(value(`periodBounds('week', '2026-09-20')`), ['2026-09-14', '2026-09-21']);
  assert.deepEqual(value(`periodBounds('next', '2026-09-20')`), ['2026-09-21', '2026-09-28']);
  assert.deepEqual(value(`matchingEvents([
    {date:'2026-09-14',title:'Monday'}, {date:'2026-09-20',title:'Sunday'},
    {date:'2026-09-21',title:'Next Monday'}
  ], 'week', '2026-09-18').map(e=>e.title)`), ['Monday', 'Sunday']);
});

test('upcoming includes today and sorts dates ascending', () => {
  assert.deepEqual(value(`matchingEvents([
    {date:'2026-09-19',title:'Tomorrow'}, {date:'2026-09-17',title:'Yesterday'},
    {date:'2026-09-18',title:'Today'}
  ], 'upcoming', '2026-09-18').map(e=>e.title)`), ['Today', 'Tomorrow']);
});

test('previous events works across years and empty snapshots', () => {
  assert.deepEqual(value(`matchingEvents([], 'previous', '2027-01-01')`), []);
  assert.deepEqual(value(`matchingEvents([
    {date:'2025-12-31', title:'Old'}, {date:'2026-12-31', title:'Recent'}
  ], 'previous', '2027-01-01').map(e=>e.title)`), ['Recent', 'Old']);
});

test('today is determined in New York, not UTC, including daylight saving', () => {
  assert.equal(value(`localDate(new Date('2026-09-18T02:00:00Z'))`), '2026-09-17');
  assert.equal(value(`localDate(new Date('2026-09-18T04:00:00Z'))`), '2026-09-18');
  assert.equal(value(`localDate(new Date('2026-01-01T04:30:00Z'))`), '2025-12-31');
});
