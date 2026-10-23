# V100 — Kairo animation authority (air-motion preview)

The user-approved animation stack is layered and historical: native Fighter/VRMRig,
V71 walk, V76 approved idle/walk arms, V72 recorded actions, V79 optional actions,
V81 pose transitions/fingers and V89 grounded first-step/foot support. Every layer
could write some of the same normalized VRM bones during one frame. That was the
root cause of repeated pose conflicts despite locally successful V94/V97/V99 fixes.

## Safe consolidation rule

**One final pose writer per gameplay state / bone group.** All competing layers
must explicitly opt out when another controller has exclusive ownership. Do
not stack different recorded source rigs and then "correct" the resulting
wrist/elbow angles.

The V100 first implementation scopes this authority to real jumps, gravity
falls and their contact landing. It is not yet a complete rewrite of combat or
ground locomotion, which have been visually approved and remain untouched.

Use:

- Existing V99: `?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&airHands=stable`
- V100 air owner: `?movementLab=step&stance=handoff&joystickRun=on&idleArms=anchored&airLab=jump&animator=unified`
- Remove `animator=unified` to roll back immediately (no asset replacement).
- The opt-in V100 owner requires decoded UE5 `jump`, `fallingIdle` and
  `landing` clips from the **existing V72 action loader**, not a second source.

## Runtime data flow

```
Fighter physics (unchanged: jumpVel 14, gravity 34, 0.48 s landing window)
  |
VRMRig procedural baseline (scaffold, facial expressions, collision lift)
  |
V71/V76/V72/V79/V81 (explicitly yield for airborne authority only)
  |
V89 grounded support correction (already yields when step inactive)
  |
V100 one final pose writer
  |-- jump: recorded UE5 jump-up, short ~120 ms transition
  |-- fall: recorded UE5 falling idle, short ~140 ms transition
  |-- landing: recorded UE5 landing synced to 0.48 s physical contact
  |-- fingers: Kairo's native VRM bind pose (not V81 artificial curls)
  |-- wrists: bounded relative to pre-jump fighting posture
  |-- return: short fade into already approved ground owner
  +-- attack/guard/damage/Boost/flips/intentional hover: yield immediately
```

The authoritative decision uses `jumping`, `dropping`, and
`landingMotionT` plus combat priority. Height-based `flying` is not
evidence of an actual jump or gravity fall; normal powered hover is preserved.

**Do not** merge future animation features by introducing another nested
`fighter.animate` writer. Extend the authority/state resolver and submit
candidate poses to its existing bone owner. Split future states into:
ground idle/first-step/walk/run (preserve V94/V95/V97), Boost/dash,
guard/attack, jumping/falling/landing, powered flight, damage. Eventually
the legacy wrappers can be retired individually once the corresponding
recorded clip and final-pose behavior have visual acceptance.

## Verification

`node tests/v100-single-pose-authority.js` uses an actual parented
Three.js bone hierarchy and the real V76/V72/V79/V81 wrappers before V100.
It verifies no older recorder advances/writes while the air owner is active,
checks actual normalized leg/arm/wrist/finger poses, contact landing and
immediate guard interruption, and verifies return to approved grounded idle.

Node tests verify ownership and numeric pose continuity, **not rendered
aesthetics, mesh penetration, twist anatomy or image quality**. Inspect the
site visually before making the new controller a default. In particular,
review standing jump, moving jump, apex, contact knee bend, return to
walking, intentional flight, guard and flip.
