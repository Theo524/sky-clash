# Sky Clash — current state

This is the concise handoff. Inspect the current checkout and remote status before claiming a PR, CI run or deployment is current. Historical details belong in [project context](PROJECT-CONTEXT.md); [AGENTS.md](../AGENTS.md) and the [runbook](ASSISTANT-RUNBOOK.md) contain working rules.

## Kung fu arm correction — 2026-10-27

The player rejects all fighting arms, including the jab: weird shapes and
arms passing through the body. They want martial arts/kung fu with Dragon
Ball-style movement. The previous jab acceptance below is superseded.
Reauthor the full set, including the jab, inside the same measured Blender
pipeline and V72 player. Preserve standing stance and flight.

Confirmed defects: the first set pinned wrists in idle WORLD orientation
while forearms turned (104–176° wrist deflection), and transported the rear
elbow through the ribs when lifting the right hand from behind the body.
The correction uses forearm-following wrists with pronation, a front lead
guard/rear waist chamber, torso-carried guard targets and anatomical elbow
planes. Revision `kung-fu-v2` reauthors all 17 clips, including the jab,
inside the same Blender→VRM→V72/V81 path. Straight punches now extend
purposefully; guards and hit reactions retain the lead/rear chamber.
Native hit entry has an 80ms blend and its exit is classified as damage
in V81, avoiding abrupt arm resets. No animation wrapper was added.

Continuous native and actual gameplay arm audits at 30/60/120Hz report
positive torso-proxy clearance in every group, including eight real
incoming-hit handoffs per rate. Maximum sampled wrist deflection is
19.8° (previously 104–176°); maximum arm speed is 39.9rad/s. These
are skeleton/proxy checks, not a mesh collision guarantee. Real Kairo
three-view sequence captures and move sheets were inspected, with focused
recapture of the revised straight strikes and four hit reactions.
Baking all 17 clips/668 frames gives maximum joint-path error
0.0000041 units and foot-target residual 0.0000036 units.

Historical standalone jab bytes, standing stance, flight, Rin, hitboxes
and move clocks remain preserved. The revised set jab uses the same
bounded pursuit as the other new clips. Heavy guard-break recovery can
legitimately return to V100 hover after its existing knock-up; QA verifies
the actual air owner instead of incorrectly demanding ground idle.

The earlier roughly 0.12-unit support-foot discontinuity is still present
in the 60/120Hz combo and remains unfinished. Exact fist/mesh contact
and moving-target heights also need player review. Do not claim zero
sliding, universal collision clearance or aesthetic approval.

Review URL remains `?combatAnim=storm-fist-v1`; normal combat defaults
are unchanged. PR #142 contains the correction. Verify final CI/Pages
and the served pack before claiming it is published.

## Earlier full Storm Fist publication — superseded arm verdict

**Published for review:** PR #141 merged as `054f6ae` and GitHub Pages
deployment `40587098602` succeeded. Main's V66, ownership and startup checks
also passed. The served Storm Fist JSON was downloaded over verified HTTPS
and matches the committed asset byte-for-byte. Gameplay/visual tests below
ran locally on that exact build; the optional live Chromium replay was
blocked by this environment's proxy CA trust, not a game runtime error.

The player says the published Blender jab looks good and explicitly authorizes
the entire original fighting set, coordinated autonomous development, regular
pushed checkpoints and publication for visual review after testing. This
supersedes the older one-jab/private limits below; it does not authorize
altering standing stance, flight, Rin or discarding the accepted jab.

