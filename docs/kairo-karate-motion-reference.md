# Kairo Storm Fist — real-karate motion references and visual sign-off

**Status: REJECTED / draft only.** This is a review standard, NOT a declaration that any rendered Kairo animation looks good. Do not merge or publish until a side-by-side real-game review passes. Green Blender/IK tests are not artistic approval.

## Real demonstrations to match

| Game clip | Karate technique | Human reference | Non-negotiable mechanics |
| --- | --- | --- | --- |
| `rising-kick` | **Mae-geri keage**, front snap kick | [Sensei Jason front-kick demonstration](https://www.youtube.com/watch?v=-iq_RFVEfQY), [Stanford Shotokan kicks](https://karate.groups.stanford.edu/resources/kihon/kicks) | Knee lifts **before** the lower leg opens; foot stays tucked under the bent knee for the chamber; knee drives toward opponent; shin extends with toes pulled back; shin **snaps back to the raised chamber** before foot returns to stance. Supporting foot remains grounded and shoulders don't fold into the knee. |
| `roundhouse` | **Mawashi-geri**, roundhouse | [Shotokan Karate Online stepping mawashi geri tutorial](https://www.shotokankarateonline.com/blog/mawashi-geri-round-kick-stepping-from-fighting-kamae-stance/), [Stanford Shotokan kicks](https://karate.groups.stanford.edu/resources/kihon/kicks) | Raise right knee to the outside and near target height, **turn the left support foot**, rotate the pelvis toward the target, and swing the bent knee around before releasing the lower leg across the opponent. Impact arrives **with** hip rotation; recoil pulls the lower leg back with knee still raised. Do not deliver a frontal leg lift and rename it roundhouse. |
| `side-kick` | **Yoko-geri kekomi**, side thrust kick | [Sensei Jason side-kick demo](https://www.youtube.com/watch?v=8schkI_yxBk&t=121s) (2:01–3:02 thrust section), [Shotokan three-kick combination](https://www.shotokankarateonline.com/blog/brown-belt-basics-mae-geri-yoko-geri-kekomi-mawashi-geri-combination-1/amp/) | Knee chambers tightly, right heel tucked across toward supporting knee, support foot pivots, pelvis turns sideways, then the **heel/edge thrusts through the target** while the thigh and shin align. Torso counterbalances without pitching like a rag doll; retract knee into the SAME chamber before lowering. A forward shin lift with the chest facing front is **not** a side thrust kick. |

Published biomechanics reference for the importance of foot pivot/hip momentum: [Physics of martial arts](https://pmc.ncbi.nlm.nih.gov/articles/PMC8354461/). Source recordings used in this branch are pinned [CMU motion capture subject 135](https://mocap.cs.cmu.edu/search.php?subjectnumber=135) karate trials 04/07/11. These are *data*, while the above demonstrations are the *technique-quality standard*. Do not copy demonstration videos or unlicensed animations into the game.

## What the last rejected footage got wrong

- Striking shoe reached its farthest point **before** the scripted `impactSeconds` in at least the side kick: an out-of-phase FX event made a folding/retracting leg look like the hit.
- Kicking and support knee IK can stay within reach while bending around a wrong joint plane; constraints must inspect **evaluated knee vectors**, not merely ankle target errors.
- Side kick remained chest-forward instead of showing the sideways hip turn and a heel thrust.
- No crisp knee-up / extension / recoil silhouettes; arms and chest seemed disconnected from real shifting weight.
- Green 19-clip tests, frame-rate passes, and foot-length constraints did not prove realistic martial-arts technique.

## Required visual review, not optional polish

1. **Front and side, continuous 30+ FPS**: film each complete 0.87s kick including visible pre-chamber and post-impact recoil, not only the impact pose; compare these with the reference demonstrations at normal speed and slow motion.
2. **Five identifiable stages** for every kick: planted fighting stance → raised knee chamber → hip/pivot transfer → impact with extended striking surface → knee re-chamber and controlled return. Impact must be the actual maximum directed reach rather than an arbitrary frame index.
3. **Anatomical chain**: both shins attached to measured knees, knee hinges into the captured bend hemisphere, no backwards-hinging, leg snaps or pole flips. Compare recovered **evaluated joint positions** with the motion source.
4. **Supporting foot**: remain anchored at contact, rotate around the sole and share the pivot with the pelvis. No skate, impossible leg reach, toe-spin with frozen hips or hyperextended planted knee.
5. **Weight and guard**: hips rotate/shift *before* the foot hits, chest counterbalances and hands retain purposeful guard/counter-swing. Don't over-rotate a rigid upright body.
6. **Regression**: unchanged original standing, flight, punches, game controls, Rin, native animation owner and all **19 clips**. No default-game/live deployment while this is a candidate.

Any missing stage, knee reversal, foot-slide or mannequin-like silhouette fails acceptance. If source karate trial lacks a suitable complete five-stage motion, **change the mocap take or source**, not fake it with a few foot position keys.
