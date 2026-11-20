# Shmup

An original vertical arcade shooter built with Phaser, TypeScript, and Vite. The first playable encounter tests how it feels to sweep across the screen, dodge, and return to a firing lane on an iPad with an 8BitDo Lite 2.

Pushes to `controller-flight` automatically rebuild the [public iPad preview](https://funkatron.github.io/Shmup/). Refresh after the Pages workflow succeeds and check the commit shown above the playfield.

## Play the crossing encounter

| Control or cue | What it does |
|---|---|
| D-pad or left stick | Steer in eight directions at 210 logical pixels per second. Release to stop. |
| Start (+) | Press once to pause. Press again to resume. |
| Bottom face button | Hold for continuous forward fire. Each yellow bolt stays in its firing lane. |
| Red wireframe ship | Crosses left to right every five seconds. A direct hit produces a gold burst. |
| Orange scouts | Five enter from the left in a shallow arc every ten seconds. Each takes one hit. |
| Green cargo carrier | Enters from the right at the start and every ten seconds. Shoot it once, then fly through the drifting green chip for a gold flash. |
| Magenta diamond | A surviving target fires one second into its pass. The shot travels straight toward your position at launch. |

To try the dodge, let the target fire first. Move across the diamond’s path, then hold fire and sweep back into position. A hit on your ship gives visual feedback and play continues.

### Compare the parallax

Violet folds scroll at 24 logical pixels per second beneath the blue canyon walls at 70. Try following the green chip while the scouts cross. Can you glance up at a target and find your ship and the incoming diamond again? Both previews run the same encounter. [With parallax](https://funkatron.github.io/Shmup/) · [Without the distant folds](https://funkatron.github.io/Shmup/?parallax=off)

### Compare the bridge

A dim blue truss travels with the canyon floor about once every nine seconds. Hold fire and sweep sideways as it passes beneath the ship. Watch the gaps between your yellow bolts and the magenta incoming diamond. Use the same maneuver in both previews. [With the bridge](http://127.0.0.1:4273/) · [Without the bridge](http://127.0.0.1:4273/?bridge=off)

## Run on Raiden and play on iPad

1. **Build.** Use Node 24, npm, and a checkout of the branch you want to play. From the checkout run `npm ci && npm run build`.
2. **Start the preview.** Leave this running in a terminal or tmux window on Raiden.

   ```sh
   npm exec -- vite preview --host 127.0.0.1 --port 4173 --strictPort
   ```

3. **Connect the iPad.** In Termius, start a **Local** forwarding rule with bind address `127.0.0.1`, local port **4273**, your saved Raiden SSH host, and destination `127.0.0.1:4173`. Open the preview in Safari, connect the Lite 2 over Bluetooth, and press a face button. [Open the iPad preview](http://127.0.0.1:4273/)
4. **Try a change.** In a second shell on the same branch, run the line below, then refresh Safari. Compare the printed commit with the one above the playfield. The UTC timestamp identifies the individual build, including rebuilds of the same commit.

   ```sh
   git pull --ff-only && npm run build && git rev-parse --short=7 HEAD
   ```

If Safari cannot connect, check `curl http://127.0.0.1:4173/` on Raiden. If that returns the flight-test HTML, check that the Termius rule is running and Safari is using port **4273**. Restart the preview process after changing its server configuration. For local development with automatic reloads, run `npm run dev` and open the URL Vite prints.

## Project notes

[Agent log and design references](agents/log.md) · [Contributor instructions](AGENTS.md)

## Movement reference

The [Musha Aleste flight study](docs/musha-aleste.md) breaks down Edward’s Stage 1 reference clip and explains how scroll landmarks, forward fire and drone formations affect the feel of a sweep.