The continuation adds sixteen measured Blender clips around the unchanged
jab and extends only V72/V81's existing native path. The full-set review entry
is `?combatAnim=storm-fist-v1`; baseline and `blender-jab-v1` remain available.
See [controls and reproduction](KAIRO-STORM-FIST-PLAYTEST.md).
PR [#141](https://github.com/Theo524/sky-clash/pull/141) contains 17 clips
(accepted jab plus 16 new moves), baked from Blender onto actual Kairo's
20 normalized joints. The native player still lives inside V72/V81.
Actual gameplay passed full seven-hit ground-to-air chains, alternative
finishers, guard/parry, directional reactions, whiff, interruption and
recovered idle/movement at 30/60/120Hz, including the game's 1.1-unit
fighter separation. Three chronological camera reviews and all 17 runtime
move galleries were generated; final contact/recovery corrections receive
focused recapture. Source-to-VRM maximum joint-path error is 0.0000041 units.

The new clips use closer bounded pursuit to match authored reach. Original
jab/default/Rin pursuit traces remain exact in focused tests; hitboxes,
damage, attack clocks, collision, V100, models and selected flight bytes are
unchanged. A deep downward Falling Fist replaces the initially upright miss.
Standing stance and the original jab asset are byte-for-byte preserved.

The broad local V66 suite passed 108 commands after updating two stale cache
URL assertions; the new pursuit test and ownership/startup checks also pass.
Remote V66, ownership, startup, original-jab DCC/game validation and V164
real-model review passed at checkpoint `fe5ae28`; V66, ownership, startup
and jab validation also passed on polished source checkpoint `4932d51`.
Verify final-head CI and
Pages before claiming a current deployment.

Remaining review limits: exact knuckle/mesh contact and every moving-target
height are not certified by skeleton metrics. Some support correction can
still be visible during physical pursuit. A roughly 0.12-unit support-foot
discontinuity remains in the 60/120Hz replay, despite reachable limbs; its
post-sample cause is not yet proven. Trace it inside the existing ownership
chain rather than adding a compensating writer. Do not claim zero sliding
or final player approval of the full set. The low launcher can contact an already
airborne opponent's leg; chest-only distance is not a universal contact test.

## Authorized experimental jab publication

The user explicitly requested publishing the latest working jab on the existing
GitHub Pages game for visual playtesting, retaining the original version and
avoiding unrelated changes. This supersedes the earlier private-only gate for
this **one experimental jab**, not final aesthetic approval or default combat.
The entry is `?combatAnim=blender-jab-v1`; normal links keep original fighting.
A missing/invalid/timed-out clip falls back to original combat. The completed
fixes use the existing V72/V81 path, with no added animation wrapper.
Rollback tag `rollback/pre-blender-jab-2026-10-27-038ac13` is saved on GitHub at
original main `038ac13bb5de70c4e5f8473d8586f5ea7d10195e`. See the
[release record](KAIRO-JAB-PLAYTEST.md) for exact usage, limits and restoration.

## Recovered fighting-animation pipeline

The user supplied the interrupted prior chat and asked to fix the project, remove unnecessary clutter and build proper fighting animations. Continue the recovered PR #140 work rather than restarting another pose generator or reviving rejected Batch A.

The last recovered PR #140 source is `87ef5423286cd6bada943bebdbdfba5ea33509ab`, now available locally for continuation. It adds offline tools and CI, not a deployed replacement for combat. The user's transcript reports successful Blender-to-real-VRM transfer, connected-joint transfer, foot IK and continuous 30/60/120 FPS calibration. Those results are engineering evidence, not aesthetic approval. See [foundation report](KAIRO-COMBAT-FOUNDATION-2026-10-27.md) for exact historical runs and limitations; rerun affected checks for new changes.

The current recovered jab is an **EXPERIMENTAL, UNAPPROVED Blender step-in prototype**,
published only through the explicitly requested playtest flag. The T-pose/game-idle mismatch and VRM0
forward-axis error are fixed. `capture-kairo-combat-anchor.cjs` measures the
original standing skeleton; `author-kairo-original-jab.py` uses that hierarchy
with elbow/knee pole controls, a lead-foot step and pelvic drive; the verifier
bakes native local quaternions and per-frame pelvis translation. The private
player runs inside V72, with V81 hand/recovery behavior, no additional wrapper
and no asset loading unless the experimental query is present. Stun cancellation cannot resurrect the clip.

Local results: **109 regression checks passed**; source/VRM trajectories and real
hit, whiff, interruption, guard and idle recovery passed at **30/60/120Hz**.
Three continuous 36-frame front/side/back captures were generated and inspected.
See the [foundation report](KAIRO-COMBAT-FOUNDATION-2026-10-27.md#local-validation-of-the-recovered-implementation)
for exact evidence and limitations. Installed Blender 4.3.2 was used locally;
CI still pins verified 4.5.15 and has not been run for these local changes.

**Remaining:** the source ankle support is model-relative; the existing game
lunge still moves the root. Wrist-to-chest-center separation improved to
0.37–0.43 world units but does not establish actual fist/surface contact.
Refine support and contact plus the fast deep lunge's timing before expanding
into the whole combo before any promotion beyond the explicitly authorized experimental playtest. Original standing,
flight data, Rin, gameplay timing and hitboxes remain protected. The publication is an experimental exception explicitly requested by the player;
no final aesthetic approval is implied.

## Playable baseline and player decisions

| Area | Authoritative state |
|---|---|
| Playable roster | Kairo Venn and Rin Sable only; four further characters are design ideas |
| Main baseline | `038ac13bb5de70c4e5f8473d8586f5ea7d10195e`, the forward rollback of PR #139; check remote main for subsequent changes |
| Normal forward flight | V156 Q is accepted and default; boot uses V156 and V125 jump |
| Selected V164 flight | Opt-in `?flightVertical=v164`; four locked B choices: arm clearance, natural sway, balanced ascent, settling descent; exact 71 keyframes saved in repo; full combined gameplay remains unapproved |
| V165 | Existing opt-in Boost/speed/combat-feel option; preserve during combat work |
| Original fighting/idle/guard | Restored baseline; do not replace standing stance as collateral work |
| PR #140 | Recovered offline Blender/VRM foundation and unapproved jab; not evidence of shipped new combat |

**REJECTED:** V153 forward flight looked like a rigid stick; standard/V154 Boost were disliked; V155 looked twisted. V160–V162 up/down changes were over-tilted and barely moving. These verdicts supersede older optimistic CI or documentation claims.

**Batch A / PR #139 was REJECTED and withdrawn.** The user said it ruined standing/fighting stance and looked like old Mixamo or looked horrible. Rollback restored executable game/assets/workflows byte-for-byte to pre-PR `8e77ebd`, retaining rejection notes. `?combatAnim=kairo-a1` no longer activates replacement combat; do not offer it or resurrect its authored assets. Full reasons and mandatory acceptance gates are in [rejection record](KAIRO-BATCH-A-REJECTED-2026-10-27.md). The [Kairo/Rin choreography blueprint](KAIRO-RIN-COMBAT-ANIMATION-REDESIGN-BLUEPRINT-2026-10-27.md) remains a plan, not an implementation or permission to repeat the rejected approach.

## Source and ownership facts

- `src/*.js` are editable game source; `js/game.js` is generated by `python3 tools/build.py`. Keep both. `tools/assistant-checkup.cjs --strict` verifies bundle consistency, roster, flags and reference-model identity.
- Actual Kairo is VRM0 at `assets/characters/kairo.vrm`; Rin's distinct model is `assets/rin.vrm`. Preserve model bytes and SHA-bound data. The guide skeleton and visible normalized VRM are different representations.
- V100 owns selected Kairo jump/fall/landing/normal-flight states, not all animation. V72 owns recorded action/Boost poses; V81 blends transitions; combat/guard/damage/ground locomotion and Rin still involve legacy paths. Do not introduce a competing writer. Read [ownership contract](ANIMATION-OWNERSHIP-CONTRACT.md) and inspect actual per-bone writes where needed.
- Current Kairo attack contacts are .24/.24/.33/.41s and durations .55/.55/.68/.87s, with optional V165 tempo. Do not adjust gameplay clocks or hitboxes to conceal animation misalignment.
- [Pose Lab](KAIRO-POSE-LAB-WORKFLOW.md) supports actual normalized-joint authoring and SHA-checked references; it does not supply production foot IK, weight transfer or automatic aesthetic quality. Combat uses the recovered Blender/IK work for those needs.
- V156 Q canonical data is in `assets/animations/kairo/flight-library.v1.json`. V164's selected sources are retained under `assets/animations/kairo/selected/v164/`; see [flight guide](KAIRO-V164-SELECTED-FLIGHT-PLAYTEST.md). Do not re-request the four completed B choices.

## Cleanup and efficient validation

Remove stale instructions and proven unused material rather than deleting active legacy modules by version number. The real VRMs account for most repository size; deleting a few small helpers does not establish faster gameplay. Preserve rollback routes, licensed-model notices, useful Blender/Pose Lab tools, source/bundle and regression coverage. See [cleanup audit](REPOSITORY-CLEANUP-AUDIT.md) and [animation/tool audit](REPOSITORY-ANIMATION-TOOLS-AUDIT-2026-10-26.md).

Prior cleanup saved the exact selected V164 sources, avoided repeated artifact downloads, targeted heavy V100 checks to current V164 capture and closed obsolete PRs #60/#90/#91. Historical documentation recorded 130 merged branch refs still awaiting deletion; that count is not a current remote inventory. Do not claim branches were deleted without checking.

Cache installed tools, batch changes, run focused checks while iterating and relevant full safety/30–60–120 FPS checks at milestones. A green logic suite is not artistic approval. Continuous real-character footage and actual gameplay tests answer different questions from static pose screenshots.

The player wants assistant-operated implementation and inspection. They **do not want to operate** Pose Lab, export rigs, install packs, capture debugging clips or repeatedly explain the project. Avoid unsolicited images/videos and piecemeal stance/punch approval prompts. Keep progress reports candid about what was tested and what remains unapproved.
