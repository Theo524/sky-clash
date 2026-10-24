/* V115 visual QA is a read-only preview launcher, not an animation owner. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const qa = require('../js/v115-visual-qa.js');

const read = relative => fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
const baseUrl = 'https://theo524.github.io/sky-clash/index.html?jumpKnees=outdated&flightStyle=wrong&foo=bar#old';
const required = {
  movementLab: 'step', stance: 'handoff', joystickRun: 'on',
  idleArms: 'anchored', airLab: 'jump', animator: 'unified',
  jumpArms: 'compact', airLegs: 'steady', movingJump: 'carry',
  landingLab: 'contact', landingFeet: 'plant', landingMove: 'flow',
  jumpStyle: 'expressive', jumpPrep: 'push', jumpFeet: 'hold',
  jumpFacing: 'locked', flightLab: 'blend'
};
for (const knees of ['forward', 'guided', 'original']) {
  for (const flight of ['airborne', 'controlled', 'recorded']) {
    const preview = qa.buildPreviewUrl(baseUrl, {knees, flight});
    const url = new URL(preview);
    assert.equal(url.origin, 'https://theo524.github.io');
    assert.equal(url.pathname, '/sky-clash/index.html');
    assert.equal(url.hash, '', 'old hash must not leak into the game');
    assert.equal(url.searchParams.has('foo'), false,
      'arbitrary old preview parameters must not leak');
    for (const [key, value] of Object.entries(required))
      assert.equal(url.searchParams.get(key), value, key + ' should retain the approved preview stack');
    assert.equal(url.searchParams.get('jumpKnees'), knees === 'original' ? null : knees);
    assert.equal(url.searchParams.get('flightStyle'), flight === 'recorded' ? null : flight);
    assert.equal(url.searchParams.size,
      Object.keys(required).length + (knees === 'original' ? 0 : 1) +
      (flight === 'recorded' ? 0 : 1), 'no duplicate or unknown flags');
  }
}
const defaults = new URL(qa.buildPreviewUrl('https://example.test/sky-clash/index.html'));
assert.equal(defaults.searchParams.get('jumpKnees'), 'forward');
assert.equal(defaults.searchParams.get('flightStyle'), 'airborne');
assert.throws(() => qa.buildPreviewUrl(baseUrl, {knees: 'broken'}), RangeError);
assert.throws(() => qa.buildPreviewUrl(baseUrl, {flight: 'broken'}), RangeError);

const previewUrl = qa.buildPreviewUrl(baseUrl, {knees: 'forward', flight: 'airborne'});
const report = qa.formatReport({
  knees: 'forward', flight: 'airborne', previewUrl,
  device: 'mobile Safari', notes: 'Foot moved near takeoff',
  observations: [{label: 'Shoes remain planted', result: 'Needs fix'}]
});
assert(report.includes('Sky Clash V115 — visual review'));
assert(report.includes('Knees: V115: measured forward bend'));
assert(report.includes('Flight: V114: airborne hover/cruise'));
assert(report.includes('Preview: ' + previewUrl));
assert(report.includes('Shoes remain planted: Needs fix'));
assert(report.includes('Foot moved near takeoff'));
assert.throws(() => qa.formatReport({knees: 'invalid'}), RangeError);

const page = read('qa.html');
assert(page.includes('js/v115-visual-qa.js'));
assert(page.includes("new URL('./index.html', location.href)"),
  'QA page must work on a GitHub Pages project subpath');
assert(page.includes('target="_blank"') && page.includes('rel="noopener noreferrer"'));
assert(page.includes("navigator.clipboard.writeText(text)"),
  'reviewers should be able to copy feedback back to the developer');
assert(page.includes('No notes are uploaded or stored'),
  'make review privacy expectations explicit');
assert(!read('index.html').includes('js/v115-visual-qa.js'),
  'review helper must not touch the production game runtime');
console.log('PASS V115 QA: all 9 knee/flight A/B profile links, independent opt-ins, clean Pages URLs, report, and isolated game runtime');
