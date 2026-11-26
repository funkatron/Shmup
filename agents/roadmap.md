# Roadmap

Sequenced from the review of the local tree on 2026-11-26. Do not start a later phase to avoid the exit check of an earlier one. Do not merge or deploy without authorization. Leave the version at `0.0.0` until phase 3.

## Phase 0 · Make both diffs real

The game changes land on `dev-preview`. The Pages workflow change lands on `publish-triggering-commit`, opened against `main`.

- Commit the game, tests, docs, and favicon on `dev-preview`.
- Check the workflow edit out on a normal `main` working tree and commit it there. `cancel-in-progress` is true, and a `workflow_run` checks out `github.event.workflow_run.head_sha`. Manual dispatch still checks out `dev-preview`.
- Open the two pull requests. Do not merge them in this phase.

Exit: both diffs are on branches a fresh clone can see, and `git worktree list` no longer holds the only copy of the workflow.

## Phase 1 · Draw the city once per frame

`simSlices` can call `advance` three times per displayed frame, and `advance` redraws the city every time. On a slow iPad that multiplies the work that made the frame late.

- Keep the time remainder.
- Run `City.draw` once per displayed frame. Substep shots, enemies, weapons, and the clock.

Exit: a forced 100ms hitch still advances about 100ms of combat, and the city is drawn once. The existing slice tests still pass, with a test that the render step is separate from the sim step.

## Phase 2 · iPad playtest

One session on iPad Safari with the Lite 2, after phase 1. Record it in `agents/log.md`.

- Cannon rest after four shots.
- Warden hits against the drawn hull.
- The chip that arrives once the cannon is full.
- Crown Gate behind boss practice, and the `SUPER WARDEN` label after the arrival.
- Whether a busy Neon Port pass holds frame time.

Exit: the log says which of those felt right, and names the commit on screen.

## Phase 3 · Authorize 0.1.0

Recommend `0.1.0` only if phase 2 did not send a feel change back. Bump `package.json` when authorized. The header already shows the commit and the build time beside the version.

Exit: the version, the log, and the running build agree.

## Phase 4 · Tests that run on push

`npm test` passes locally and does not run on a push. `.github/workflows/preview-branch.yml` only echoes.

- Run `npm test` and `tsc --noEmit` on the push that requests the playtest.
- Add scene checks for two behaviors that are still untested: a patrol Warden increments the Wardens stat when its 10 HP reaches 0, and a reserve banks only when cannon, missiles, and four drones are all full.

Exit: a red test fails the playtest signal, and those two behaviors fail a test if they regress.

## Phase 5 · City cost, only with numbers from phase 2

If the iPad pass holds frame time, stop. If it does not, profile `City.draw` and cut the per-frame allocations in that function. Do not split `FlightScene` as a prerequisite. It is 1,112 lines, and the rules that already have a second caller live in `src/rules.ts`.

Exit: either the log says the city is fast enough, or a measured change drops iPad frame time without a new stage or a new control.

## Phase 6 · Split FlightScene where a test needs a seam

`FlightScene` stays one class through phase 5. Split it when a test cannot reach a behavior without booting Phaser and the DOM. The first candidates are the ones phase 4 had to reach through the scene: chip pickup and reserve banking, patrol Warden death, and the separation of `City.draw` from the combat step. Each new module gets a caller and a test in the same change. A folder of systems with no test is not this phase.

Exit: the behaviors that moved have tests that fail if they regress, and `FlightScene` no longer owns that code.

## Phase 7 · Impact synth

`src/impact.ts` is 350 lines of synthesis, mute memory, and Safari unlock. Rewrite it when a cue is wrong in a playtest, or when a test needs a profile without an `AudioContext`. Split along the cue groups the tests cover: hulls, projectiles, and the one-shot cues. Keep the mute key `shmup.muted` and the silent buffer that unlocks Safari.

Exit: the changed cues have tests at the sample level, and a playtest note says the cue that prompted the work is fixed.

## Phase 8 · Touch redesign

The bottom deck and the one-finger playfield drag stay as they are through the Lite 2 session. Redesign touch when phase 2 says the deck is out of reach, the drag fights the deck, or a session is played with no controller. Keep the header, the playfield, and the deck in the same three rows. A control that appears must not move Pause, sound, or the score.

Exit: the log names the reach or conflict that prompted the change, and the same three bands are still there at iPad size.

## Phase 9 · Second stage

Glass Meridian remains the only stage until `0.1.0` is authorized and phase 2 kept its feel. A second stage is a new route beside `src/meridian.ts`, with its own city landmarks and its own boss clock, using the chip, cannon, and Warden rules already in `src/rules.ts`. It does not add another chain of encounter conditions inside `FlightScene`.

Exit: the new route has a playtest entry in the log, the first stage still boots unchanged, and the shared weapon rules still pass their tests.
