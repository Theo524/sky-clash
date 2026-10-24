/* Sky Clash V115 visual review utilities.
 * A standalone QA tool: never changes the in-game animation controllers.
 */
(function (root) {
  'use strict';

  const baseline = Object.freeze({
    movementLab: 'step',
    stance: 'handoff',
    joystickRun: 'on',
    idleArms: 'anchored',
    airLab: 'jump',
    animator: 'unified',
    jumpArms: 'compact',
    airLegs: 'steady',
    movingJump: 'carry',
    landingLab: 'contact',
    landingFeet: 'plant',
    landingMove: 'flow',
    jumpStyle: 'expressive',
    jumpPrep: 'push',
    jumpFeet: 'hold',
    jumpFacing: 'locked',
    flightLab: 'blend'
  });

  const kneeOptions = Object.freeze({
    forward: 'V115: measured forward bend',
    guided: 'V114: guided hinge (comparison)',
    original: 'V112: original push (comparison)'
  });
  const flightOptions = Object.freeze({
    airborne: 'V114: airborne hover/cruise',
    controlled: 'V113: controlled flight (comparison)',
    recorded: 'V111: recorded loops (comparison)'
  });

  function assertChoice(choice, choices, kind) {
    if (!Object.prototype.hasOwnProperty.call(choices, choice)) {
      throw new RangeError('Unsupported ' + kind + ' mode: ' + choice);
    }
  }

  function buildPreviewUrl(gameUrl, choices) {
    choices = choices || {};
    const knees = choices.knees === undefined ? 'forward' : choices.knees;
    const flight = choices.flight === undefined ? 'airborne' : choices.flight;
    assertChoice(knees, kneeOptions, 'knee');
    assertChoice(flight, flightOptions, 'flight');

    // Build from a clean query string, so modes never collide with old flags
    // (or with arbitrary parameters from the visual-review page).
    const url = new URL(gameUrl);
    const query = new URLSearchParams(baseline);
    if (knees !== 'original') query.set('jumpKnees', knees);
    if (flight !== 'recorded') query.set('flightStyle', flight);
    url.search = query.toString();
    url.hash = '';
    return url.href;
  }

  function formatReport(info) {
    info = info || {};
    const knees = info.knees || 'forward';
    const flight = info.flight || 'airborne';
    assertChoice(knees, kneeOptions, 'knee');
    assertChoice(flight, flightOptions, 'flight');
    const observations = Array.isArray(info.observations) ? info.observations : [];
    return [
      'Sky Clash V115 — visual review',
      'Knees: ' + kneeOptions[knees],
      'Flight: ' + flightOptions[flight],
      'Preview: ' + (info.previewUrl || '(missing)'),
      'Device / browser: ' + (info.device || '(not supplied)'),
      'Checks:',
      ...(observations.length ? observations.map(item =>
        '- ' + item.label + ': ' + item.result) : ['- Not recorded']),
      'Notes: ' + (info.notes || '(none)')
    ].join('\n');
  }

  const api = Object.freeze({ baseline, kneeOptions, flightOptions,
    buildPreviewUrl, formatReport });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.SkyClashVisualQA = api;
})(typeof window === 'undefined' ? null : window);
