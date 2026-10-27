# Kairo descending motion visual selection — user to choose

**Already selected and protected:** (1) **B arm spacing**: both arms slightly away from torso; (2) **B natural motion**: arm+forearm lag; (3) **B balanced ASCENDING**, 65% of a modest real-VRM lift. Those choices are in GitHub main. The next **separate** decision is only descending, not a reopen of those three B selections.

Assistant-operated headless WebGL Pose Lab renders A = featherlight sink, B = natural settling, C = soft braking, with full 20-bone VRM0 quaternion 2-second clips, 36 front frames and three side frames. Each starts from the **exact same user-picked B static flight pose plus B arm motion**. Small spine, chest, knee and ankle offsets create controlled gentle descending; no Goku dive, no 30-degree torso lean, no abrupt widening. These are **candidates**, not player-approved gameplay. Await player visual selection A/B/C, then integrate all approved B+B+B+descent choices together behind a separate URL and test real-world video.

GitHub workflows use Playwright and Pillow from original real-Kairo B ascending study, successfully completed in run 40421353502.

## Verified real-Kairo visual capture (2026-10-27)

Real model WebGL GitHub Actions [run #40425774416](https://github.com/Theo524/sky-clash/actions/runs/40425774416) **PASSED**, artifact **12699498850**. Contains original 25-keyframe, 20-normalized-bone quaternion source for all three variants (`B-descend-A.pose.json`, `B-descend-B.pose.json`, `B-descend-C.pose.json`); three front-view looping GIFs, one **clean three-up GIF** `choose-B-descending-A-B-C.gif`, 36 actual Kairo WebGL PNG frame screenshots, side views and model geometry. All share selected B standing hover and selected B natural arm sway. No published game code was edited.

At peak, real VRM0 torso angle from upright: B base **1.16°**, A descent **1.55°**, B descent **1.97°**, C descent **2.41°**. Left/right knee measured angle from straight: baseline **95.7° / 18.6°**, A **94.1° / 17.4°**, B **92.5° / 16.1°**, C **90.7° / 14.8°**. These are slight positional/leg extensions rather than dramatic crouching. Do not claim significant bending or artistic acceptance from those metrics. Visuals show subtle settling and small controlled arm changes, preserving hover silhouette.

**Await player selection of descending A/B/C.** All three earlier B choices (stance, natural sway, balanced ascent) were already selected; no new flight mode should be merged into the playable game until the descent choice and transition video inspection are complete.

## Player final selection 2026-10-27

**B — Natural settling** selected by player, from run #40425774416 artifact #12699498850 (`B-descend-B.pose.json`). All four visual decisions complete: **B flight stance, B arm natural sway, B balanced ascent, B natural settling descent.** The real-VRM authored pose-data must be integrated into the new opt-in flight preview, tested with in-game Kairo; no default Q promotion yet. Do not reopen the choices until player sees the full new playable build.
