# Shmup agent instructions

- Build with npm ci and npm run build. Test the flight scene in iPad Safari with the 8BitDo Lite 2.
- Prioritize smooth, sweeping controller movement. Touch controls are deferred.
- Put additional agent documentation in agents/. Give PRs a verification checklist and check Copilot reviews.
- Use semantic versions for intentional milestones. Keep build timestamps and commit IDs separate. Merge, tag, and deploy only with authorization.

## Start here

Read the [README](README.md) for controls and the Raiden preview workflow. Read the latest [agent log entry](agents/log.md) before tuning movement or visuals. src/main.ts owns the encounter and controller input, src/beam.ts owns the traced shapes and glow, and vite.config.ts supplies the build identity.

## Document work as it lands

- Update agents/log.md in the same PR as each meaningful change. Include the date, PR or build, rationale, checks actually run, device feedback, and the next unresolved question. Group small iterations together.
- Link references beside the decisions they informed. Identify measured values, player impressions, and implementation choices separately.
- Update README.md when controls, setup, or the playtest workflow changes. Keep agent-only handoffs in agents/ and link them from the log where relevant.

## Verify and release

- Run the production build. For TypeScript changes, run the current explicit compiler check from the repository root:

  ```sh
  npm exec -- tsc --noEmit --skipLibCheck --target es2022 --module esnext --moduleResolution bundler src/main.ts
  ```

- Report simulated checks separately from physical iPad and Lite 2 playtests. Record pending hardware checks in the PR checklist. Preserve stable positions for the playfield, controls, and diagnostics.
- Use MAJOR.MINOR.PATCH for intentional milestones. During 0.x, recommend a minor increment for significant features or breaking changes and a patch for fixes or small improvements. Reserve 1.0.0 for an approved stable release.
- Before release, review changes since the previous milestone, align version metadata and release notes, verify relevant tests, CI and Copilot reviews, and obtain authorization to merge, tag or deploy. Confirm deployment independently after a release.
